/*
 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
 ~                                                                           ~
 ~ Copyright (c) 2015-2026 miaixz.org and other contributors.                ~
 ~                                                                           ~
 ~ Licensed under the Apache License, Version 2.0 (the "License");           ~
 ~ you may not use this file except in compliance with the License.          ~
 ~ You may obtain a copy of the License at                                   ~
 ~                                                                           ~
 ~      https://www.apache.org/licenses/LICENSE-2.0                          ~
 ~                                                                           ~
 ~ Unless required by applicable law or agreed to in writing, software       ~
 ~ distributed under the License is distributed on an "AS IS" BASIS,         ~
 ~ WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  ~
 ~ See the License for the specific language governing permissions and       ~
 ~ limitations under the License.                                            ~
 ~                                                                           ~
 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
*/

/**
 * Verifies the exact public package boundary.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { pathToFileURL } from "node:url";

import { describe, expect, it } from "vitest";

import * as publicApi from "../../src/index.js";
import * as catalogApi from "../../src/values/metadata.js";
import * as runtimeApi from "../../src/runtime/index.js";
import { ICON_NAMES } from "../../src/values/icons.js";

const repositoryRoot = resolve(process.cwd(), "../..");

describe("icon package skeleton", () => {
  it("accepts only new generated/catalog outputs and enforces raw byte budgets", async () => {
    const { allowedDistFile } = await import(
      pathToFileURL(
        resolve(repositoryRoot, ".github/scripts/modules/icons/quality/validate-icon-package.mjs"),
      ).href
    );
    for (const entry of ["values/icons", "values/metadata", "values/design"])
      for (const suffix of [".js", ".js.map", ".d.ts", ".d.ts.map"])
        expect(allowedDistFile(entry + suffix)).toBe(true);
    for (const entry of ["autogen/icons", "autogen/metadata", "autogen/design"])
      for (const suffix of [".js", ".js.map", ".d.ts", ".d.ts.map"])
        expect(allowedDistFile(entry + suffix)).toBe(false);
    for (const name of ["mapping", "runtime", "glyph-map", "catalog", "codepoints", "names"])
      for (const suffix of [".js", ".js.map", ".d.ts", ".d.ts.map"])
        expect(allowedDistFile("values/" + name + suffix)).toBe(false);
    for (const path of [
      "autogen/mapping.js",
      "autogen/mapping.js.map",
      "autogen/mapping.d.ts",
      "autogen/mapping.d.ts.map",
      "autogen/runtime.js",
      "autogen/runtime.js.map",
      "autogen/runtime.d.ts",
      "autogen/runtime.d.ts.map",
      "autogen/glyph-map.js",
      "autogen/glyph-map.js.map",
      "autogen/glyph-map.d.ts",
      "autogen/glyph-map.d.ts.map",
      "autogen/catalog.js",
      "autogen/catalog.js.map",
      "autogen/catalog.d.ts",
      "autogen/catalog.d.ts.map",
      "catalog.js",
      "catalog.js.map",
      "catalog.d.ts",
      "catalog.d.ts.map",
      "autogen/names.js",
      "assets/catalog.json",
      "catalog.ts",
    ])
      expect(allowedDistFile(path)).toBe(false);
    const { limits } = JSON.parse(
      readFileSync(resolve(process.cwd(), "src/assets/design.json"), "utf8"),
    ) as { limits: { fontBytes: number; runtimeBytes: number } };
    expect(
      readFileSync(resolve(process.cwd(), "dist/values/icons.js")).byteLength,
    ).toBeLessThanOrEqual(limits.runtimeBytes);
    expect(
      readFileSync(resolve(process.cwd(), "dist/assets/fonts/miaixz-icons.woff2")).byteLength,
    ).toBeLessThanOrEqual(limits.fontBytes);
  });
  it("imports built catalog separately and keeps the root dependency graph free of it", async () => {
    const root = await import(pathToFileURL(resolve(process.cwd(), "dist/index.js")).href);
    const catalog = await import(
      pathToFileURL(resolve(process.cwd(), "dist/values/metadata.js")).href
    );
    expect(Object.keys(root).sort()).toEqual([
      "Icon",
      "isIconName",
      "parseIconName",
      "preloadIconFont",
    ]);
    expect(Object.keys(catalog)).toEqual(["ICON_CATALOG"]);
    expect(catalog.ICON_CATALOG).toEqual(catalogApi.ICON_CATALOG);
    expect(existsSync(resolve(process.cwd(), "dist/values/metadata.d.ts"))).toBe(true);
    const visited = new Set<string>();
    /**
     * Traverses relative runtime imports in built JavaScript.
     *
     * @param path - Absolute compiled module path.
     * @returns Traversal completion.
     */
    function walk(path: string): void {
      if (visited.has(path)) return;
      visited.add(path);
      const source = readFileSync(path, "utf8");
      for (const match of source.matchAll(/(?:from\s+|import\s*)["'](\.[^"']+)["']/gu))
        walk(resolve(dirname(path), match[1]!));
    }
    walk(resolve(process.cwd(), "dist/index.js"));
    expect([...visited].some((path) => path.endsWith("/values/metadata.js"))).toBe(false);
  });
  it("exports exactly the frozen runtime values", () => {
    expect(Object.keys(publicApi).sort()).toEqual([
      "Icon",
      "isIconName",
      "parseIconName",
      "preloadIconFont",
    ]);
    expect(Object.keys(catalogApi)).toEqual(["ICON_CATALOG"]);
    expect(catalogApi.ICON_CATALOG.map((entry) => entry.name)).toEqual(Object.keys(ICON_NAMES));
    expect(Object.keys(runtimeApi).sort()).toEqual([
      "isIconName",
      "parseIconName",
      "preloadIconFont",
    ]);
    expect(Object.isFrozen(catalogApi.ICON_CATALOG)).toBe(true);
    for (const entry of catalogApi.ICON_CATALOG) {
      expect(Object.keys(entry)).toEqual(["name", "category"]);
      expect(Object.isFrozen(entry)).toBe(true);
    }
  });

  it("contains only the four supported package exports", () => {
    const manifest = JSON.parse(readFileSync(resolve(process.cwd(), "package.json"), "utf8")) as {
      readonly exports: Readonly<Record<string, unknown>>;
    };
    expect(Object.keys(manifest.exports)).toEqual([
      ".",
      "./catalog",
      "./styles.css",
      "./font.woff2",
    ]);
    expect(manifest.exports["./catalog"]).toEqual({
      types: "./dist/values/metadata.d.ts",
      import: "./dist/values/metadata.js",
    });
    expect(existsSync(resolve(process.cwd(), "src/values/icons.ts"))).toBe(true);
    expect(existsSync(resolve(process.cwd(), "src/autogen"))).toBe(false);
    expect(existsSync(resolve(process.cwd(), "dist/autogen"))).toBe(false);
    expect(existsSync(resolve(process.cwd(), "src/autogen/mapping.ts"))).toBe(false);
    expect(existsSync(resolve(process.cwd(), "src/autogen/runtime.ts"))).toBe(false);
    expect(existsSync(resolve(process.cwd(), "src/autogen/glyph-map.ts"))).toBe(false);
    expect(existsSync(resolve(process.cwd(), "src/autogen/catalog.ts"))).toBe(false);
    expect(existsSync(resolve(process.cwd(), "src/catalog.ts"))).toBe(false);
    const rootSource = readFileSync(resolve(process.cwd(), "src/index.ts"), "utf8");
    expect(rootSource).not.toMatch(/catalog|ICON_NAMES|IconTier|OpticalClass|IconDirection/u);
    const fontSource = readFileSync(resolve(process.cwd(), "src/runtime/font.ts"), "utf8");
    expect(fontSource).not.toMatch(/catalog|new Map|new Set|INTERNAL_ICON_RECORDS/u);
    expect(existsSync(resolve(repositoryRoot, "providers"))).toBe(false);
  });
});

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
 * Freezes the icons module inside the unified examples application.
 */

import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const testRoot = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(testRoot, "../../..");
const exampleRoot = resolve(repositoryRoot, "examples/src/module/icons");

describe("icons example module", () => {
  it.each(["avatar", "feedback", "toast", "upload"])(
    "keeps %s on the lightweight name API",
    async (name) => {
      const source = await readFile(
        resolve(repositoryRoot, "packages/ui/src/components", name, name + ".tsx"),
        "utf8",
      );
      expect(source).toContain('from "@miaixz/icons"');
      expect(source).not.toMatch(
        /ICON_NAMES|@miaixz\/icons\/catalog|IconTier|OpticalClass|IconDirection/u,
      );
      expect(source).toMatch(
        /"(?:(?:user-round)|info|circle-check|warning|circle-alert|loading|file)"/u,
      );
    },
  );
  it("covers catalog, axes, inspection, accessibility, and failure status", async () => {
    const source = await readFile(resolve(exampleRoot, "icons-guide.tsx"), "utf8");
    for (const token of [
      "ICON_CATALOG",
      "Icon",
      "fill",
      "opsz",
      "semanticSizes",
      "accessibility",
      "direction",
    ]) {
      expect(source).toContain(token);
    }
    expect(source).toMatch(/import \{ ICON_CATALOG \} from "@miaixz\/icons\/catalog"/u);
    expect(source).toContain("record.name.includes(normalizedQuery)");
    expect(source).toContain("record.category.includes(normalizedQuery)");
    expect(source).toContain("const pageSize = 96");
    expect(source).toContain("matches.slice(page * pageSize, (page + 1) * pageSize)");
    expect(source).toContain('record.name.split("-")[0] === family');
    expect(source).toContain("[0, 0.25, 0.5, 0.75, 1]");
    expect(source).not.toContain("visibleLimit");
    const catalog = await import("../src/values/metadata.js");
    const names = catalog.ICON_CATALOG.map((record) => record.name).sort();
    const pages = Array.from({ length: Math.ceil(names.length / 96) }, (_, index) =>
      names.slice(index * 96, (index + 1) * 96),
    );
    expect(pages.flat()).toEqual(names);
    expect(new Set(pages.flat()).size).toBe(names.length);
    expect(pages.at(-1)?.length).toBeGreaterThan(0);
    expect(names.filter((name) => name.split("-")[0] === "car")).not.toContain("carrot");
    expect(source).not.toMatch(/record\.aliases|ICON_NAMES|(?:autogen|values)\//u);
    expect(source).not.toMatch(/IconProvider|icons-(?:lucide|phosphor|fontawesome|iconify)/u);
  });
  it("uses all eight pilots and six real sizes without per-name transforms", async () => {
    const source = await readFile(resolve(exampleRoot, "icons-guide.tsx"), "utf8");
    const css = await readFile(resolve(exampleRoot, "icons-guide.module.css"), "utf8");
    for (const name of [
      "layout-dashboard",
      "folder",
      "building",
      "shield-check",
      "workflow",
      "scroll-text",
      "server-cog",
      "settings",
    ])
      expect(source).toContain(`"${name}"`);
    expect(source).toContain("[12, 16, 20, 24, 32, 40]");
    expect(source).toMatch(/name=\{name\}\s+size=\{size\}\s+variant="outline"/u);
    expect(source).toMatch(/name=\{name\}\s+size=\{size\}\s+variant="filled"/u);
    expect(source).not.toMatch(/refinement\.json|resolveMiaixzIcon|interpolateIconSource/u);
    expect(css.slice(css.indexOf(".refinementGrid"), css.indexOf(".inspector"))).not.toMatch(
      /transform:|scale\(/u,
    );
  });
  it("mounts the native comparison matrix only while its disclosure is open", async () => {
    const source = await readFile(resolve(exampleRoot, "icons-guide.tsx"), "utf8");
    expect(source).toContain("const [matrixExpanded, setMatrixExpanded] = useState(false)");
    expect(source).toContain("setMatrixExpanded(event.currentTarget.open)");
    expect(source).toMatch(/<details\s+onToggle=/u);
    expect(source).toMatch(
      /matrixExpanded && \([\s\S]*?visible\.map[\s\S]*?refinementSizes\.map[\s\S]*?refinementFills\.map/u,
    );
  });
});

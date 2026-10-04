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
 * Verifies the complete JSON, Designspace, UFO, geometry, and topology source graph.
 */

import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { describe, expect, it } from "vitest";

const repositoryRoot = resolve(process.cwd(), "../..");
const assetsRoot = resolve(process.cwd(), "src/assets");
const packageRequire = createRequire(import.meta.url);
const Ajv2020 = packageRequire("ajv/dist/2020").default as new (options: unknown) => {
  addSchema: (schema: unknown) => void;
  getSchema: (id: string) => ((value: unknown) => boolean) | undefined;
};
const loaderUrl = pathToFileURL(
  resolve(repositoryRoot, ".github/scripts/modules/icons/source.mjs"),
).href;
const { loadIconSource } = (await import(loaderUrl)) as {
  loadIconSource: (options?: { validateUfo?: boolean }) => Promise<{
    icons: readonly { name: string; codepoint: number; category: string }[];
    categories: readonly string[];
    shardPaths: readonly string[];
  }>;
};

describe("icon source graph", () => {
  it("validates every source record and all six UFO masters", async () => {
    const source = await loadIconSource({ validateUfo: true });
    expect(source.icons).toHaveLength(1781);
    expect(source.categories.length).toBeGreaterThan(1);
    expect(source.shardPaths).toHaveLength(7);
    expect(source.icons[0]).toMatchObject({ name: "accessibility", codepoint: 0xf0000 });
    expect(source.icons.at(-1)).toMatchObject({ name: "zoom-out", codepoint: 0xf06f4 });
    expect(new Set(source.icons.map(({ category }) => category))).toEqual(
      new Set(source.categories),
    );
  });

  it("rejects unknown manifest fields through Draft 2020-12", async () => {
    const schema = JSON.parse(
      await readFile(resolve(assetsRoot, "source.schema.json"), "utf8"),
    ) as Record<string, unknown>;
    const manifest = JSON.parse(
      await readFile(resolve(assetsRoot, "icons.json"), "utf8"),
    ) as Record<string, unknown>;
    const ajv = new Ajv2020({ allErrors: true, strict: true });
    ajv.addSchema(schema);
    const validate = ajv.getSchema("https://miaixz.org/schema/icons/source.json#/$defs/manifest");
    expect(validate).toBeDefined();
    expect(validate?.({ ...manifest, formatVersion: "0.6.5" })).toBe(false);
  });

  it("keeps one-word category boundaries and audited semantic assignments", async () => {
    const manifest = JSON.parse(await readFile(resolve(assetsRoot, "icons.json"), "utf8")) as {
      readonly categories: readonly { readonly id: string; readonly description: string }[];
    };
    expect(manifest.categories.every(({ id }) => /^[a-z]+$/u.test(id))).toBe(true);
    expect(
      manifest.categories.every(({ description }) => description.includes("; excludes ")),
    ).toBe(true);
    expect(manifest.categories.map(({ id }) => id)).not.toEqual(
      expect.arrayContaining(["core", "misc", "other"]),
    );

    const source = await loadIconSource();
    const categoryByName = new Map(source.icons.map(({ name, category }) => [name, category]));
    expect(
      Object.fromEntries(
        [
          "banana",
          "bird",
          "book",
          "building",
          "cable-car",
          "card-sim",
          "carrot",
          "cloud-backup",
          "mouse-pointer-ban",
          "send-to-back",
        ].map((name) => [name, categoryByName.get(name)]),
      ),
    ).toEqual({
      banana: "food",
      bird: "animals",
      book: "education",
      building: "buildings",
      "cable-car": "transport",
      "card-sim": "devices",
      carrot: "food",
      "cloud-backup": "development",
      "mouse-pointer-ban": "interface",
      "send-to-back": "actions",
    });
  });

  it("keeps project versions out of every source JSON", async () => {
    const source = await loadIconSource();
    const documents = ["icons.json", "design.json", "source.schema.json", ...source.shardPaths];
    for (const path of documents) {
      const value = JSON.parse(await readFile(resolve(assetsRoot, path), "utf8")) as unknown;
      const text = JSON.stringify(value);
      expect(text).not.toMatch(/"(?:release|schemaVersion|formatVersion)"/u);
    }
  });
});

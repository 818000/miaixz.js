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
 * Exercises isolated icon architecture inputs and immutable output contracts.
 */

import { mkdtemp, readFile, writeFile, rm, readdir, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
const repositoryRoot = resolve(process.cwd(), "../..");
/**
 * Loads one repository tool without running its CLI.
 *
 * @param name - Repository-relative icon tool path.
 * @returns Imported tool exports.
 */
const importScript = async (name: string) =>
  import(pathToFileURL(resolve(repositoryRoot, ".github/scripts/modules/icons/" + name)).href);
const { createIconFixture, fixtureDesign } = await import(
  pathToFileURL(resolve(process.cwd(), "tests/assets/fonts/create-fixtures.helper.mjs")).href
);
const temporary: string[] = [];
afterEach(async () => {
  for (const path of temporary.splice(0)) await rm(path, { recursive: true, force: true });
});
/**
 * Creates a fresh temporary six-master test source.
 *
 * @param records - Complete test icon records.
 * @returns Isolated fixture roots and written files.
 */
const make = async (
  records = [
    {
      name: "alpha",
      codepoint: 0xf0000,
      category: "actions",
      opticalClass: "regular",
      rtl: "none",
    },
  ],
) => {
  const directory = await mkdtemp(resolve(tmpdir(), "miaixz-icon-test-"));
  temporary.push(directory);
  return createIconFixture({
    directory,
    categories: [{ id: "actions", description: "Actions; excludes navigation" }],
    records,
    design: structuredClone(fixtureDesign),
  });
};
/**
 * Mutates an isolated fixture to construct a negative input.
 *
 * @param path - Temporary fixture path.
 * @param change - Exact test mutation.
 * @returns File-write completion.
 */
const edit = async (path: string, change: (value: string) => string) =>
  writeFile(path, change(await readFile(path, "utf8")));
/**
 * Captures fixture bytes for zero-write and determinism assertions.
 *
 * @param root - Isolated fixture root.
 * @returns Relative file paths and their text.
 */
const snapshot = async (root: string): Promise<Record<string, string>> => {
  const result: Record<string, string> = {};
  /**
   * Captures every fixture file recursively for byte-preservation assertions.
   *
   * @param path - Directory path relative to the isolated fixture root.
   * @returns Promise resolving after all descendant file contents are recorded.
   */
  const walk = async (path: string) => {
    for (const entry of await readdir(resolve(root, path), { withFileTypes: true })) {
      const p = path ? path + "/" + entry.name : entry.name;
      if (entry.isDirectory()) await walk(p);
      else result[p] = await readFile(resolve(root, p), "utf8");
    }
  };
  await walk("");
  return result;
};

const { assignIconCodepoints, assignCodepoints } = await importScript(
  "quality/assign-icon-codepoints.mjs",
);
const { loadIconSource } = await importScript("source.mjs");
const { validateFontSource } = await importScript("fonts/validate-icon-font.mjs");
describe("unpublished codepoint assignment", () => {
  it("scans refinement without recalculating any mapping, writing records or rewriting a GLIF", async () => {
    const f = await make();
    const before = await snapshot(f.assetsRoot);
    const identity = (await loadIconSource({ assetsRoot: f.assetsRoot })).icons;
    const { scanIconRefinement } = await importScript("quality/audit-icon-refinement.mjs");
    await scanIconRefinement({ assetsRoot: f.assetsRoot, fontsRoot: f.fontsRoot });
    const after = await snapshot(f.assetsRoot);
    expect(after).toEqual(before);
    expect((await loadIconSource({ assetsRoot: f.assetsRoot })).icons).toEqual(identity);
  });
  it("uses ASCII ordering and keeps every nonidentity field", () => {
    const records = [
      { name: "z", rtl: "mirror" },
      { name: "alpha-2", rtl: "none" },
      { name: "alpha-10", rtl: "none" },
    ];
    const result = assignCodepoints(records);
    expect(result.map((r: { name: string; codepoint: number }) => [r.name, r.codepoint])).toEqual([
      ["alpha-10", 0xf0000],
      ["alpha-2", 0xf0001],
      ["z", 0xf0002],
    ]);
    expect(result[2].rtl).toBe("mirror");
    expect(records[0]).not.toHaveProperty("codepoint");
  });
  it("handles the final slot and rejects capacity before writing", () => {
    const capacity = 0xffffd - 0xf0000 + 1;
    const records = Array.from({ length: capacity }, (_, i) => ({
      name: "icon-" + String(i).padStart(5, "0"),
    }));
    expect(assignCodepoints(records).at(-1).codepoint).toBe(0xffffd);
    expect(() => assignCodepoints([...records, { name: "zzzz" }])).toThrow("capacity");
    expect(() => assignCodepoints([{ name: "alpha" }, { name: "alpha" }])).toThrow("Duplicate");
    expect(() => assignCodepoints([{ name: "Alpha" }])).toThrow("Invalid");
  });
  it("repairs duplicate/stale mappings and order, then becomes byte-idempotent", async () => {
    const records = [
      {
        name: "beta",
        codepoint: 0xf0000,
        category: "actions",
        opticalClass: "regular",
        rtl: "mirror",
      },
      {
        name: "alpha",
        codepoint: 0xf0000,
        category: "actions",
        opticalClass: "regular",
        rtl: "none",
      },
    ];
    const f = await make(records),
      before = await snapshot(f.assetsRoot);
    await expect(
      assignIconCodepoints({ assetsRoot: f.assetsRoot, mode: "check" }),
    ).rejects.toThrow();
    expect(await snapshot(f.assetsRoot)).toEqual(before);
    await assignIconCodepoints({ assetsRoot: f.assetsRoot, mode: "write" });
    const after = await snapshot(f.assetsRoot);
    for (const [path, text] of Object.entries(before)) {
      if (path.endsWith(".glif"))
        expect(after[path]?.slice(after[path]?.indexOf("<outline>"))).toBe(
          text.slice(text.indexOf("<outline>")),
        );
      if (
        path.endsWith("fontinfo.plist") ||
        path.endsWith("contents.plist") ||
        path.endsWith(".designspace")
      )
        expect(after[path]).toBe(text);
    }
    const source = await loadIconSource({ assetsRoot: f.assetsRoot });
    expect(
      source.icons.map((i: { name: string; codepoint: number; rtl: string }) => [
        i.name,
        i.codepoint,
        i.rtl,
      ]),
    ).toEqual([
      ["alpha", 0xf0000, "none"],
      ["beta", 0xf0001, "mirror"],
    ]);
    await validateFontSource({ assetsRoot: f.assetsRoot });
    expect(
      (await assignIconCodepoints({ assetsRoot: f.assetsRoot, mode: "write" })).changedFiles,
    ).toEqual([]);
    await assignIconCodepoints({ assetsRoot: f.assetsRoot, mode: "check" });
    expect(await snapshot(f.assetsRoot)).toEqual(after);
  });
  it("moves records across windows, removes obsolete final shard and adds missing Unicode", async () => {
    const records = Array.from({ length: 257 }, (_, i) => ({
      name: "icon-" + String(256 - i).padStart(3, "0"),
      codepoint: i === 256 ? 0xf0200 : 0xf0000 + i,
      category: "actions",
      opticalClass: "regular",
      rtl: "none",
    }));
    const f = await make(records);
    for (let i = 0; i < 6; i++)
      await edit(resolve(f.fontsRoot, "fixture-" + i + ".ufo/glyphs/miaixz.icon-000.glif"), (t) =>
        t.replace(/<unicode[^>]*\/>/u, ""),
      );
    await assignIconCodepoints({ assetsRoot: f.assetsRoot, mode: "write" });
    const source = await loadIconSource({ assetsRoot: f.assetsRoot });
    expect(source.shardPaths).toEqual(["icons/f0000-f00ff.json", "icons/f0100-f01ff.json"]);
    expect(await readdir(resolve(f.assetsRoot, "icons"))).not.toContain("f0200-f02ff.json");
    expect(source.icons[0].name).toBe("icon-000");
    await validateFontSource({ assetsRoot: f.assetsRoot });
    await assignIconCodepoints({ assetsRoot: f.assetsRoot, mode: "check" });
  }, 10_000);
  it.each([
    "missing master",
    "missing GLIF",
    "missing contents",
    "missing order",
    "multiple Unicode",
    "notdef Unicode",
    "bad topology",
  ])("prevalidation %s never writes", async (mode) => {
    const f = await make(),
      glif = resolve(f.fontsRoot, "fixture-5.ufo/glyphs/miaixz.alpha.glif");
    if (mode === "missing master")
      await rm(resolve(f.fontsRoot, "fixture-5.ufo"), { recursive: true });
    if (mode === "missing GLIF") await rm(glif);
    if (mode === "missing contents")
      await edit(resolve(f.fontsRoot, "fixture-5.ufo/glyphs/contents.plist"), (t) =>
        t.replace("<key>miaixz.alpha</key><string>miaixz.alpha.glif</string>", ""),
      );
    if (mode === "missing order")
      await edit(resolve(f.fontsRoot, "fixture-5.ufo/lib.plist"), (t) =>
        t.replace("<string>miaixz.alpha</string>", ""),
      );
    if (mode === "multiple Unicode")
      await edit(glif, (t) =>
        t.replace('<unicode hex="F0000"/>', '<unicode hex="F0000"/><unicode hex="F0001"/>'),
      );
    if (mode === "notdef Unicode")
      await edit(resolve(f.fontsRoot, "fixture-5.ufo/glyphs/_notdef.glif"), (t) =>
        t.replace("<outline>", '<unicode hex="F0000"/><outline>'),
      );
    if (mode === "bad topology") await edit(glif, (t) => t.replace('type="line"', 'type="qcurve"'));
    const before = await snapshot(f.assetsRoot);
    for (const requested of ["write", "check"]) {
      await expect(
        assignIconCodepoints({ assetsRoot: f.assetsRoot, mode: requested }),
      ).rejects.toThrow();
      expect(await snapshot(f.assetsRoot)).toEqual(before);
    }
  });
});

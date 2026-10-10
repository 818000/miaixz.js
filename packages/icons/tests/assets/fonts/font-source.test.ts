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

import { mkdtemp, readFile, writeFile, rm, readdir, symlink, rename } from "node:fs/promises";
import { createHash } from "node:crypto";
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
    for (const entry of await readdir(resolve(root, path), {
      withFileTypes: true,
    })) {
      const p = path ? path + "/" + entry.name : entry.name;
      if (entry.isDirectory()) await walk(p);
      else result[p] = await readFile(resolve(root, p), "utf8");
    }
  };
  await walk("");
  return result;
};

const { inspectFontSource, parsePlist } = await importScript("fonts/read-font-source.mjs");
const { validateFontSource, measureFontSource, sourceSha256 } = await importScript(
  "fonts/validate-icon-font.mjs",
);
const {
  fontCopyrightHeader,
  fontCopyright,
  fontLicense,
  withFontCopyrightHeader,
  validateFontCopyrightHeader,
} = await importScript("fonts/read-font-source.mjs");
const { validateFontNameRecords, validateFontReleaseRecords } = await importScript(
  "fonts/validate-icon-font.mjs",
);
describe("font copyright", () => {
  it("requires font release metadata to derive from repository VERSION", async () => {
    const version = (await readFile(resolve(repositoryRoot, "VERSION"), "utf8")).trim();
    const [major, minor, patch] = version.split(/[.-]/u).map(Number);
    const records = [
      { attributes: { nameID: "3" }, text: "MiaixzIcons;" + version },
      {
        attributes: { nameID: "5" },
        text: `Version ${major}.${String(minor! * 100 + patch!).padStart(3, "0")}`,
      },
    ];
    expect(() => validateFontReleaseRecords(records)).not.toThrow();
    for (const index of [0, 1]) {
      expect(() => validateFontReleaseRecords(records.filter((_, i) => i !== index))).toThrow(
        /VERSION/,
      );
      const altered = structuredClone(records);
      altered[index]!.text = "independent-version";
      expect(() => validateFontReleaseRecords(altered)).toThrow(/VERSION/);
    }
  });
  it("places one notice after the XML declaration without changing its glyph", async () => {
    const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<glyph name="test" format="2"/>\n';
    const result = withFontCopyrightHeader(xml);
    expect(result.replace(fontCopyrightHeader, "")).toBe(xml);
    expect(withFontCopyrightHeader(result)).toBe(result);
    expect(() => validateFontCopyrightHeader(result)).not.toThrow();
    expect(() => validateFontCopyrightHeader(xml)).toThrow(/copyright header/);
    expect(() => validateFontCopyrightHeader(result + fontCopyrightHeader)).toThrow(/duplicated/);
    expect(() => validateFontCopyrightHeader(xml + fontCopyrightHeader)).toThrow(/misplaced/);
    expect(() => withFontCopyrightHeader("<!-- Copyright another owner -->\n<glyph/>")).toThrow(
      /Conflicting/,
    );
    expect(() =>
      validateFontCopyrightHeader(
        result.replace("<glyph", "<!-- Copyright another owner -->\n<glyph"),
      ),
    ).toThrow(/conflicting/);
  });

  it("rejects a missing source notice and independently rejects altered font metadata", async () => {
    const f = await make();
    const path = resolve(f.fontsRoot, "fixture-0.ufo/glyphs/miaixz.alpha.glif");
    await edit(path, (text) => text.replace(fontCopyrightHeader, ""));
    await expect(validateFontSource(f)).rejects.toThrow(/copyright header/);
    await edit(path, withFontCopyrightHeader);
    await edit(resolve(f.fontsRoot, "fixture-0.ufo/fontinfo.plist"), (text) =>
      text.replace("<string>" + fontCopyright + "</string>", "<string>Copyright omitted</string>"),
    );
    await expect(validateFontSource(f)).rejects.toThrow(/copyright\/license metadata/);
  });

  it("requires embedded copyright, full license text and license URL in the binary name table", () => {
    const records = Object.entries({
      0: fontCopyright,
      13: fontLicense,
      14: "https://www.apache.org/licenses/LICENSE-2.0",
    }).map(([nameID, text]) => ({ attributes: { nameID }, text }));
    expect(() => validateFontNameRecords(records)).not.toThrow();
    for (const id of ["0", "13", "14"]) {
      expect(() =>
        validateFontNameRecords(records.filter((record) => record.attributes.nameID !== id)),
      ).toThrow(/missing/);
      expect(() =>
        validateFontNameRecords([...records, { attributes: { nameID: id }, text: "Wrong notice" }]),
      ).toThrow(/inconsistent/);
    }
  });
});
describe("six-master source", () => {
  it("exposes actual ordered points and per-master bytes without leaking private paths into projections", async () => {
    const f = await make();
    const path = resolve(f.fontsRoot, "fixture-0.ufo/glyphs/miaixz.alpha.glif");
    await edit(path, (text) =>
      text.replace('x="100" y="-60" type="line"', 'x="100" y="-60" type="line" name="bottom-left"'),
    );
    const source = await inspectFontSource({ fontsRoot: f.fontsRoot });
    const raw = source.rawMasters[0].get("miaixz.alpha");
    expect(raw.sha256).toBe(
      createHash("sha256")
        .update(await readFile(path))
        .digest("hex"),
    );
    expect(raw.contours[0].points[0]).toEqual({
      x: 100,
      y: -60,
      type: "line",
      smooth: false,
      name: "bottom-left",
    });
    expect(source.rawMasters[1].get("miaixz.alpha").contours[0].points[0].name).toBeNull();
    expect(source.glyphs[1].masters[0].contours[0].points[0].name).toBe("bottom-left");
    expect(JSON.stringify(source)).not.toContain(f.fontsRoot);
  });
  it("preserves ordered complete matrix and per-master metrics", async () => {
    const f = await make();
    await edit(resolve(f.fontsRoot, "fixture-5.ufo/glyphs/miaixz.alpha.glif"), (t) =>
      t.replaceAll('x="860"', 'x="850"'),
    );
    const source = await inspectFontSource({ fontsRoot: f.fontsRoot });
    expect(Object.keys(source)).toEqual([
      "axes",
      "masters",
      "defaultMaster",
      "glyphOrder",
      "glyphs",
      "rawMasters",
    ]);
    expect(source.defaultMaster).toBe(1);
    expect(source.axes.map((a: { tag: string }) => a.tag)).toEqual(["FILL", "opsz"]);
    expect(source.glyphOrder).toEqual([".notdef", "miaixz.alpha"]);
    expect(source.glyphs[1].masters).toHaveLength(6);
    expect(source.glyphs[1].masters[0].bounds).toEqual([100, -60, 860, 700]);
    expect(source.glyphs[1].masters[5].bounds).toEqual([100, -60, 850, 700]);
    expect(source.glyphs[0].canonicalName).toBeNull();
    expect(JSON.stringify(source)).not.toContain(f.fontsRoot);
    await validateFontSource({ assetsRoot: f.assetsRoot });
  });
  it("resolves renamed master directories only through Designspace filenames", async () => {
    const f = await make();
    const before = await inspectFontSource({ fontsRoot: f.fontsRoot });
    const beforeHash = await sourceSha256({
      assetsRoot: f.assetsRoot,
      font: before,
    });
    const names = [
      "outline-compact.ufo",
      "outline-standard.ufo",
      "outline-display.ufo",
      "filled-compact.ufo",
      "filled-standard.ufo",
      "filled-display.ufo",
    ];
    for (const [index, name] of names.entries()) {
      await rename(resolve(f.fontsRoot, "fixture-" + index + ".ufo"), resolve(f.fontsRoot, name));
      await edit(resolve(f.fontsRoot, "miaixz-icons.designspace"), (text) =>
        text.replace('filename="fixture-' + index + '.ufo"', 'filename="' + name + '"'),
      );
    }
    const after = await inspectFontSource({ fontsRoot: f.fontsRoot });
    expect(after.axes).toEqual(before.axes);
    expect(after.defaultMaster).toBe(before.defaultMaster);
    expect(after.glyphOrder).toEqual(before.glyphOrder);
    for (const [index, name] of names.entries()) {
      expect(after.masters[index]).toEqual({
        ...before.masters[index],
        relativePath: name,
      });
      for (let glyph = 0; glyph < before.glyphs.length; glyph++)
        expect(after.glyphs[glyph].masters[index]).toEqual({
          ...before.glyphs[glyph].masters[index],
          masterPath: name,
          sourcePath: before.glyphs[glyph].masters[index].sourcePath.replace(
            "fixture-" + index + ".ufo/",
            name + "/",
          ),
        });
    }
    await validateFontSource({ assetsRoot: f.assetsRoot });
    expect(await sourceSha256({ assetsRoot: f.assetsRoot, font: after })).not.toBe(beforeHash);
  });
  it("rejects stale Designspace filenames after a master directory rename", async () => {
    const f = await make();
    await rename(
      resolve(f.fontsRoot, "fixture-0.ufo"),
      resolve(f.fontsRoot, "outline-compact.ufo"),
    );
    await expect(inspectFontSource({ fontsRoot: f.fontsRoot })).rejects.toThrow();
  });
  it("measures all violations instead of hiding behind validate", async () => {
    const f = await make();
    await edit(resolve(f.fontsRoot, "fixture-4.ufo/glyphs/miaixz.alpha.glif"), (t) =>
      t.replaceAll('x="860"', 'x="910"'),
    );
    const before = await snapshot(f.assetsRoot);
    const report = await measureFontSource({
      assetsRoot: f.assetsRoot,
    });
    expect(await snapshot(f.assetsRoot)).toEqual(before);
    expect(report.status).toBe("failed");
    expect(report.entries).toHaveLength(6);
    expect(report.sourceSha256).toMatch(/^[a-f0-9]{64}$/u);
    expect(report.entries[4].violations.map((v: { metric: string }) => v.metric)).toContain(
      "longestEdge",
    );
    expect(report.entries[0].violations).toEqual([]);
  });
  it.each([
    "missing GLIF",
    "extra GLIF",
    "internal name",
    "glyph order",
    "Unicode",
    "topology",
    "advance",
    "family",
    "version",
    "open contour",
    "component cycle",
  ])("rejects %s", async (mode) => {
    const f = await make();
    const glif = resolve(f.fontsRoot, "fixture-0.ufo/glyphs/miaixz.alpha.glif");
    if (mode === "missing GLIF") await rm(glif);
    if (mode === "extra GLIF")
      await writeFile(
        resolve(f.fontsRoot, "fixture-0.ufo/glyphs/extra.glif"),
        await readFile(glif),
      );
    if (mode === "internal name")
      await edit(glif, (t) => t.replace('name="miaixz.alpha"', 'name="miaixz.beta"'));
    if (mode === "glyph order")
      await edit(resolve(f.fontsRoot, "fixture-0.ufo/lib.plist"), (t) =>
        t.replace(
          "<string>.notdef</string><string>miaixz.alpha</string>",
          "<string>miaixz.alpha</string><string>.notdef</string>",
        ),
      );
    if (mode === "Unicode") await edit(glif, (t) => t.replace("F0000", "F0001"));
    if (mode === "topology") await edit(glif, (t) => t.replace('type="line"', 'type="qcurve"'));
    if (mode === "advance") await edit(glif, (t) => t.replace('width="960"', 'width="959"'));
    if (mode === "family")
      await edit(resolve(f.fontsRoot, "fixture-0.ufo/fontinfo.plist"), (t) =>
        t.replace("Miaixz Icons", "Wrong"),
      );
    if (mode === "version")
      await edit(resolve(f.fontsRoot, "fixture-0.ufo/fontinfo.plist"), (t) =>
        t.replace("</dict>", "<key>versionMajor</key><integer>1</integer></dict>"),
      );
    if (mode === "open contour") await edit(glif, (t) => t.replace('type="line"', 'type="move"'));
    if (mode === "component cycle")
      await edit(glif, (t) =>
        t.replace("</outline>", '<component base="miaixz.alpha"/></outline>'),
      );
    await expect(validateFontSource({ assetsRoot: f.assetsRoot })).rejects.toThrow();
  });
  it.each(["escape", "absolute", "duplicate", "location", "axis", "entity"])(
    "rejects invalid Designspace %s",
    async (mode) => {
      const f = await make();
      await edit(resolve(f.fontsRoot, "miaixz-icons.designspace"), (t) =>
        mode === "escape"
          ? t.replace("fixture-0.ufo", "../outside.ufo")
          : mode === "absolute"
            ? t.replace("fixture-0.ufo", resolve(f.fontsRoot, "fixture-0.ufo"))
            : mode === "duplicate"
              ? t.replace("fixture-0.ufo", "fixture-1.ufo")
              : mode === "location"
                ? t.replace('xvalue="12"', 'xvalue="24"')
                : mode === "axis"
                  ? t.replace('tag="FILL"', 'tag="FAIL"')
                  : '<!DOCTYPE designspace [<!ENTITY secret SYSTEM "https://invalid.example/">]>' +
                    t,
      );
      await expect(inspectFontSource({ fontsRoot: f.fontsRoot })).rejects.toThrow();
    },
  );
  it("rejects GLIF symlink and contents cross-master references", async () => {
    const f = await make();
    const glif = resolve(f.fontsRoot, "fixture-0.ufo/glyphs/miaixz.alpha.glif");
    await rm(glif);
    await symlink(resolve(f.fontsRoot, "fixture-1.ufo/glyphs/miaixz.alpha.glif"), glif);
    await expect(inspectFontSource({ fontsRoot: f.fontsRoot })).rejects.toThrow("escapes");
  });
  it("decodes every typed plist value in order", () => {
    const result = parsePlist(
      '<plist version="1.0"><dict><key>array</key><array><string>x</string><integer>-1</integer><real>0.5</real><true/><false/><date>2026-01-01T00:00:00Z</date><data> YQ== </data></array></dict></plist>',
    );
    expect(result.array).toEqual(["x", -1, 0.5, true, false, "2026-01-01T00:00:00.000Z", "YQ=="]);
  });
  it.each([
    "<key>x</key><integer>1</integer><key>x</key><integer>2</integer>",
    "<key>x</key>",
    "<key>x</key><real>Infinity</real>",
    "<key>x</key><date>2026-02-30T00:00:00Z</date>",
    "<key>x</key><data>Zh==</data>",
    "<key>x</key><unknown/>",
  ])("rejects ambiguous plist %s", (input) => {
    expect(() => parsePlist('<plist version="1.0"><dict>' + input + "</dict></plist>")).toThrow();
  });
});

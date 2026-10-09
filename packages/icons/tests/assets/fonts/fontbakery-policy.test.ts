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
 * Verifies the machine-owned FontBakery exception policy and font metadata.
 */

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { describe, expect, it } from "vitest";

const repositoryRoot = resolve(process.cwd(), "../..");
const release = (await readFile(resolve(repositoryRoot, "VERSION"), "utf8")).trim();
const validatorUrl = pathToFileURL(
  resolve(repositoryRoot, ".github/scripts/modules/icons/fonts/validate-icon-font.mjs"),
).href;
const { FONTBAKERY_EXCLUSIONS, fontBakeryWoff2EntryPoint, runFontTool } = (await import(
  validatorUrl
)) as {
  fontBakeryWoff2EntryPoint: () => string;
  runFontTool: (executable: string, arguments_: string[]) => Promise<{ stdout: string }>;
  FONTBAKERY_EXCLUSIONS: readonly {
    id: string;
    reason: string;
    throughVersion: string;
  }[];
};
const fontsRoot = resolve(process.cwd(), "src/assets/fonts");
const readerUrl = pathToFileURL(
  resolve(repositoryRoot, ".github/scripts/modules/icons/fonts/read-font-source.mjs"),
).href;
const { inspectFontSource } = await import(readerUrl);
const fontSource = await inspectFontSource({ fontsRoot });

describe("FontBakery icon-font policy", () => {
  it("partitions every universal check exactly once and preserves failure codes and thresholds", async () => {
    const checks = [
      "file_size",
      "interpolation_issues",
      "overlapping_path_segments",
      "freetype_rasterizer",
      "outline_fixture",
    ];
    const script = [
      "import json, sys, types",
      "package = types.ModuleType('fontbakery')",
      "testable = types.ModuleType('fontbakery.testable')",
      "cli = types.ModuleType('fontbakery.cli')",
      "class Font: extensions = ['otf', 'ttf']",
      "testable.Font = Font",
      `checks = ${JSON.stringify(checks)}`,
      "class CheckRunner:",
      " def __init__(self, *args, **kwargs): self.order = [types.SimpleNamespace(check=types.SimpleNamespace(id=check)) for check in checks]",
      "cli.CheckRunner = CheckRunner",
      "cli.Configuration = lambda **kwargs: kwargs",
      "cli.profile_factory = lambda profile: profile",
      "cli.get_module = lambda name: name",
      "cli.setup_context = lambda files: files",
      "def main():",
      " print(json.dumps({'extensions': Font.extensions, 'arguments': sys.argv}))",
      " return 0",
      "cli.main = main",
      "sys.modules.update({'fontbakery': package, 'fontbakery.testable': testable, 'fontbakery.cli': cli})",
      "sys.argv = ['-c', 'decoded.ttf', 'check-universal', '--skip-network', '--error-code-on', 'WARN', 'actual.woff2']",
      `exec(${JSON.stringify(fontBakeryWoff2EntryPoint())})`,
    ].join("\n");
    const output = (await runFontTool("python3", ["-c", script])).stdout;
    const actual = output
      .split("\n")
      .filter((line) => line.startsWith("{"))
      .map((line) => JSON.parse(line));
    expect(actual).toHaveLength(2);
    expect(actual.map((route) => route.arguments.at(-1))).toEqual(["decoded.ttf", "actual.woff2"]);
    const selected = actual.map((route) =>
      route.arguments.flatMap((argument: string, index: number, arguments_: string[]) =>
        argument === "--checkid" ? [arguments_[index + 1]] : [],
      ),
    );
    expect(selected).toEqual([checks.filter((check) => check !== "file_size"), ["file_size"]]);
    expect(selected.flat().sort()).toEqual([...checks].sort());
    for (const route of actual) {
      expect(route.extensions).toEqual(["otf", "ttf", "woff2"]);
      expect(route.arguments.slice(0, 6)).toEqual([
        "fontbakery",
        "check-universal",
        "--skip-network",
        "--error-code-on",
        "WARN",
        "--checkid",
      ]);
    }
    for (const filename of ["decoded.ttf", "actual.woff2"]) {
      await expect(
        runFontTool("python3", [
          "-c",
          script.replace(" return 0", ` return int(sys.argv[-1] == '${filename}')`),
        ]),
      ).rejects.toThrow();
    }
    for (const invalid of [checks.slice(1), [...checks, "file_size"]]) {
      await expect(
        runFontTool("python3", [
          "-c",
          script.replace(
            `checks = ${JSON.stringify(checks)}`,
            `checks = ${JSON.stringify(invalid)}`,
          ),
        ]),
      ).rejects.toThrow();
    }
  });

  it("uses an exact release-scoped exclusion set with recorded reasons", () => {
    expect(FONTBAKERY_EXCLUSIONS.map(({ id }) => id)).toEqual([
      "opentype/fvar/regular_coords_correct",
      "opentype/varfont/valid_default_instance_nameids",
      "opentype/monospace",
      "opentype/post_table_version",
      "opentype/unitsperem",
      "cmap/format_12",
      "gpos_kerning_info",
      "mandatory_avar_table",
      "smart_dropout",
      "whitespace_glyphs",
    ]);
    expect(new Set(FONTBAKERY_EXCLUSIONS.map(({ id }) => id)).size).toBe(
      FONTBAKERY_EXCLUSIONS.length,
    );
    for (const exclusion of FONTBAKERY_EXCLUSIONS) {
      expect(exclusion.throughVersion).toBe(release);
      expect(exclusion.reason.length).toBeGreaterThan(24);
    }
  });

  it("keeps project release versions out of immutable UFO sources", async () => {
    for (const { relativePath: directory } of fontSource.masters) {
      const source = await readFile(resolve(fontsRoot, directory, "fontinfo.plist"), "utf8");
      expect(source).toContain("<key>postscriptIsFixedPitch</key>\n  <true/>");
      expect(source).toContain("<key>openTypeOS2Panose</key>");
      expect(source).not.toMatch(
        /<key>(?:openTypeNameVersion|openTypeNameUniqueID|versionMajor|versionMinor)<\/key>/u,
      );
    }
    const buildScript = await readFile(
      resolve(repositoryRoot, ".github/scripts/modules/icons/fonts/build-icon-font.mjs"),
      "utf8",
    );
    expect(buildScript).toContain("readRepositoryVersion");
    expect(buildScript).toContain("openTypeNameVersion");
  });

  it("defines every FILL and optical-size STAT axis value", async () => {
    const source = await readFile(resolve(fontsRoot, "miaixz-icons.designspace"), "utf8");
    for (const label of [
      '<label uservalue="0" name="Outline" elidable="true">',
      '<label uservalue="1" name="Filled">',
      '<label uservalue="12" name="Compact">',
      '<label uservalue="24" name="Standard" elidable="true">',
      '<label uservalue="40" name="Display">',
    ]) {
      expect(source).toContain(label);
    }
  });
});

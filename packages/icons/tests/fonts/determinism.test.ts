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
 * Verifies the two-round font build rejects nondeterministic bytes.
 */

import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";

import { describe, expect, it } from "vitest";

/**
 * Callable contract that rejects mismatched hashes from two isolated font builds.
 */
type CompareFontBuildHashes = (
  first: Readonly<Record<string, string>>,
  second: Readonly<Record<string, string>>,
) => void;

const moduleUrl = pathToFileURL(
  resolve(process.cwd(), "../../.github/scripts/modules/icons/fonts/build-icon-font.mjs"),
).href;
const { compareFontBuildHashes } = (await import(moduleUrl)) as {
  compareFontBuildHashes: CompareFontBuildHashes;
};
const deterministic = Object.freeze({
  "miaixz-icons.woff2": "fixed-bytes",
});

const toolRoot = resolve(process.cwd(), "../../.github/scripts/modules/icons");
const { createIconFixture, fixtureDesign } = await import(
  pathToFileURL(resolve(process.cwd(), "tests/fixtures/icon-geometry/create-fixtures.mjs")).href
);
const { assignIconCodepoints } = await import(
  pathToFileURL(resolve(toolRoot, "quality/assign-icon-codepoints.mjs")).href
);
const { generateIcons, processGeneratedIcons } = await import(
  pathToFileURL(resolve(toolRoot, "codegen/generate-icons.mjs")).href
);

/**
 * Captures complete bytes in one isolated source directory.
 *
 * @param root - Temporary directory to inspect.
 * @returns Ordered relative paths and Base64 bytes.
 */
async function snapshot(root: string): Promise<Record<string, string>> {
  const files: Record<string, string> = {};
  /**
   * Traverses one relative fixture directory.
   *
   * @param path - Fixture-relative directory.
   * @returns Traversal completion.
   */
  async function walk(path: string): Promise<void> {
    for (const entry of (await readdir(resolve(root, path), { withFileTypes: true })).sort(
      (a, b) => (a.name < b.name ? -1 : 1),
    )) {
      const relative = path ? path + "/" + entry.name : entry.name;
      if (entry.isDirectory()) await walk(relative);
      else files[relative] = (await readFile(resolve(root, relative))).toString("base64");
    }
  }
  await walk("");
  return files;
}

describe("source and generator determinism", () => {
  it("keeps two assignment/generation rounds byte-identical and check read-only", async () => {
    const directory = await mkdtemp(resolve(tmpdir(), "miaixz-determinism-"));
    try {
      const fixture = await createIconFixture({
        directory,
        categories: [{ id: "actions", description: "Actions; excludes navigation" }],
        records: [
          {
            name: "alpha",
            codepoint: 0xf0000,
            category: "actions",
            opticalClass: "regular",
            rtl: "none",
          },
        ],
        design: structuredClone(fixtureDesign),
      });
      const outputRoot = resolve(directory, "generated");
      await assignIconCodepoints({ assetsRoot: fixture.assetsRoot, mode: "write" });
      const before = await snapshot(fixture.assetsRoot);
      await processGeneratedIcons({ assetsRoot: fixture.assetsRoot, outputRoot, mode: "write" });
      const first = await snapshot(directory);
      expect(await generateIcons({ assetsRoot: fixture.assetsRoot })).toEqual(
        await generateIcons({ assetsRoot: fixture.assetsRoot }),
      );
      await assignIconCodepoints({ assetsRoot: fixture.assetsRoot, mode: "write" });
      await processGeneratedIcons({ assetsRoot: fixture.assetsRoot, outputRoot, mode: "write" });
      expect(await snapshot(directory)).toEqual(first);
      await assignIconCodepoints({ assetsRoot: fixture.assetsRoot, mode: "check" });
      await processGeneratedIcons({ assetsRoot: fixture.assetsRoot, outputRoot, mode: "check" });
      expect(await snapshot(directory)).toEqual(first);
      expect(await snapshot(fixture.assetsRoot)).toEqual(before);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
  it("imports all guarded tools without running a CLI or writing a report", async () => {
    const directory = await mkdtemp(resolve(tmpdir(), "miaixz-import-"));
    try {
      const modules = [
        "source.mjs",
        "fonts/font-geometry.mjs",
        "fonts/read-font-source.mjs",
        "fonts/validate-icon-font.mjs",
        "fonts/build-icon-font.mjs",
        "quality/assign-icon-codepoints.mjs",
        "quality/validate-icon-package.mjs",
        "quality/generate-release-evidence.mjs",
        "codegen/generate-icons.mjs",
        "hooks/package-assets.mjs",
      ];
      const script = modules
        .map(
          (name) =>
            "await import(" + JSON.stringify(pathToFileURL(resolve(toolRoot, name)).href) + ");",
        )
        .join("\n");
      const output = execFileSync(process.execPath, ["--input-type=module", "-e", script], {
        cwd: directory,
        encoding: "utf8",
      });
      expect(output).toBe("");
      expect(await readdir(directory)).toEqual([]);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});

describe("font build determinism", () => {
  it("accepts two byte-identical WOFF2 rounds", () => {
    expect(() => compareFontBuildHashes(deterministic, deterministic)).not.toThrow();
  });

  it("rejects a timestamp injected into the WOFF2", () => {
    const timestamped = {
      ...deterministic,
      "miaixz-icons.woff2": `${deterministic["miaixz-icons.woff2"]}:timestamp=1`,
    };
    expect(() => compareFontBuildHashes(deterministic, timestamped)).toThrow(
      /not byte deterministic/u,
    );
  });

  it("rejects missing or additional font outputs", () => {
    expect(() =>
      compareFontBuildHashes(deterministic, {
        ...deterministic,
        "unexpected.woff2": "unexpected",
      }),
    ).toThrow(/output set mismatch/u);
  });
});

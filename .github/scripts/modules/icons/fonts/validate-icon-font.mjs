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
 * Validates immutable Designspace/UFO inputs and compiled font outputs.
 */

import { spawn } from "node:child_process";
import { stat } from "node:fs/promises";
import { mkdir, readFile, readdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { readRepositoryVersion } from "../../../miaixz.mjs";
import {
  EXPECTED_MASTER_DIRECTORIES,
  fontsRoot,
  loadIconSource,
  repositoryRoot,
} from "../source.mjs";

const release = readRepositoryVersion(repositoryRoot);
const allowedExecutables = new Set(["fontbakery", "fontmake", "fonttools", "ttx"]);
const expectedFontFiles = Object.freeze(["miaixz-icons.woff2"]);

export { EXPECTED_MASTER_DIRECTORIES };

/**
 * FontBakery exclusions approved for the icon-font contract.
 */
export const FONTBAKERY_EXCLUSIONS = Object.freeze(
  [
    ["opentype/fvar/regular_coords_correct", "The default instance is Outline Standard."],
    [
      "opentype/varfont/valid_default_instance_nameids",
      "The default instance is Outline Standard.",
    ],
    [
      "opentype/monospace",
      "The fixed-width icon font does not follow text-font hMetrics guidance.",
    ],
    ["opentype/post_table_version", "The icon font intentionally uses post format 3."],
    ["opentype/unitsperem", "The 24-unit design grid requires 960 UPM."],
    ["cmap/format_12", "SPUA-A-only fonts cannot provide a useful BMP format 4 cmap."],
    ["gpos_kerning_info", "Fixed-width standalone icons do not use kerning."],
    ["mandatory_avar_table", "FILL and opsz intentionally use linear mappings."],
    ["smart_dropout", "The scalable icon outlines are intentionally unhinted."],
    ["whitespace_glyphs", "The icon font intentionally contains no text whitespace."],
  ].map(([id, reason]) => Object.freeze({ id, reason, throughVersion: release })),
);

/**
 * Runs one allowlisted font command without a shell.
 *
 * @param {string} executable Executable name.
 * @param {readonly string[]} arguments_ Exact argument vector.
 * @param {{cwd?: string, env?: NodeJS.ProcessEnv}} [options] Process options.
 * @returns {Promise<{stdout: string, stderr: string}>} Captured output.
 */
export async function runFontTool(executable, arguments_, options = {}) {
  if (!allowedExecutables.has(executable))
    throw new Error(`Disallowed font executable: ${executable}.`);
  if (!Array.isArray(arguments_) || arguments_.some((value) => typeof value !== "string")) {
    throw new TypeError("Font tool arguments must be a string array.");
  }
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(executable, [...arguments_], {
      cwd: options.cwd ?? repositoryRoot,
      env: options.env ?? process.env,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", rejectPromise);
    child.on("close", (code, signal) => {
      if (code === 0) resolvePromise({ stdout, stderr });
      else
        rejectPromise(
          new Error(
            `${executable} exited with ${code ?? `signal ${String(signal)}`}\n${stderr || stdout}`,
          ),
        );
    });
  });
}

/**
 * Validates all source JSON, Designspace, UFO, glyph, and topology invariants.
 *
 * @returns {ReturnType<typeof loadIconSource>} Validated source graph.
 */
export async function validateFontSource() {
  const source = await loadIconSource({ validateUfo: true });
  const entries = (await readdir(fontsRoot, { withFileTypes: true }))
    .map((entry) => entry.name)
    .sort();
  const expected = [...EXPECTED_MASTER_DIRECTORIES, "miaixz-icons.designspace"].sort();
  if (JSON.stringify(entries) !== JSON.stringify(expected)) {
    throw new Error(
      `Font source set mismatch. Expected ${expected.join(", ")}; received ${entries.join(", ")}.`,
    );
  }
  return source;
}

/**
 * Runs FontBakery and enforces the single-font size/output contract.
 *
 * @param {string} fontDirectory Candidate font directory.
 * @param {string} reportDirectory External report destination.
 * @returns {Promise<readonly string[]>} Generated report paths.
 */
export async function validateFontOutputs(fontDirectory, reportDirectory) {
  const source = await loadIconSource();
  const files = (await readdir(fontDirectory)).filter((name) => !name.startsWith(".")).sort();
  if (JSON.stringify(files) !== JSON.stringify(expectedFontFiles)) {
    throw new Error(`Compiled font set mismatch: ${files.join(", ") || "empty"}.`);
  }
  await mkdir(reportDirectory, { recursive: true });
  const reports = [];
  for (const filename of expectedFontFiles) {
    const input = resolve(fontDirectory, filename);
    if ((await stat(input)).size > source.design.limits.fontBytes) {
      throw new Error(`${filename} exceeds ${source.design.limits.fontBytes} bytes.`);
    }
    const report = resolve(reportDirectory, `${filename.replace(/\.woff2$/u, "")}.fontbakery.json`);
    const validationFont = resolve(fontDirectory, `.${filename.replace(/\.woff2$/u, "")}.ttf`);
    try {
      await runFontTool("fonttools", ["ttLib.woff2", "decompress", input, "-o", validationFont]);
      await runFontTool("fontbakery", [
        "check-universal",
        "--skip-network",
        "--no-progress",
        "--no-colors",
        "--error-code-on",
        "WARN",
        ...FONTBAKERY_EXCLUSIONS.flatMap(({ id }) => ["--exclude-checkid", id]),
        "--json",
        report,
        validationFont,
      ]);
      JSON.parse(await readFile(report, "utf8"));
      reports.push(report);
    } finally {
      await rm(validationFont, { force: true });
    }
  }
  return Object.freeze(reports);
}

if (
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const arguments_ = process.argv.slice(2);
  if (arguments_.length !== 2 || arguments_[0] !== "--mode" || arguments_[1] !== "source") {
    throw new Error("validate-icon-font.mjs requires exactly --mode source.");
  }
  await validateFontSource();
  process.stdout.write("Miaixz icon font sources are valid.\n");
}

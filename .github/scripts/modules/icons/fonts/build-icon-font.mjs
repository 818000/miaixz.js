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
 * Orchestrates the deterministic variable-font build without repository Python code.
 */

import { createHash } from "node:crypto";
import { rmSync } from "node:fs";
import { copyFile, cp, mkdir, mkdtemp, readFile, rename, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { inspectFontSource } from "./read-font-source.mjs";
import {
  inspectFonts,
  runFontTool,
  validateFontOutputs,
  validateFontSource,
} from "./validate-icon-font.mjs";
import {
  fontsRoot,
  loadIconSource,
  packageRoot,
  repositoryRoot,
  unicodeRangeFor,
} from "../source.mjs";
import { readRepositoryVersion } from "../../../miaixz.mjs";

const release = readRepositoryVersion(repositoryRoot);
const interruptSignals = Object.freeze({
  SIGHUP: 129,
  SIGINT: 130,
  SIGTERM: 143,
});
const expectedOutputNames = Object.freeze(["miaixz-icons.woff2"]);

/**
 * Requires two isolated build rounds to contain byte-identical font outputs.
 *
 * @param {Readonly<Record<string, string>>} first - First-round SHA-256 map.
 * @param {Readonly<Record<string, string>>} second - Second-round SHA-256 map.
 * @returns {void}
 */
export function compareFontBuildHashes(first, second) {
  for (const hashes of [first, second]) {
    const names = Object.keys(hashes).sort();
    if (JSON.stringify(names) !== JSON.stringify(expectedOutputNames)) {
      throw new Error(`Font build output set mismatch: ${names.join(", ") || "empty"}.`);
    }
  }
  for (const name of expectedOutputNames) {
    if (first[name] !== second[name]) {
      throw new Error(`Miaixz icon font build is not byte deterministic: ${name}.`);
    }
  }
}

/**
 * Runs an operation in the single external font workspace and always removes it.
 *
 * @typeParam Result - Result produced by the isolated operation.
 * @param {(directories: Readonly<{root: string, first: string, second: string}>) => Promise<Result>} operation - Isolated build operation.
 * @returns {Promise<Result>} Operation result.
 */
export async function withFontBuildWorkspace(operation) {
  const root = await mkdtemp(join(tmpdir(), "miaixz-icons-build-"));
  const first = resolve(root, "round-a");
  const second = resolve(root, "round-b");
  await Promise.all([mkdir(first), mkdir(second)]);
  let cleaned = false;
  /**
   * Removes the isolated build directory exactly once during exit or signal cleanup.
   *
   * @returns No return value; repeated cleanup calls are ignored.
   */
  const cleanSynchronously = () => {
    if (cleaned) return;
    cleaned = true;
    rmSync(root, { recursive: true, force: true });
  };
  const handlers = new Map(
    Object.entries(interruptSignals).map(([signal, exitCode]) => [
      signal,
      () => {
        cleanSynchronously();
        process.exit(exitCode);
      },
    ]),
  );
  for (const [signal, handler] of handlers) process.once(signal, handler);
  try {
    return await operation(Object.freeze({ root, first, second }));
  } finally {
    for (const [signal, handler] of handlers) process.removeListener(signal, handler);
    if (!cleaned) {
      cleaned = true;
      await rm(root, { recursive: true, force: true });
    }
  }
}

/**
 * Calculates the SHA-256 digest of one file.
 *
 * @param {string} path - File to hash.
 * @returns {Promise<string>} Lowercase hexadecimal digest.
 */
async function digest(path) {
  return createHash("sha256")
    .update(await readFile(path))
    .digest("hex");
}

/**
 * Keeps cubic conversion error within the design's subdivision budget, expressed in EM.
 *
 * @param {object} design - Validated icon design data.
 * @returns {number} Maximum conversion error passed to the locked font compiler.
 */
export function fontConversionError(design) {
  const units = design?.font?.unitsPerEm;
  const tolerance = design?.visual?.comparison?.subdivisionUnits;
  const boundary = design?.visual?.comparison?.compiledOutlineUnits;
  if (
    !Number.isFinite(units) ||
    units <= 0 ||
    !Number.isFinite(tolerance) ||
    tolerance <= 0 ||
    !Number.isFinite(boundary) ||
    boundary <= tolerance
  )
    throw new Error("Invalid source-to-font precision budget.");
  return tolerance / units;
}

/**
 * Preserves explicit axis deltas instead of adding the compiler's lossy IUP approximation.
 * @param {object} design Canonical geometry and conversion precision rules.
 * @param {string} designspacePath Temporary six-master Designspace input.
 * @param {string} fontPath Complete variable TrueType output.
 * @returns {string[]} Deterministic compiler arguments with unchanged curve precision.
 */
export function fontCompilerArguments(design, designspacePath, fontPath) {
  return [
    "-m",
    designspacePath,
    "-o",
    "variable",
    "--output-path",
    fontPath,
    "--validate-ufo",
    "--no-optimize-gvar",
    "--conversion-error",
    String(fontConversionError(design)),
  ];
}

/**
 * Compresses only deltas that reconstruct exactly; never accepts the default IUP tolerance.
 * @param {string} fontPath Complete unoptimized variable TrueType candidate.
 * @param {object} environment Deterministic compiler environment.
 * @returns {Promise<void>} In-place lossless candidate compression, without source changes.
 */
async function compressExactAxisDeltas(fontPath, environment) {
  const script = [
    "import sys",
    "from fontTools.ttLib import TTFont",
    "from fontTools.varLib.iup import iup_delta",
    "font=TTFont(sys.argv[1],recalcTimestamp=False)",
    "glyf=font['glyf']",
    "vertical=font['vmtx'].metrics if 'vmtx' in font else None",
    "for name,variations in font['gvar'].variations.items():",
    " coords,control=glyf._getCoordinatesAndControls(name,font['hmtx'].metrics,vertical)",
    " for variation in variations:",
    "  original=list(variation.coordinates)",
    "  if None in original: raise ValueError('Compiler applied implicit axis optimization')",
    "  variation.optimize(coords,control.endPts,tolerance=0)",
    "  if iup_delta(variation.coordinates,coords,control.endPts)!=original:",
    "   variation.coordinates=original",
    "font.save(sys.argv[1],reorderTables=False)",
  ].join("\n");
  await runFontTool("python3", ["-c", script, fontPath], { env: environment });
}

/**
 * Copies immutable UFO sources and injects the repository release into the copies.
 *
 * @param {string} outputDirectory - Candidate build directory.
 * @returns {Promise<string>} Temporary Designspace path.
 */
async function prepareFontSource(outputDirectory) {
  const sourceRoot = resolve(outputDirectory, "source");
  await cp(fontsRoot, sourceRoot, { recursive: true });
  const [major, minor, patch] = release.split(/[.-]/u).map(Number);
  const versionMinor = minor * 100 + patch;
  const fontSource = await inspectFontSource({ fontsRoot });
  for (const { relativePath: master } of fontSource.masters) {
    const path = resolve(sourceRoot, master, "fontinfo.plist");
    const source = await readFile(path, "utf8");
    const postscriptName = source.match(
      /<key>postscriptFontName<\/key>\s*<string>([^<]+)<\/string>/u,
    )?.[1];
    if (postscriptName === undefined) throw new Error(`${master} has no PostScript name.`);
    const metadata = `  <key>openTypeNameVersion</key>\n  <string>Version ${major}.${String(versionMinor).padStart(3, "0")}</string>\n  <key>openTypeNameUniqueID</key>\n  <string>${postscriptName};${release}</string>\n  <key>versionMajor</key>\n  <integer>${major}</integer>\n  <key>versionMinor</key>\n  <integer>${versionMinor}</integer>\n`;
    await writeFile(path, source.replace("</dict>", `${metadata}</dict>`));
  }
  return resolve(sourceRoot, "miaixz-icons.designspace");
}

/**
 * Builds one temporary complete variable TTF and its complete WOFF2 output.
 *
 * @param {string} outputDirectory - Existing temporary output directory.
 * @returns {Promise<Readonly<Record<string, string>>>} Output hashes.
 */
async function buildCandidate(outputDirectory) {
  const source = await loadIconSource();
  const temporaryDesignspace = await prepareFontSource(outputDirectory);
  const completeFont = resolve(outputDirectory, "miaixz-icons.ttf");
  const environment = { ...process.env, SOURCE_DATE_EPOCH: "0" };
  await runFontTool(
    "fontmake",
    fontCompilerArguments(source.design, temporaryDesignspace, completeFont),
    { env: environment },
  );
  await compressExactAxisDeltas(completeFont, environment);
  const outputs = [["miaixz-icons.woff2", unicodeRangeFor(source.icons)]];
  for (const [filename, unicodes] of outputs) {
    await runFontTool(
      "fonttools",
      [
        "subset",
        completeFont,
        `--unicodes=${unicodes}`,
        "--flavor=woff2",
        "--layout-features=",
        "--no-retain-gids",
        "--notdef-glyph",
        "--notdef-outline",
        "--name-IDs=*",
        `--output-file=${resolve(outputDirectory, filename)}`,
      ],
      { env: environment },
    );
  }
  await inspectFonts(outputDirectory);
  const hashes = Object.freeze(
    Object.fromEntries(
      await Promise.all(
        outputs.map(async ([filename]) => [
          filename,
          await digest(resolve(outputDirectory, filename)),
        ]),
      ),
    ),
  );
  await Promise.all([
    rm(resolve(outputDirectory, "source"), { recursive: true, force: true }),
    rm(completeFont, { force: true }),
  ]);
  return hashes;
}

/**
 * Replaces the published font directory with the verified WOFF2 file.
 *
 * @param {string} candidateDirectory - Verified first-round build directory.
 * @param {string} destinationDirectory - Package distribution font directory.
 * @returns {Promise<void>} Promise completed after atomic replacement.
 */
async function publishFontOutputs(candidateDirectory, destinationDirectory) {
  const staging = `${destinationDirectory}.pending-${process.pid}`;
  await rm(staging, { recursive: true, force: true });
  await mkdir(staging, { recursive: true });
  try {
    await Promise.all(
      expectedOutputNames.map((filename) =>
        copyFile(resolve(candidateDirectory, filename), resolve(staging, filename)),
      ),
    );
    await rm(destinationDirectory, { recursive: true, force: true });
    await rename(staging, destinationDirectory);
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
}

/**
 * Runs two isolated candidate builds and requires byte-identical WOFF2 output.
 *
 * @param {string} [destinationDirectory] - Optional verified output destination.
 * @returns {Promise<Readonly<Record<string, string>>>} Verified output hashes.
 */
export async function verifyDeterministicFontBuild(destinationDirectory) {
  return withFontBuildWorkspace(async ({ first, second }) => {
    if (readRepositoryVersion(repositoryRoot) !== release)
      throw new Error(
        "VERSION changed since loading the font build; restart with the current value.",
      );
    await validateFontSource();
    const firstHashes = await buildCandidate(first);
    await validateFontOutputs(first);
    const secondHashes = await buildCandidate(second);
    compareFontBuildHashes(firstHashes, secondHashes);
    if (readRepositoryVersion(repositoryRoot) !== release)
      throw new Error(
        "VERSION changed during the font build; refusing to publish mismatched metadata.",
      );
    if (destinationDirectory !== undefined) {
      await publishFontOutputs(first, destinationDirectory);
    }
    return firstHashes;
  });
}

const arguments_ = process.argv.slice(2);
if (
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  if (arguments_.length !== 1 || !["--check", "--write"].includes(arguments_[0])) {
    throw new Error("build-icon-font.mjs requires exactly --check or --write.");
  }
  const destinationDirectory =
    arguments_[0] === "--write" ? resolve(packageRoot, "dist/assets/fonts") : undefined;
  const hashes = await verifyDeterministicFontBuild(destinationDirectory);
  console.log(
    arguments_[0] === "--check"
      ? `MIAIXZ_FONT_HASHES=${JSON.stringify(hashes)}`
      : JSON.stringify(hashes, null, 2),
  );
}

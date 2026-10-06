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
import { createHash } from "node:crypto";
import { stat, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { mkdir, readFile, readdir, rm } from "node:fs/promises";
import { resolve, relative, sep } from "node:path";
import { pathToFileURL } from "node:url";

import { readRepositoryVersion } from "../../../miaixz.mjs";
import { assetsRoot, loadIconSource, repositoryRoot } from "../source.mjs";

const release = readRepositoryVersion(repositoryRoot);
const allowedExecutables = new Set(["fontbakery", "fontmake", "fonttools", "ttx"]);
const expectedFontFiles = Object.freeze(["miaixz-icons.woff2"]);

import {
  inspectFontSource,
  fontSourceFiles,
  parseXml,
  secureSourcePath,
} from "./read-font-source.mjs";
import { validateGlyphGeometry } from "./font-geometry.mjs";

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
 * Validates the JSON/font structural projection; assignment may repair mapping/order.
 * @param {any} source JSON projection.
 * @param {any} font Complete font projection.
 * @param {{mapping?:boolean}} options Mapping policy.
 * @returns {void} Throws on invalid structure.
 */
export function validateFontProjection(source, font, { mapping = true } = {}) {
  /**
   * Stops font-source validation with a concrete invariant diagnostic.
   *
   * @param message - Failure description included in the thrown Error.
   * @returns Never returns; always throws an Error.
   */
  const fail = (message) => {
    throw new Error(message);
  };
  const expected = [".notdef", ...source.icons.map((i) => "miaixz." + i.name)];
  const sorted = [...expected].sort();
  if (JSON.stringify([...font.glyphOrder].sort()) !== JSON.stringify(sorted))
    fail("JSON/UFO glyph set mismatch.");
  for (const [index, axis] of Object.values(source.design.axes).entries()) {
    const actual = font.axes[index];
    for (const key of ["tag", "minimum", "default", "maximum"])
      if (actual[key] !== axis[key])
        fail("Designspace/design axis mismatch: " + axis.tag + "." + key);
  }
  for (const master of font.masters) {
    const { fontinfo, lib } = master.metadata;
    if (
      fontinfo.familyName !== source.design.font.familyName ||
      fontinfo.unitsPerEm !== source.design.font.unitsPerEm
    )
      fail(master.relativePath + ": familyName/unitsPerEm mismatch.");
    for (const key of ["versionMajor", "versionMinor", "openTypeNameVersion"])
      if (Object.hasOwn(fontinfo, key))
        fail(master.relativePath + ": project release metadata is forbidden: " + key);
    if (mapping && JSON.stringify(lib["public.glyphOrder"]) !== JSON.stringify(expected))
      fail(master.relativePath + ": public.glyphOrder mismatch.");
  }
  const records = new Map(source.icons.map((i) => ["miaixz." + i.name, i]));
  for (const glyph of font.glyphs) {
    if (glyph.glyphName === ".notdef") continue;
    const record = records.get(glyph.glyphName);
    if (!record) fail("Unknown glyph: " + glyph.glyphName);
    if (mapping && (glyph.codepoints.length !== 1 || glyph.codepoints[0] !== record.codepoint))
      fail(glyph.glyphName + ": JSON/UFO Unicode mismatch.");
    const signature = glyph.masters[font.defaultMaster].topologySignature;
    for (const master of glyph.masters) {
      const label = record.name + " / " + master.masterPath;
      if (master.advance.width !== source.design.font.unitsPerEm)
        fail(label + ": advance.width mismatch.");
      if (master.topologySignature !== signature) fail(label + ": incompatible topology.");
      if (
        !master.nonEmpty ||
        !master.bounds ||
        !(master.bounds[2] > master.bounds[0]) ||
        !(master.bounds[3] > master.bounds[1])
      )
        fail(label + ": empty or degenerate mapped outline.");
    }
  }
}

/**
 * Validates source structure and identity without applying optical thresholds.
 * @param {{assetsRoot?:string,fontsRoot?:string}} options Isolated source roots.
 * @returns {Promise<any>} Validated JSON projection.
 */
export async function validateFontSource(options = {}) {
  const root = options.assetsRoot ?? assetsRoot;
  const fontRoot = options.fontsRoot ?? resolve(root, "fonts");
  const source = await loadIconSource({ assetsRoot: root });
  const font = await inspectFontSource({ fontsRoot: fontRoot });
  validateFontProjection(source, font);
  const entries = (await readdir(fontRoot)).sort();
  const expected = [...font.masters.map((m) => m.relativePath), "miaixz-icons.designspace"].sort();
  if (JSON.stringify(entries) !== JSON.stringify(expected))
    throw new Error("Font source directory set mismatch.");
  return source;
}

/**
 * Hashes exactly the raw files consumed by both source readers.
 * @param {{assetsRoot?:string,fontsRoot?:string,source?:any,font?:any}} options Source roots/projections.
 * @returns {Promise<string>} SHA-256 of ASCII-sorted [repository-relative path, digest] pairs.
 */
export async function sourceSha256(options = {}) {
  const root = options.assetsRoot ?? assetsRoot,
    fontRoot = options.fontsRoot ?? resolve(root, "fonts");
  const source = options.source ?? (await loadIconSource({ assetsRoot: root }));
  const font = options.font ?? (await inspectFontSource({ fontsRoot: fontRoot }));
  const jsonFiles = ["schema.json", "icons.json", "design.json", ...source.shardPaths].map((p) =>
    resolve(root, p),
  );
  const fontFiles = await Promise.all(
    (await fontSourceFiles({ fontsRoot: fontRoot, source: font })).map((p) =>
      secureSourcePath(fontRoot, p),
    ),
  );
  const pairs = await Promise.all(
    [...jsonFiles, ...fontFiles].map(async (file) => [
      relative(repositoryRoot, file).split(sep).join("/"),
      createHash("sha256")
        .update(await readFile(file))
        .digest("hex"),
    ]),
  );
  pairs.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  return createHash("sha256").update(JSON.stringify(pairs)).digest("hex");
}

/**
 * Measures every mapped glyph/master and preserves all raw diagnostics.
 * @param {{assetsRoot?:string,fontsRoot?:string,reportPath?:string}} options Source/report roots.
 * @returns {Promise<any>} Complete report, even when optical rules fail.
 */
export async function measureFontSource(options = {}) {
  const root = options.assetsRoot ?? assetsRoot,
    fontRoot = options.fontsRoot ?? resolve(root, "fonts");
  const source = await loadIconSource({ assetsRoot: root }),
    font = await inspectFontSource({ fontsRoot: fontRoot });
  validateFontProjection(source, font);
  const glyphs = new Map(font.glyphs.map((g) => [g.glyphName, g]));
  const entries = [],
    summary = [];
  for (const icon of source.icons)
    for (const master of glyphs.get("miaixz." + icon.name).masters) {
      const bounds = master.bounds,
        width = bounds[2] - bounds[0],
        height = bounds[3] - bounds[1];
      const measurement = {
        bounds,
        width,
        height,
        longestEdge: Math.max(width, height),
        aspectRatio: width / height,
        center: master.center,
        nonEmpty: master.nonEmpty,
      };
      entries.push({
        name: icon.name,
        masterPath: master.masterPath,
        opticalClass: icon.opticalClass,
        ...measurement,
        ...validateGlyphGeometry({
          measurement,
          opticalClass: icon.opticalClass,
          design: source.design,
        }),
      });
    }
  for (const opticalClass of Object.keys(source.design.opticalClasses))
    for (const master of font.masters) {
      const selected = entries.filter(
        (e) => e.opticalClass === opticalClass && e.masterPath === master.relativePath,
      );
      summary.push({
        opticalClass,
        masterPath: master.relativePath,
        iconCount: selected.length,
        failedCount: selected.filter((e) => e.violations.length).length,
        violationCount: selected.reduce((sum, e) => sum + e.violations.length, 0),
      });
    }
  const report = {
    sourceSha256: await sourceSha256({ assetsRoot: root, fontsRoot: fontRoot, source, font }),
    iconCount: source.icons.length,
    masters: font.masters.map((m) => m.relativePath),
    entries,
    summary,
    status: entries.some((e) => e.violations.length) ? "failed" : "passed",
  };
  const reportPath =
    options.reportPath ??
    resolve(repositoryRoot, "packages/icons/tests/.artifacts/icon-geometry/report.json");
  await mkdir(resolve(reportPath, ".."), { recursive: true });
  await writeFile(reportPath, JSON.stringify(report, null, 2) + "\n");
  return report;
}

/**
 * Inspects compiled tables and compares current cmap, axes, family and UPM.
 * @param {string} inputDirectory Candidate directory.
 * @returns {Promise<Readonly<Record<string,string>>>} TTX reports.
 */
export async function inspectFonts(inputDirectory) {
  const source = await loadIconSource(),
    temporaryRoot = await mkdtemp(resolve(tmpdir(), "miaixz-icons-inspect-"));
  const tables = ["cmap", "fvar", "STAT", "name", "head", "hhea", "hmtx"],
    reports = {};
  /**
   * Selects matching XML nodes recursively, including the starting node.
   *
   * @param node - Parsed XML subtree to inspect.
   * @param name - Exact element name to collect.
   * @returns Matching nodes in depth-first source order.
   */
  const descendants = (node, name) => [
    ...(node.name === name ? [node] : []),
    ...node.children.flatMap((n) => descendants(n, name)),
  ];
  try {
    for (const filename of expectedFontFiles) {
      const output = resolve(temporaryRoot, filename + ".ttx");
      await runFontTool("ttx", [
        ...tables.flatMap((t) => ["-t", t]),
        "-o",
        output,
        resolve(inputDirectory, filename),
      ]);
      const xml = await readFile(output, "utf8"),
        tree = parseXml(xml, filename);
      for (const table of tables)
        if (descendants(tree, table).length !== 1)
          throw new Error(filename + " lacks required " + table + " table.");
      const points = [
        ...new Set(descendants(tree, "map").map((n) => Number(n.attributes.code))),
      ].sort((a, b) => a - b);
      if (JSON.stringify(points) !== JSON.stringify(source.icons.map((i) => i.codepoint)))
        throw new Error(filename + ": cmap differs from JSON.");
      const axes = descendants(descendants(tree, "fvar")[0], "Axis");
      for (const [index, axis] of Object.values(source.design.axes).entries()) {
        const node = axes[index];
        /**
         * Reads a trimmed scalar child of the current inspected font-table node.
         *
         * @param name - Font-table field name.
         * @returns Field text, or undefined when the node or field is absent.
         */
        const value = (name) => node?.children.find((n) => n.name === name)?.text.trim();
        if (
          value("AxisTag") !== axis.tag ||
          Number(value("MinValue")) !== axis.minimum ||
          Number(value("DefaultValue")) !== axis.default ||
          Number(value("MaxValue")) !== axis.maximum
        )
          throw new Error(filename + ": fvar axis differs: " + axis.tag);
      }
      if (axes.length !== 2) throw new Error(filename + ": unexpected fvar axes.");
      const statAxes = descendants(descendants(tree, "DesignAxisRecord")[0], "Axis");
      if (
        statAxes.length !== 2 ||
        statAxes.some(
          (n, i) =>
            n.children.find((c) => c.name === "AxisTag")?.attributes.value !==
            Object.values(source.design.axes)[i].tag,
        )
      )
        throw new Error(filename + ": STAT axes differ.");
      if (
        Number(descendants(tree, "unitsPerEm")[0]?.attributes.value) !==
        source.design.font.unitsPerEm
      )
        throw new Error(filename + ": unitsPerEm differs.");
      const families = descendants(tree, "namerecord").filter((n) =>
        ["1", "16"].includes(n.attributes.nameID),
      );
      if (!families.length || families.some((n) => n.text.trim() !== source.design.font.familyName))
        throw new Error(filename + ": familyName differs.");
      reports[filename] = xml;
    }
    return Object.freeze(reports);
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
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
  await inspectFonts(fontDirectory);
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
  const args = process.argv.slice(2);
  if (
    args[0] !== "--mode" ||
    !["source", "inspect", "measure", "validate"].includes(args[1]) ||
    (args[1] === "inspect"
      ? args.length !== 4 || args[2] !== "--input" || !args[3] || args[3].startsWith("--")
      : args.length !== 2)
  )
    throw new Error(
      "Expected --mode source|measure|validate or --mode inspect --input <font-dir>.",
    );
  const mode = args[1];
  if (mode === "source") {
    await validateFontSource();
    process.stdout.write("Miaixz icon font sources are valid.\n");
  } else if (mode === "inspect") {
    const reports = await inspectFonts(resolve(args[3]));
    for (const [name, xml] of Object.entries(reports))
      process.stdout.write(name + "\n" + xml + "\n");
  } else {
    const report = await measureFontSource();
    process.stdout.write(
      JSON.stringify(
        { iconCount: report.iconCount, status: report.status, summary: report.summary },
        null,
        2,
      ) + "\n",
    );
    if (mode === "validate" && report.status !== "passed")
      throw new Error(
        "Icon geometry failed; complete diagnostics are in tests/.artifacts/icon-geometry/report.json.",
      );
  }
}

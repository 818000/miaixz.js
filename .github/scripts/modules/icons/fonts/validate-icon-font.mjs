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
import { stat } from "node:fs/promises";
import { readFile, readdir, rm } from "node:fs/promises";
import { dirname, resolve, relative, sep } from "node:path";
import { pathToFileURL } from "node:url";

import { readRepositoryVersion } from "../../../miaixz.mjs";
import { assetsRoot, loadIconSource, measureIconRuntime, repositoryRoot } from "../source.mjs";

const release = readRepositoryVersion(repositoryRoot);
const allowedExecutables = new Set([
  "fontbakery",
  "fontmake",
  "fonttools",
  "ttx",
  "python3",
  process.execPath,
]);
const expectedFontFiles = Object.freeze(["miaixz-icons.woff2"]);

import {
  inspectFontSource,
  fontSourceFiles,
  parseXml,
  secureSourcePath,
  fontCopyright,
  fontLicense,
  validateFontCopyrightHeader,
} from "./read-font-source.mjs";
import {
  compareOutlineBoundaries,
  measureGlyph,
  measureInkMoments,
  validateGlyphGeometry,
} from "./font-geometry.mjs";
import {
  compatibleSourceContours,
  contourSignedArea,
  interpolateIconSource,
  measureSourceAxisBehavior,
  sourceMasterName,
} from "./interpolate-icon-source.mjs";

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
            `${executable} exited with ${code ?? `signal ${String(signal)}`}\n${stderr}${stdout ? "\n" + stdout : ""}`,
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
    if (
      fontinfo.copyright !== fontCopyright ||
      fontinfo.openTypeNameLicense !== fontLicense ||
      fontinfo.openTypeNameLicenseURL !== "https://www.apache.org/licenses/LICENSE-2.0"
    )
      fail(master.relativePath + ": font copyright/license metadata mismatch.");
    for (const key of [
      "versionMajor",
      "versionMinor",
      "openTypeNameVersion",
      "openTypeNameUniqueID",
    ])
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
  for (const path of await fontSourceFiles({
    fontsRoot: fontRoot,
    source: font,
  }))
    validateFontCopyrightHeader(
      await readFile(await secureSourcePath(fontRoot, path), "utf8"),
      path,
    );
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
 * @param {{assetsRoot?:string,fontsRoot?:string}} options Source/report roots.
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
    sourceSha256: await sourceSha256({
      assetsRoot: root,
      fontsRoot: fontRoot,
      source,
      font,
    }),
    iconCount: source.icons.length,
    masters: font.masters.map((m) => m.relativePath),
    entries,
    summary,
    status: entries.some((e) => e.violations.length) ? "failed" : "passed",
  };
  return report;
}

/**
 * Inspects compiled tables and compares current cmap, axes, family and UPM.
 * @param {string} inputDirectory Candidate directory.
 * @returns {Promise<Readonly<Record<string,string>>>} TTX reports.
 */
export async function inspectFonts(inputDirectory) {
  const source = await loadIconSource();
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
  for (const filename of expectedFontFiles) {
    const result = await runFontTool("ttx", [
      ...tables.flatMap((t) => ["-t", t]),
      "-o",
      "-",
      resolve(inputDirectory, filename),
    ]);
    const xml = result.stdout,
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
      Number(descendants(tree, "unitsPerEm")[0]?.attributes.value) !== source.design.font.unitsPerEm
    )
      throw new Error(filename + ": unitsPerEm differs.");
    const families = descendants(tree, "namerecord").filter((n) =>
      ["1", "16"].includes(n.attributes.nameID),
    );
    if (!families.length || families.some((n) => n.text.trim() !== source.design.font.familyName))
      throw new Error(filename + ": familyName differs.");
    validateFontNameRecords(descendants(tree, "namerecord"));
    validateFontReleaseRecords(descendants(tree, "namerecord"));
    const [major, minor, patch] = readRepositoryVersion(repositoryRoot).split(/[.-]/u).map(Number);
    const revision = Number(`${major}.${String(minor * 100 + patch).padStart(3, "0")}`);
    const actualRevision = Number(descendants(tree, "fontRevision")[0]?.attributes.value);
    if (!Number.isFinite(actualRevision) || Math.abs(actualRevision - revision) > 1 / 65536)
      throw new Error(filename + ": fontRevision does not derive from VERSION.");
    reports[filename] = xml;
  }
  return Object.freeze(reports);
}

/**
 * Checks the actual binary font's copyright and full Apache notice, not a sidecar.
 * @param {object[]} records Parsed OpenType name-table records.
 * @returns {void} Throws on absent or inconsistent name IDs 0, 13 or 14.
 */
export function validateFontNameRecords(records) {
  const expected = {
    0: fontCopyright,
    13: fontLicense,
    14: "https://www.apache.org/licenses/LICENSE-2.0",
  };
  for (const [id, value] of Object.entries(expected)) {
    const matches = records.filter((record) => String(record.attributes.nameID) === id);
    if (!matches.length || matches.some((record) => record.text.trim() !== value))
      throw new Error(
        "Compiled font copyright/license name ID " + id + " is missing or inconsistent.",
      );
  }
}

/**
 * Requires compiled release names to derive from the sole repository VERSION.
 * @param {object[]} records Parsed OpenType name-table records.
 * @returns {void} Throws when either release field is missing or mismatched.
 */
export function validateFontReleaseRecords(records) {
  const currentRelease = readRepositoryVersion(repositoryRoot);
  const [major, minor, patch] = currentRelease.split(/[.-]/u).map(Number);
  const expected = `Version ${major}.${String(minor * 100 + patch).padStart(3, "0")}`;
  for (const id of ["3", "5"]) {
    const selected = records.filter((record) => String(record.attributes.nameID) === id);
    if (
      !selected.length ||
      selected.some((record) => {
        const value = record.text.trim();
        return id === "5" ? value !== expected : !value.endsWith(";" + currentRelease);
      })
    )
      throw new Error("Compiled font release name ID " + id + " does not derive from VERSION.");
  }
}

/**
 * Runs FontBakery and enforces the single-font size/output contract.
 *
 * @param {string} fontDirectory Candidate font directory.
 * @returns {Promise<readonly object[]>} Actual results kept only in memory.
 */
export async function validateFontOutputs(fontDirectory) {
  const source = await loadIconSource();
  const files = (await readdir(fontDirectory)).filter((name) => !name.startsWith(".")).sort();
  if (JSON.stringify(files) !== JSON.stringify(expectedFontFiles)) {
    throw new Error(`Compiled font set mismatch: ${files.join(", ") || "empty"}.`);
  }
  await inspectFonts(fontDirectory);
  const reports = [];
  for (const filename of expectedFontFiles) {
    const input = resolve(fontDirectory, filename);
    if ((await stat(input)).size > source.design.limits.fontBytes) {
      throw new Error(`${filename} exceeds ${source.design.limits.fontBytes} bytes.`);
    }
    const validationFont = resolve(fontDirectory, `.${filename.replace(/\.woff2$/u, "")}.ttf`);
    try {
      await runFontTool("fonttools", ["ttLib.woff2", "decompress", input, "-o", validationFont]);
      const quality = await runFontTool("python3", [
        "-c",
        fontBakeryWoff2EntryPoint(),
        validationFont,
        "check-universal",
        "--skip-network",
        "--no-progress",
        "--no-colors",
        "--error-code-on",
        "WARN",
        ...FONTBAKERY_EXCLUSIONS.flatMap(({ id }) => ["--exclude-checkid", id]),
        input,
      ]);
      process.stdout.write(quality.stdout);
      reports.push({ filename, status: "passed" });
    } finally {
      await rm(validationFont, { force: true });
    }
  }
  return Object.freeze(reports);
}

/**
 * Routes the transport-size check to WOFF2 and every other selected check to its decoded TTF.
 * The locked FreeType backend and superfamily discovery require TTF, while file_size measures serving cost.
 * Both routes use the unchanged universal checks, thresholds, conditions and exclusion policy.
 * The original execution order is partitioned completely and exactly once; either route can fail the build.
 * @returns {string} In-memory Python entry point for the locked quality tool.
 */
export function fontBakeryWoff2EntryPoint() {
  return [
    "import sys",
    "from fontbakery.testable import Font",
    "from fontbakery.cli import main, profile_factory, get_module, setup_context, CheckRunner, Configuration",
    "decoded = sys.argv.pop(1)",
    "arguments = sys.argv[1:]",
    "if arguments[0] != 'check-universal' or '--checkid' in arguments: raise ValueError('Full universal suite required')",
    "excluded = [arguments[i+1] for i, value in enumerate(arguments) if value == '--exclude-checkid']",
    "profile = profile_factory(get_module('fontbakery.profiles.universal'))",
    "runner = CheckRunner(profile, context=setup_context([decoded]), config=Configuration(exclude_checks=excluded, skip_network=True))",
    "checks = [identity.check.id for identity in runner.order]",
    "if len(checks) != len(set(checks)) or not {'file_size', 'interpolation_issues', 'overlapping_path_segments', 'freetype_rasterizer'}.issubset(checks): raise ValueError('Incomplete or duplicate universal execution plan')",
    "routes = [(decoded, [check for check in checks if check != 'file_size']), (arguments[-1], ['file_size'])]",
    "if sorted(check for _, selected in routes for check in selected) != sorted(checks): raise ValueError('Font quality route lost a check')",
    "Font.extensions = [*Font.extensions, 'woff2']",
    "results = []",
    "for file, selected in routes:",
    " sys.argv = ['fontbakery', *arguments[:-1], *[value for check in selected for value in ('--checkid', check)], file]",
    " results.append(main())",
    "print('Complete universal execution plan:', len(checks), 'checks; decoded structure and published transport size')",
    "sys.exit(max(results))",
  ].join("\n");
}

/**
 * Reads actual locked tool distributions from the interpreter used for font processing.
 * @returns {Promise<object[]>} Measured versions; a mismatch with the committed lock fails.
 */
export async function readFontToolVersions() {
  const script =
    "import json, importlib.metadata as m; print(json.dumps({k:m.version(k) for k in ['fontmake','fonttools','ufo2ft','fontbakery']}))";
  const versions = JSON.parse((await runFontTool("python3", ["-c", script])).stdout);
  const lock = await readFile(
    resolve(repositoryRoot, ".github/scripts/modules/icons/fonts/font-toolchain.lock.txt"),
    "utf8",
  );
  return Object.entries(versions).map(([name, version]) => {
    const expected = lock
      .split("\n")
      .find((line) => line.startsWith(name + "=="))
      ?.split("==")[1]
      .trim()
      .split(" ")[0];
    if (expected !== version) throw new Error("Font tool version differs from lock: " + name);
    return { name, version };
  });
}

/**
 * Extracts actual variable-font curves at continuous coordinates, decomposing components in fontTools.
 * This is the compiled side only; the correct reference always comes independently from six GLIFs.
 * @param {{fontPath:string,fill:number,opticalSize:number}} input Actual published font and validated axes.
 * @returns {Promise<Map<number,object[]>>} Codepoint-indexed actual font contours.
 */
export async function readCompiledGlyphs({ fontPath, fill, opticalSize }) {
  const script = [
    "import json,sys",
    "from fontTools.ttLib import TTFont",
    "from fontTools.pens.recordingPen import DecomposingRecordingPen",
    "f=TTFont(sys.argv[1])",
    "g=f.getGlyphSet(location={'FILL':float(sys.argv[2]),'opsz':float(sys.argv[3])})",
    "result=[]",
    "for code,name in sorted(f.getBestCmap().items()):",
    " p=DecomposingRecordingPen(g); g[name].draw(p)",
    " result.append([code,p.value])",
    "print(json.dumps(result,separators=(',',':'),allow_nan=False))",
  ].join("\n");
  const raw = JSON.parse(
    (await runFontTool("python3", ["-c", script, fontPath, String(fill), String(opticalSize)]))
      .stdout,
  );
  const result = new Map();
  for (const [code, operations] of raw) {
    const contours = [];
    let points = null;
    const point = (p, type) => ({
      x: p[0],
      y: p[1],
      type,
      smooth: false,
      name: null,
    });
    for (const [op, args] of operations) {
      if (op === "moveTo") {
        if (points) throw new Error("Compiled contour was not closed.");
        points = [point(args[0], "line")];
      } else if (op === "lineTo") {
        if (!points) throw new Error("Compiled line has no start.");
        points.push(...args.map((p) => point(p, "line")));
      } else if (op === "curveTo" || op === "qCurveTo") {
        if (op === "qCurveTo" && args.at(-1) === null) {
          if (points) throw new Error("Invalid implied quadratic contour.");
          points = args.slice(0, -1).map((p) => point(p, "offcurve"));
        } else {
          if (!points) throw new Error("Compiled curve has no start.");
          if (op === "curveTo" && args.length !== 3)
            throw new Error("Unsupported compiled super-Bézier curve.");
          points.push(
            ...args.slice(0, -1).map((p) => point(p, "offcurve")),
            point(args.at(-1), op === "curveTo" ? "curve" : "qcurve"),
          );
        }
      } else if (op === "closePath") {
        if (!points?.length) throw new Error("Empty compiled contour.");
        const first = points[0],
          last = points.at(-1);
        if (
          points.length > 1 &&
          first.x === last.x &&
          first.y === last.y &&
          last.type !== "offcurve"
        ) {
          first.type = last.type;
          points.pop();
        }
        contours.push({ closed: true, outlineIndex: contours.length, points });
        points = null;
      } else throw new Error("Unsupported or open compiled outline operation: " + op);
    }
    if (points) throw new Error("Compiled contour is open.");
    result.set(code, contours);
  }
  return result;
}

/**
 * Performs complete geometry verification, real font quality, two-build determinism and actual budgets.
 * Results are measured in memory and printed; no process or acceptance files are written.
 * @returns {Promise<object>} Actual measurements, not a declaration of complete visual/semantic refinement.
 */
export async function validateRefinedFont() {
  await validateFontSource();
  const source = await loadIconSource();
  const font = await inspectFontSource({
    fontsRoot: resolve(assetsRoot, "fonts"),
  });
  const tools = await readFontToolVersions(),
    glyphs = [],
    checks = [];
  const compatible = new Map(),
    behaviors = new Map();
  const error = (code, message, path = null, sampleKey = null) => ({
    code,
    message,
    path,
    sampleKey,
  });
  for (const icon of source.icons) {
    const glyphName = "miaixz." + icon.name,
      errors = [],
      masters = [];
    try {
      const contours = compatibleSourceContours({ source: font, glyphName });
      compatible.set(icon.name, contours);
      behaviors.set(icon.name, measureSourceAxisBehavior(contours));
    } catch (e) {
      errors.push(error("SOURCE_COMPATIBILITY", e.message, null, icon.name));
    }
    for (const [i, m] of font.masters.entries()) {
      const master = sourceMasterName(m),
        raw = font.rawMasters[i].get(glyphName),
        failures = [];
      let measured = null,
        centerDistance = null;
      try {
        measured = measureGlyph({ glyphName, glyphs: font.rawMasters[i] });
        const geometry = validateGlyphGeometry({
          measurement: measured,
          opticalClass: icon.opticalClass,
          design: source.design,
        });
        centerDistance = geometry.centerDistance;
        for (const v of geometry.violations)
          failures.push(
            error("GEOMETRY", JSON.stringify(v), raw.sourcePath, icon.name + "|" + master),
          );
      } catch (e) {
        failures.push(
          error("SOURCE_GEOMETRY", e.message, raw?.sourcePath ?? null, icon.name + "|" + master),
        );
      }
      masters.push({
        master,
        sha256: raw.sha256,
        bounds: measured?.bounds ?? null,
        longestEdge: measured?.longestEdge ?? null,
        centerDistance,
        status: failures.length ? "failed" : "passed",
        errors: failures,
      });
      errors.push(...failures);
    }
    glyphs.push({
      name: icon.name,
      masters,
      states: [],
      axisBehavior: behaviors.get(icon.name) ?? null,
      status: errors.length ? "failed" : "passed",
      errors,
    });
  }
  const fontPath = resolve(repositoryRoot, "packages/icons/dist/assets/fonts/miaixz-icons.woff2");
  for (const opticalSize of [12, 16, 20, 24, 32, 40])
    for (const fill of [0, 0.25, 0.5, 0.75, 1]) {
      let compiled = null,
        compilationError = null;
      try {
        compiled = await readCompiledGlyphs({ fontPath, fill, opticalSize });
      } catch (e) {
        compilationError = e;
      }
      for (const [index, icon] of source.icons.entries()) {
        const entry = glyphs[index],
          errors = [];
        let measurement = null,
          moments = null;
        try {
          if (compilationError) throw compilationError;
          if (!compatible.has(icon.name)) throw new Error("Source topology is not compatible.");
          const reference = interpolateIconSource({
            source: font,
            glyphName: "miaixz." + icon.name,
            fill,
            opticalSize,
            compatible: compatible.get(icon.name),
          });
          const actual = compiled.get(icon.codepoint);
          if (!actual?.length) throw new Error("Compiled mapped outline is empty.");
          if (actual.length !== reference.contours.length)
            throw new Error("Compiled contour count differs from the independent source.");
          const orientation =
            Math.sign(contourSignedArea(actual[0])) *
            Math.sign(contourSignedArea(reference.contours[0]));
          if (
            !orientation ||
            actual.some(
              (contour, i) =>
                Math.sign(contourSignedArea(contour)) !==
                orientation * Math.sign(contourSignedArea(reference.contours[i])),
            )
          )
            throw new Error("Compiled hole orientation differs from the independent source.");
          measurement = compareOutlineBoundaries({
            sourceContours: reference.contours,
            compiledContours: actual,
            tolerance: source.design.visual.comparison.subdivisionUnits,
            boundaryLimit: source.design.visual.comparison.compiledOutlineUnits,
          });
          const sourceMoments = measureInkMoments(
              reference.contours,
              source.design.visual.comparison.subdivisionUnits,
            ),
            compiledMoments = measureInkMoments(
              actual,
              source.design.visual.comparison.subdivisionUnits,
            );
          moments = {
            sourceAreaUnits: sourceMoments.area,
            fontAreaUnits: compiledMoments.area,
            areaRelativeError:
              Math.abs(sourceMoments.area - compiledMoments.area) / sourceMoments.area,
            sourceCentroidUnits: sourceMoments.centroid,
            fontCentroidUnits: compiledMoments.centroid,
            centroidDistancePixels:
              (Math.hypot(
                ...sourceMoments.centroid.map((v, axis) => v - compiledMoments.centroid[axis]),
              ) *
                opticalSize *
                2) /
              source.design.font.unitsPerEm,
          };
          if (moments.areaRelativeError > source.design.visual.comparison.areaRelativeError)
            errors.push(
              error(
                "COMPILED_AREA",
                "Nonzero-winding ink area differs beyond the fixed limit.",
                null,
                icon.name + "|" + opticalSize + "|" + fill,
              ),
            );
          if (moments.centroidDistancePixels > source.design.visual.comparison.centroidPixels)
            errors.push(
              error(
                "COMPILED_CENTROID",
                "Outline centroid differs beyond the fixed DPR-2 limit.",
                null,
                icon.name + "|" + opticalSize + "|" + fill,
              ),
            );
          if (measurement.maxBoundaryUnits > source.design.visual.comparison.compiledOutlineUnits)
            errors.push(
              error(
                "COMPILED_BOUNDARY",
                "Source-to-font boundary exceeds the fixed limit.",
                null,
                icon.name + "|" + opticalSize + "|" + fill,
              ),
            );
        } catch (e) {
          errors.push(
            error("COMPILED_OUTLINE", e.message, null, icon.name + "|" + opticalSize + "|" + fill),
          );
        }
        entry.states.push({
          opticalSize,
          fill,
          maxBoundaryUnits: measurement?.maxBoundaryUnits ?? null,
          subdivisionErrorUnits: measurement?.subdivisionErrorUnits ?? null,
          outlineMoments: moments,
          status: errors.length ? "failed" : "passed",
          errors,
        });
        entry.errors.push(...errors);
        if (errors.length) entry.status = "failed";
      }
      console.log(
        "Measured actual source/font outlines at opsz=" + opticalSize + ", FILL=" + fill + ".",
      );
    }
  const command = [
    "node",
    ".github/scripts/modules/icons/fonts/validate-icon-font.mjs",
    "--mode",
    "validate",
  ];
  const check = async (id, operation, measurements = {}) => {
    const startedAt = new Date().toISOString();
    let errors = [],
      status = "passed",
      measured = typeof measurements === "function" ? measurements() : measurements;
    try {
      measured = (await operation()) ?? measured;
    } catch (e) {
      status = "failed";
      errors = [error(id.toUpperCase().replaceAll("-", "_"), e.message)];
      measured = typeof measurements === "function" ? measurements() : measurements;
    }
    checks.push({
      id,
      command,
      cwd: ".",
      exitCode: status === "passed" ? 0 : 1,
      status,
      startedAt,
      finishedAt: new Date().toISOString(),
      errors,
      measurements: measured,
    });
  };
  await check("source-compatibility", () => {
    validateFontProjection(source, font);
    if (compatible.size !== source.icons.length)
      throw new Error("Incomplete compatible source set.");
  });
  await check("compiled-outlines", () => {
    if (glyphs.some((g) => g.states.length !== 30 || g.states.some((s) => s.status !== "passed")))
      throw new Error("Source/compiled outline comparison failed.");
  });
  await check("axis-behavior", () => {
    if (behaviors.size !== source.icons.length)
      throw new Error("Actual source axis measurement is incomplete.");
  });
  let firstSha256 = null,
    secondSha256 = null;
  await check(
    "font-determinism",
    async () => {
      const buildScript = resolve(
        repositoryRoot,
        ".github/scripts/modules/icons/fonts/build-icon-font.mjs",
      );
      const build = async () => {
        const { stdout } = await runFontTool(process.execPath, [buildScript, "--check"]);
        const resultLine = stdout
          .trimEnd()
          .split("\n")
          .findLast((line) => line.startsWith("MIAIXZ_FONT_HASHES="));
        if (resultLine === undefined) {
          throw new Error("Deterministic build returned no machine-readable result.");
        }
        const hashes = JSON.parse(resultLine.slice("MIAIXZ_FONT_HASHES=".length));
        const hash = hashes["miaixz-icons.woff2"];
        if (typeof hash !== "string")
          throw new Error("Deterministic build returned no WOFF2 hash.");
        return hash;
      };
      firstSha256 = await build();
      secondSha256 = await build();
      const published = createHash("sha256")
        .update(await readFile(fontPath))
        .digest("hex");
      if (firstSha256 !== secondSha256 || firstSha256 !== published)
        throw new Error("Deterministic candidates differ from the actual release font.");
      return { firstSha256, secondSha256 };
    },
    () => ({ firstSha256, secondSha256 }),
  );
  /**
   * Each measured hash comes from a separately executed build, never a copied prior value.
   */
  let fontBytes = null;
  await check(
    "font-budget",
    async () => {
      fontBytes = (await stat(fontPath)).size;
      if (fontBytes > source.design.limits.fontBytes)
        throw new Error("Actual font byte budget exceeded.");
      return { bytes: fontBytes, limit: source.design.limits.fontBytes };
    },
    () => ({ bytes: fontBytes, limit: source.design.limits.fontBytes }),
  );
  let runtimeBytes = null;
  await check(
    "runtime-budget",
    async () => {
      const measured = await measureIconRuntime(resolve(repositoryRoot, "packages/icons/dist"));
      runtimeBytes = measured.bytes;
      if (runtimeBytes > source.design.limits.runtimeBytes)
        throw new Error("Actual runtime table byte budget exceeded.");
      return { ...measured, limit: source.design.limits.runtimeBytes };
    },
    () => ({ bytes: runtimeBytes, limit: source.design.limits.runtimeBytes }),
  );
  await check("font-quality", () => validateFontOutputs(dirname(fontPath)));
  const units = [...glyphs, ...checks],
    status = units.some((unit) => unit.status !== "passed") ? "failed" : "passed";
  if (status !== "passed") {
    const failures = units.flatMap((unit) => unit.errors);
    console.error(
      JSON.stringify({
        status,
        errorCount: failures.length,
        firstErrors: failures.slice(0, 25),
      }),
    );
  }
  return {
    status,
    glyphs,
    checks,
    tools,
    fontSha256: createHash("sha256")
      .update(await readFile(fontPath))
      .digest("hex"),
    sourceSha256: await sourceSha256(),
  };
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
    const inspected = await inspectFonts(resolve(args[3]));
    console.log("Font tables and VERSION validated: " + Object.keys(inspected).join(", "));
  } else if (mode === "validate") {
    const report = await validateRefinedFont();
    console.log(
      JSON.stringify({
        status: report.status,
        glyphs: report.glyphs.length,
        failedGlyphs: report.glyphs.filter((glyph) => glyph.status !== "passed").length,
        failedChecks: report.checks.filter((check) => check.status !== "passed").length,
      }),
    );
    if (report.status !== "passed")
      throw new Error("Refined font geometry is incomplete or failed.");
  } else {
    const report = await measureFontSource();
    process.stdout.write(
      JSON.stringify(
        {
          iconCount: report.iconCount,
          status: report.status,
          summary: report.summary,
        },
        null,
        2,
      ) + "\n",
    );
  }
}

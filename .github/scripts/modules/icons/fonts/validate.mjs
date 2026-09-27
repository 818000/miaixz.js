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
 * Validates the deterministic Miaixz Designspace and UFO source contract.
 */

import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { generateGlyphs } from "../codegen/generate-glyphs.mjs";

const moduleRoot = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(moduleRoot, "../../../../../");
const assetsRoot = resolve(repositoryRoot, "packages/icons/src/assets");
const fontsRoot = resolve(assetsRoot, "fonts");
const designspacePath = resolve(fontsRoot, "miaixz-icons.designspace");

/**
 * Lists the six permitted UFO source directory names.
 */
export const EXPECTED_MASTER_DIRECTORIES = Object.freeze([
  "miaixz-icons-filled-compact.ufo",
  "miaixz-icons-filled-display.ufo",
  "miaixz-icons-filled-standard.ufo",
  "miaixz-icons-outline-compact.ufo",
  "miaixz-icons-outline-display.ufo",
  "miaixz-icons-outline-standard.ufo",
]);

const allowedExecutables = new Set(["fontbakery", "fontmake", "fonttools", "ttx"]);
const expectedFontFiles = Object.freeze(["miaixz-icons.woff2"]);
/**
 * Universal-profile checks that intentionally conflict with the frozen icon-font
 * contract. Each exclusion is scoped to release 0.6.5 and is visible to tests.
 */
export const FONTBAKERY_EXCLUSIONS = Object.freeze([
  {
    id: "opentype/fvar/regular_coords_correct",
    reason: "The required default instance is named Outline Standard, not Regular.",
    throughVersion: "0.6.5",
  },
  {
    id: "opentype/varfont/valid_default_instance_nameids",
    reason: "The frozen default fvar instance is explicitly named Outline Standard.",
    throughVersion: "0.6.5",
  },
  {
    id: "opentype/monospace",
    reason:
      "Subset compression may reduce hhea.numberOfHMetrics below the text-font recommendation.",
    throughVersion: "0.6.5",
  },
  {
    id: "opentype/post_table_version",
    reason: "The icon font deliberately uses post format 3 without glyph names.",
    throughVersion: "0.6.5",
  },
  {
    id: "opentype/unitsperem",
    reason: "The frozen 24-unit grid maps exactly to the required 960 UPM.",
    throughVersion: "0.6.5",
  },
  {
    id: "cmap/format_12",
    reason: "SPUA-A-only fonts require format 12 and cannot contain a useful BMP format 4 map.",
    throughVersion: "0.6.5",
  },
  {
    id: "gpos_kerning_info",
    reason: "Fixed-width standalone icon glyphs intentionally have no kerning pairs.",
    throughVersion: "0.6.5",
  },
  {
    id: "mandatory_avar_table",
    reason: "Release 0.6.5 freezes linear FILL and opsz axes without avar mapping.",
    throughVersion: "0.6.5",
  },
  {
    id: "smart_dropout",
    reason: "Release 0.6.5 intentionally ships unhinted scalable icon outlines.",
    throughVersion: "0.6.5",
  },
  {
    id: "whitespace_glyphs",
    reason: "The icon font contract forbids ordinary text and whitespace codepoints.",
    throughVersion: "0.6.5",
  },
]);

/**
 * Runs one allowlisted third-party font command without a shell.
 *
 * @param {string} executable - Allowlisted executable name.
 * @param {readonly string[]} arguments_ - Exact argument vector.
 * @param {{cwd?: string, env?: NodeJS.ProcessEnv}} [options] - Process options.
 * @returns {Promise<{stdout: string, stderr: string}>} Captured process output.
 */
export async function runFontTool(executable, arguments_, options = {}) {
  if (!allowedExecutables.has(executable)) {
    throw new Error(`Disallowed font executable: ${executable}.`);
  }
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
      if (code === 0) {
        resolvePromise({ stdout, stderr });
        return;
      }
      rejectPromise(
        new Error(
          `${executable} exited with ${code ?? `signal ${String(signal)}`}\n${stderr || stdout}`,
        ),
      );
    });
  });
}

/**
 * Reads and parses one required JSON source.
 *
 * @param {string} path - Absolute JSON path.
 * @returns {Promise<unknown>} Parsed JSON value.
 */
async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

/**
 * Validates the complete codepoint ledger and catalog priority tiers.
 *
 * @param {{canonicalNames: readonly string[], coreNames: readonly string[], extendedNames: readonly string[]}} releasePlan - Frozen release plan.
 * @param {{schemaVersion: number, rangeStart: number, icons: readonly {name: string, codepoint: number, glyphName: string, tier: string}[]}} codepointFile - Codepoint ledger.
 * @returns {void}
 */
export function validateCodepoints(releasePlan, codepointFile) {
  if (codepointFile.schemaVersion !== 1 || codepointFile.rangeStart !== 0xf0000) {
    throw new Error("Codepoint ledger must start at U+F0000 with schemaVersion 1.");
  }
  if (
    releasePlan.coreNames.length !== 64 ||
    releasePlan.extendedNames.length !== 960 ||
    releasePlan.canonicalNames.length !== 1024 ||
    codepointFile.icons.length !== 1024
  ) {
    throw new Error("Codepoint ledger requires 64 Core and 960 Extended icons.");
  }
  const names = new Set();
  const codepoints = new Set();
  const glyphNames = new Set();
  for (const [index, icon] of codepointFile.icons.entries()) {
    const expectedName = releasePlan.canonicalNames[index];
    const expectedCodepoint = 0xf0000 + index;
    const expectedTier = index < 64 ? "core" : "extended";
    if (
      icon.name !== expectedName ||
      icon.codepoint !== expectedCodepoint ||
      !Number.isInteger(icon.codepoint) ||
      icon.glyphName !== `miaixz.${icon.name}` ||
      icon.tier !== expectedTier
    ) {
      throw new Error(`Invalid codepoint entry at index ${index}.`);
    }
    if (names.has(icon.name) || codepoints.has(icon.codepoint) || glyphNames.has(icon.glyphName)) {
      throw new Error(`Duplicate codepoint entry at index ${index}.`);
    }
    names.add(icon.name);
    codepoints.add(icon.codepoint);
    glyphNames.add(icon.glyphName);
  }
  if (
    codepointFile.icons[63].codepoint !== 0xf003f ||
    codepointFile.icons[64].codepoint !== 0xf0040 ||
    codepointFile.icons[1023].codepoint !== 0xf03ff
  ) {
    throw new Error("Codepoint range is not contiguous.");
  }
}

/**
 * Requires every design brief to pass the deterministic machine-review policy.
 *
 * @param {{canonicalNames: readonly string[]}} releasePlan - Frozen release plan.
 * @param {{schemaVersion: number, release: string, briefs: readonly Record<string, unknown>[]}} briefFile - Design brief document.
 * @returns {void}
 */
export function validateAutomatedBriefReviews(releasePlan, briefFile) {
  if (
    briefFile.schemaVersion !== 1 ||
    briefFile.release !== "0.6.5" ||
    briefFile.briefs.length !== 1024
  ) {
    throw new Error("Automated brief review requires release 0.6.5 and 1024 briefs.");
  }
  for (const [index, brief] of briefFile.briefs.entries()) {
    const expectedName = releasePlan.canonicalNames[index];
    if (brief.name !== expectedName) {
      throw new Error(`Automated brief review order differs at index ${index}.`);
    }
    if ("reviewers" in brief || "approvalCommit" in brief) {
      throw new Error(`Design brief ${brief.name} contains prohibited human-review fields.`);
    }
    const words = brief.name.split("-");
    const label = words.join(" ");
    const requiredText = [
      "intent",
      "metaphor",
      "compactAdjustments",
      "standardConstruction",
      "displayAdjustments",
      "outlineStrategy",
      "filledStrategy",
      "topologyPlan",
    ];
    if (
      requiredText.some(
        (field) => typeof brief[field] !== "string" || brief[field].trim().length < 16,
      ) ||
      !brief.intent.toLowerCase().includes(label) ||
      !brief.metaphor.toLowerCase().includes(label) ||
      brief.primaryObject !== words[0] ||
      !Array.isArray(brief.secondaryObjects) ||
      brief.secondaryObjects.length === 0 ||
      !Array.isArray(brief.forbiddenMeanings) ||
      brief.forbiddenMeanings.length === 0
    ) {
      throw new Error(`Design brief ${brief.name} fails deterministic semantic review.`);
    }
    const content = { ...brief };
    delete content.automatedReview;
    const expectedDigest = createHash("sha256").update(JSON.stringify(content)).digest("hex");
    const review = brief.automatedReview;
    if (
      review === null ||
      typeof review !== "object" ||
      review.engine !== "miaixz-icons-brief-validator" ||
      review.rulesetVersion !== 1 ||
      review.sourceDigest !== expectedDigest ||
      review.status !== "passed"
    ) {
      throw new Error(`Design brief ${brief.name} has missing or stale automated-review evidence.`);
    }
  }
}

/**
 * Requires a GLIF to contain visible outline geometry.
 *
 * Components count as geometry because their referenced base is validated as
 * part of the same UFO. Empty outline elements and contours without points do
 * not count.
 *
 * @param {string} xml - GLIF source document.
 * @param {string} glyphName - Glyph name used in diagnostics.
 * @returns {void}
 */
export function validateNonEmptyGlyphSource(xml, glyphName) {
  if (typeof xml !== "string" || typeof glyphName !== "string") {
    throw new TypeError("GLIF validation requires XML and a glyph name.");
  }
  const hasPoints = /<contour(?:\s[^>]*)?>[\s\S]*?<point\s[^>]*\/>[\s\S]*?<\/contour>/u.test(xml);
  const hasComponent = /<component\s+[^>]*base="[^"]+"[^>]*\/>/u.test(xml);
  if (!hasPoints && !hasComponent) {
    throw new Error(`Canonical glyph ${glyphName} has no renderable outline.`);
  }
}

/**
 * Validates the mandatory .notdef and rejects every empty canonical glyph.
 *
 * @param {readonly string[]} masterDirectories - Frozen UFO directory names.
 * @param {readonly {glyphName: string}[]} icons - Canonical codepoint rows.
 * @returns {Promise<void>} Promise completed when every GLIF is non-empty.
 */
export async function validateNonEmptyMasterGlyphs(masterDirectories, icons) {
  for (const directory of masterDirectories) {
    const glyphRoot = resolve(fontsRoot, directory, "glyphs");
    validateNonEmptyGlyphSource(
      await readFile(resolve(glyphRoot, "_notdef.glif"), "utf8"),
      ".notdef",
    );
    for (const { glyphName } of icons) {
      validateNonEmptyGlyphSource(
        await readFile(resolve(glyphRoot, `${glyphName}.glif`), "utf8"),
        glyphName,
      );
    }
  }
}

/**
 * Parses XML attributes used by deterministic GLIF source files.
 *
 * @param {string} source - One XML tag without angle-bracket validation.
 * @returns {Readonly<Record<string, string>>} Attribute map.
 */
function parseAttributes(source) {
  return Object.freeze(
    Object.fromEntries(
      [...source.matchAll(/([\w:-]+)="([^"]*)"/gu)].map((match) => [match[1], match[2]]),
    ),
  );
}

/**
 * Computes contour direction from the ordered control-point polygon.
 *
 * @param {readonly {x: number, y: number}[]} points - Ordered points.
 * @returns {-1 | 0 | 1} Counter-clockwise, degenerate, or clockwise sign.
 */
function contourDirection(points) {
  let doubledArea = 0;
  for (const [index, point] of points.entries()) {
    const next = points[(index + 1) % points.length];
    doubledArea += point.x * next.y - next.x * point.y;
  }
  return doubledArea === 0 ? 0 : doubledArea > 0 ? 1 : -1;
}

/**
 * Parses ordered contour points from one GLIF document.
 *
 * @param {string} xml - GLIF source document.
 * @param {string} glyphName - Glyph name used in diagnostics.
 * @returns {readonly (readonly Readonly<{x: number, y: number, type: string}>[])[]} Contours.
 */
function parseContourPoints(xml, glyphName) {
  return [...xml.matchAll(/<contour(?:\s[^>]*)?>([\s\S]*?)<\/contour>/gu)].map(
    (contourMatch, contourIndex) =>
      Object.freeze(
        [...contourMatch[1].matchAll(/<point\s+([^>]*)\/>/gu)].map((pointMatch) => {
          const attributes = parseAttributes(pointMatch[1]);
          const x = Number(attributes.x);
          const y = Number(attributes.y);
          if (!Number.isFinite(x) || !Number.isFinite(y)) {
            throw new Error(`Glyph ${glyphName} contour ${contourIndex} has a non-finite point.`);
          }
          return Object.freeze({
            x,
            y,
            type: attributes.type ?? "offcurve",
          });
        }),
      ),
  );
}

/**
 * Evaluates one quadratic or cubic Bézier point.
 *
 * @param {readonly {x: number, y: number}[]} points - Two endpoints and controls.
 * @param {number} time - Normalized segment time.
 * @returns {Readonly<{x: number, y: number}>} Evaluated point.
 */
function bezierPoint(points, time) {
  let working = points.map(({ x, y }) => ({ x, y }));
  while (working.length > 1) {
    working = working.slice(0, -1).map((point, index) => ({
      x: point.x + (working[index + 1].x - point.x) * time,
      y: point.y + (working[index + 1].y - point.y) * time,
    }));
  }
  return Object.freeze(working[0]);
}

/**
 * Flattens a closed GLIF contour for intersection and area checks.
 *
 * @param {readonly Readonly<{x: number, y: number, type: string}>[]} points - GLIF points.
 * @param {string} glyphName - Glyph name used in diagnostics.
 * @param {number} contourIndex - Contour position.
 * @returns {readonly Readonly<{x: number, y: number}>[]} Flattened polygon.
 */
function flattenContour(points, glyphName, contourIndex) {
  if (points.length === 0) return Object.freeze([]);
  if (points.some(({ type }) => type === "move")) {
    throw new Error(
      `Glyph ${glyphName} contour ${contourIndex} is open; font contours must be closed.`,
    );
  }
  const firstOnCurve = points.findIndex(({ type }) => type !== "offcurve");
  if (firstOnCurve < 0) {
    throw new Error(`Glyph ${glyphName} contour ${contourIndex} has no explicit on-curve point.`);
  }
  const ordered = [...points.slice(firstOnCurve), ...points.slice(0, firstOnCurve)];
  const first = ordered[0];
  const flattened = [{ x: first.x, y: first.y }];
  let current = first;
  let controls = [];
  for (const target of [...ordered.slice(1), first]) {
    if (target.type === "offcurve") {
      controls.push(target);
      continue;
    }
    if (target.type === "line") {
      if (controls.length > 0) {
        throw new Error(
          `Glyph ${glyphName} contour ${contourIndex} has controls before a line point.`,
        );
      }
      flattened.push({ x: target.x, y: target.y });
    } else if (target.type === "curve") {
      if (controls.length !== 2) {
        throw new Error(`Glyph ${glyphName} contour ${contourIndex} has an invalid cubic segment.`);
      }
      for (let step = 1; step <= 12; step += 1) {
        flattened.push(bezierPoint([current, controls[0], controls[1], target], step / 12));
      }
    } else if (target.type === "qcurve") {
      if (controls.length === 0) {
        throw new Error(
          `Glyph ${glyphName} contour ${contourIndex} has a qcurve without controls.`,
        );
      }
      let segmentStart = current;
      for (const [controlIndex, control] of controls.entries()) {
        const nextControl = controls[controlIndex + 1];
        const segmentEnd =
          nextControl === undefined
            ? target
            : {
                x: (control.x + nextControl.x) / 2,
                y: (control.y + nextControl.y) / 2,
              };
        for (let step = 1; step <= 12; step += 1) {
          flattened.push(bezierPoint([segmentStart, control, segmentEnd], step / 12));
        }
        segmentStart = segmentEnd;
      }
    } else {
      throw new Error(
        `Glyph ${glyphName} contour ${contourIndex} uses unsupported point type ${target.type}.`,
      );
    }
    controls = [];
    current = target;
  }
  flattened.pop();
  return Object.freeze(flattened);
}

/**
 * Computes signed polygon area in squared font units.
 *
 * @param {readonly {x: number, y: number}[]} points - Polygon points.
 * @returns {number} Signed area.
 */
function signedArea(points) {
  let doubledArea = 0;
  for (const [index, point] of points.entries()) {
    const next = points[(index + 1) % points.length];
    doubledArea += point.x * next.y - next.x * point.y;
  }
  return doubledArea / 2;
}

/**
 * Computes a three-point orientation with a floating tolerance.
 *
 * @param {{x: number, y: number}} first - First point.
 * @param {{x: number, y: number}} second - Second point.
 * @param {{x: number, y: number}} third - Third point.
 * @returns {-1 | 0 | 1} Orientation sign.
 */
function orientation(first, second, third) {
  const cross =
    (second.x - first.x) * (third.y - first.y) - (second.y - first.y) * (third.x - first.x);
  return Math.abs(cross) < 1e-7 ? 0 : cross > 0 ? 1 : -1;
}

/**
 * Detects a proper interior crossing of two segments.
 *
 * @param {{x: number, y: number}} firstStart - First segment start.
 * @param {{x: number, y: number}} firstEnd - First segment end.
 * @param {{x: number, y: number}} secondStart - Second segment start.
 * @param {{x: number, y: number}} secondEnd - Second segment end.
 * @returns {boolean} Whether segment interiors cross.
 */
function segmentsCross(firstStart, firstEnd, secondStart, secondEnd) {
  const first = orientation(firstStart, firstEnd, secondStart);
  const second = orientation(firstStart, firstEnd, secondEnd);
  const third = orientation(secondStart, secondEnd, firstStart);
  const fourth = orientation(secondStart, secondEnd, firstEnd);
  return first !== 0 && second !== 0 && third !== 0 && fourth !== 0
    ? first !== second && third !== fourth
    : false;
}

/**
 * Detects crossings between non-adjacent segments of one contour.
 *
 * @param {readonly {x: number, y: number}[]} points - Flattened contour.
 * @returns {boolean} Whether the contour self-intersects.
 */
function hasSelfIntersection(points) {
  for (let first = 0; first < points.length; first += 1) {
    const firstNext = (first + 1) % points.length;
    for (let second = first + 1; second < points.length; second += 1) {
      const secondNext = (second + 1) % points.length;
      if (firstNext === second || secondNext === first) continue;
      if (segmentsCross(points[first], points[firstNext], points[second], points[secondNext])) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Returns the interpolation-sensitive topology contract of one GLIF.
 * Numeric point coordinates may differ between masters; point types, contour
 * direction, component bases/transform fields, anchors, guidelines, width and
 * Unicode assignments may not.
 *
 * @param {string} xml - GLIF source document.
 * @param {string} glyphName - Glyph name used in diagnostics.
 * @returns {Readonly<Record<string, unknown>>} Comparable topology signature.
 */
export function glyphTopologySignature(xml, glyphName) {
  if (typeof xml !== "string" || typeof glyphName !== "string") {
    throw new TypeError("Topology validation requires XML and a glyph name.");
  }
  const advanceMatch = xml.match(/<advance\s+([^>]*)\/>/u);
  if (advanceMatch === null) {
    throw new Error(`Glyph ${glyphName} is missing its advance width.`);
  }
  const advance = parseAttributes(advanceMatch[1]);
  const contours = [...xml.matchAll(/<contour(?:\s[^>]*)?>([\s\S]*?)<\/contour>/gu)].map(
    (contourMatch, contourIndex) => {
      const points = [...contourMatch[1].matchAll(/<point\s+([^>]*)\/>/gu)].map((pointMatch) => {
        const attributes = parseAttributes(pointMatch[1]);
        const x = Number(attributes.x);
        const y = Number(attributes.y);
        if (!Number.isFinite(x) || !Number.isFinite(y)) {
          throw new Error(`Glyph ${glyphName} contour ${contourIndex} has a non-finite point.`);
        }
        return Object.freeze({
          type: attributes.type ?? "offcurve",
          x,
          y,
        });
      });
      if (points.some(({ type }) => type === "move")) {
        throw new Error(
          `Glyph ${glyphName} contour ${contourIndex} is open; font contours must be closed.`,
        );
      }
      return Object.freeze({
        pointTypes: points.map(({ type }) => type),
        direction: contourDirection(points),
      });
    },
  );
  const components = [...xml.matchAll(/<component\s+([^>]*)\/>/gu)].map((match) => {
    const attributes = parseAttributes(match[1]);
    if (attributes.base === undefined) {
      throw new Error(`Glyph ${glyphName} has a component without a base.`);
    }
    return Object.freeze({
      base: attributes.base,
      transformFields: Object.keys(attributes)
        .filter((key) => key !== "base" && attributes[key] !== "0")
        .sort(),
    });
  });
  const exactElements = (element) =>
    [...xml.matchAll(new RegExp(`<${element}\\s+([^>]*)\\/>`, "gu"))].map((match) =>
      Object.entries(parseAttributes(match[1])).sort(([left], [right]) =>
        left.localeCompare(right, "en"),
      ),
    );

  return Object.freeze({
    width: advance.width,
    height: advance.height ?? null,
    unicodes: exactElements("unicode"),
    contours,
    components,
    anchors: exactElements("anchor"),
    guidelines: exactElements("guideline"),
  });
}

/**
 * Requires all supplied masters of one glyph to have an identical topology.
 *
 * @param {string} glyphName - Glyph name used in diagnostics.
 * @param {readonly {master: string, xml: string}[]} masterSources - Master GLIF sources.
 * @returns {void}
 */
export function validateGlyphTopology(glyphName, masterSources) {
  if (!Array.isArray(masterSources) || masterSources.length !== 6) {
    throw new Error(`Glyph ${glyphName} requires exactly six master sources.`);
  }
  const [first, ...remaining] = masterSources.map(({ master, xml }) => ({
    master,
    signature: glyphTopologySignature(xml, glyphName),
  }));
  const expected = JSON.stringify(first.signature);
  for (const candidate of remaining) {
    if (JSON.stringify(candidate.signature) !== expected) {
      throw new Error(
        `Glyph ${glyphName} topology differs between ${first.master} and ${candidate.master}.`,
      );
    }
  }
}

/**
 * Validates topology compatibility across every glyph in all six UFO masters.
 *
 * @param {readonly string[]} masterDirectories - Frozen UFO directory names.
 * @param {readonly {glyphName: string}[]} icons - Canonical codepoint rows.
 * @returns {Promise<void>} Promise completed when every topology matches.
 */
export async function validateMasterTopology(masterDirectories, icons) {
  if (masterDirectories.length !== 6) {
    throw new Error("Font topology validation requires exactly six masters.");
  }
  for (const [glyphName, filename] of [
    [".notdef", "_notdef.glif"],
    ...icons.map(({ glyphName }) => [glyphName, `${glyphName}.glif`]),
  ]) {
    const masterSources = await Promise.all(
      masterDirectories.map(async (master) => ({
        master,
        xml: await readFile(resolve(fontsRoot, master, "glyphs", filename), "utf8"),
      })),
    );
    validateGlyphTopology(glyphName, masterSources);
  }
}

/**
 * Validates intermediate geometry for one compatible pair of glyph masters.
 *
 * @param {string} glyphName - Glyph name used in diagnostics.
 * @param {string} startXml - First endpoint GLIF.
 * @param {string} endXml - Second endpoint GLIF.
 * @param {{samples?: readonly number[], allowedDegenerateContours?: readonly number[]}} [options] - Validation policy.
 * @returns {void}
 */
export function validateInterpolatedGlyphGeometry(glyphName, startXml, endXml, options = {}) {
  const startSignature = glyphTopologySignature(startXml, glyphName);
  const endSignature = glyphTopologySignature(endXml, glyphName);
  if (JSON.stringify(startSignature) !== JSON.stringify(endSignature)) {
    throw new Error(
      `Glyph ${glyphName} cannot interpolate because endpoint topology or direction differs.`,
    );
  }
  const startContours = parseContourPoints(startXml, glyphName);
  const endContours = parseContourPoints(endXml, glyphName);
  const samples = options.samples ?? [0.01, 0.25, 0.5, 0.75, 0.99];
  const allowedDegenerates = new Set(options.allowedDegenerateContours ?? []);
  if (allowedDegenerates.size > 2) {
    throw new Error(`Glyph ${glyphName} declares more than two degenerate contours.`);
  }
  for (const sample of samples) {
    if (!Number.isFinite(sample) || sample < 0 || sample > 1) {
      throw new Error(`Glyph ${glyphName} has an invalid interpolation sample.`);
    }
    for (const [contourIndex, startPoints] of startContours.entries()) {
      const endPoints = endContours[contourIndex];
      const interpolated = startPoints.map((point, pointIndex) => ({
        x: point.x + (endPoints[pointIndex].x - point.x) * sample,
        y: point.y + (endPoints[pointIndex].y - point.y) * sample,
        type: point.type,
      }));
      for (const point of interpolated) {
        if (point.x < 0 || point.x > 960 || point.y < -160 || point.y > 800) {
          throw new Error(
            `Glyph ${glyphName} contour ${contourIndex} leaves the 960-unit font bounds at ${sample}.`,
          );
        }
      }
      const flattened = flattenContour(interpolated, glyphName, contourIndex);
      if (hasSelfIntersection(flattened)) {
        throw new Error(`Glyph ${glyphName} contour ${contourIndex} self-intersects at ${sample}.`);
      }
      const area = Math.abs(signedArea(flattened));
      const endpoint = sample === 0 || sample === 1;
      if (area <= 1e-7 && !(endpoint && allowedDegenerates.has(contourIndex))) {
        throw new Error(
          `Glyph ${glyphName} contour ${contourIndex} becomes an invisible fragment at ${sample}.`,
        );
      }
    }
  }
}

/**
 * Validates the FILL interpolation path at each optical-size source.
 *
 * @param {readonly {glyphName: string}[]} icons - Canonical codepoint rows.
 * @param {readonly {name: string, degenerates?: {allowed?: boolean}}[]} briefs - Design briefs.
 * @returns {Promise<void>} Promise completed when all drawn glyphs pass.
 */
export async function validateMasterGeometry(icons, briefs) {
  const briefByName = new Map(briefs.map((brief) => [brief.name, brief]));
  for (const [glyphName, filename, canonicalName] of [
    [".notdef", "_notdef.glif", ".notdef"],
    ...icons.map(({ glyphName }) => [
      glyphName,
      `${glyphName}.glif`,
      glyphName.slice("miaixz.".length),
    ]),
  ]) {
    for (const opticalSize of ["compact", "standard", "display"]) {
      const [outlineXml, filledXml] = await Promise.all(
        ["outline", "filled"].map((fill) =>
          readFile(
            resolve(fontsRoot, `miaixz-icons-${fill}-${opticalSize}.ufo`, "glyphs", filename),
            "utf8",
          ),
        ),
      );
      if (!/<point\s/u.test(outlineXml) && !/<component\s/u.test(outlineXml)) {
        continue;
      }
      const brief = briefByName.get(canonicalName);
      validateInterpolatedGlyphGeometry(glyphName, outlineXml, filledXml, {
        allowedDegenerateContours: brief?.degenerates?.allowed === true ? [0, 1] : [],
      });
    }
  }
}

/**
 * Validates source filenames, required JSON inputs, and Designspace topology.
 *
 * @returns {Promise<void>} Promise completed when every source check passes.
 */
export async function validateFontSource() {
  await generateGlyphs(true);
  const requiredJson = [
    "catalog.json",
    "catalog.schema.json",
    "design-briefs.json",
    "design-briefs.schema.json",
    "release-plan.json",
    "release-plan.schema.json",
    "fonts/codepoints.json",
  ];
  const loadedJson = new Map();
  for (const path of requiredJson) loadedJson.set(path, await readJson(resolve(assetsRoot, path)));
  validateCodepoints(loadedJson.get("release-plan.json"), loadedJson.get("fonts/codepoints.json"));
  validateAutomatedBriefReviews(
    loadedJson.get("release-plan.json"),
    loadedJson.get("design-briefs.json"),
  );
  if (!existsSync(designspacePath)) {
    throw new Error("Missing packages/icons/src/assets/fonts/miaixz-icons.designspace.");
  }
  const entries = (await readdir(fontsRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  if (JSON.stringify(entries) !== JSON.stringify(EXPECTED_MASTER_DIRECTORIES)) {
    throw new Error(
      `UFO directory set mismatch. Expected ${EXPECTED_MASTER_DIRECTORIES.join(", ")}; received ${entries.join(", ")}.`,
    );
  }
  for (const name of entries) {
    if (
      name !== name.toLowerCase() ||
      !/^miaixz-icons-(?:filled|outline)-(?:compact|display|standard)\.ufo$/u.test(name)
    ) {
      throw new Error(`Invalid UFO directory name: ${name}.`);
    }
  }
  await validateMasterTopology(entries, loadedJson.get("fonts/codepoints.json").icons);
  await validateMasterGeometry(
    loadedJson.get("fonts/codepoints.json").icons,
    loadedJson.get("design-briefs.json").briefs,
  );
  await runFontTool("fonttools", ["varLib.interpolatable", designspacePath]);
  await validateNonEmptyMasterGlyphs(entries, loadedJson.get("fonts/codepoints.json").icons);
}

/**
 * Runs the FontBakery universal profile for the complete candidate WOFF2.
 *
 * @param {string} fontDirectory - Candidate font directory.
 * @param {string} reportDirectory - External report destination.
 * @returns {Promise<readonly string[]>} Absolute JSON report paths.
 */
export async function validateFontOutputs(fontDirectory, reportDirectory) {
  await mkdir(reportDirectory, { recursive: true });
  const reports = [];
  for (const filename of expectedFontFiles) {
    const report = resolve(reportDirectory, `${filename.replace(/\.woff2$/u, "")}.fontbakery.json`);
    const validationFont = resolve(fontDirectory, `.${filename.replace(/\.woff2$/u, "")}.ttf`);
    try {
      await runFontTool("fonttools", [
        "ttLib.woff2",
        "decompress",
        resolve(fontDirectory, filename),
        "-o",
        validationFont,
      ]);
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
      await readJson(report);
      reports.push(report);
    } finally {
      await rm(validationFont, { force: true });
    }
  }
  return Object.freeze(reports);
}

const arguments_ = process.argv.slice(2);
if (
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  if (arguments_.length !== 2 || arguments_[0] !== "--mode" || arguments_[1] !== "source") {
    throw new Error("validate.mjs requires exactly --mode source.");
  }
  await validateFontSource();
  console.log("Miaixz icon font sources are valid.");
}

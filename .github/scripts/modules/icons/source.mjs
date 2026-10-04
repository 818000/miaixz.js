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
 * Loads and validates the only supported icon source-asset graph.
 */

import { readFile, readdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const moduleRoot = dirname(fileURLToPath(import.meta.url));
/**
 * Absolute repository root.
 */
export const repositoryRoot = resolve(moduleRoot, "../../../../");
/**
 * Absolute icon-package root.
 */
export const packageRoot = resolve(repositoryRoot, "packages/icons");
/**
 * Absolute canonical icon-asset root.
 */
export const assetsRoot = resolve(packageRoot, "src/assets");
/**
 * Absolute canonical font-source root.
 */
export const fontsRoot = resolve(assetsRoot, "fonts");
/**
 * Absolute icon-manifest path.
 */
export const manifestPath = resolve(assetsRoot, "icons.json");
/**
 * Absolute design-contract path.
 */
export const designPath = resolve(assetsRoot, "design.json");
/**
 * Absolute source-schema path.
 */
export const schemaPath = resolve(assetsRoot, "source.schema.json");
/**
 * Absolute Designspace path.
 */
export const designspacePath = resolve(fontsRoot, "miaixz-icons.designspace");
const packageRequire = createRequire(resolve(packageRoot, "package.json"));
const Ajv2020 = packageRequire("ajv/dist/2020").default;

/**
 * Required number of canonical icons.
 */
export const EXPECTED_ICON_COUNT = 1781;
/**
 * First canonical icon codepoint.
 */
export const FIRST_CODEPOINT = 0xf0000;
/**
 * Last canonical icon codepoint.
 */
export const LAST_CODEPOINT = FIRST_CODEPOINT + EXPECTED_ICON_COUNT - 1;
/**
 * Complete supported UFO master-directory set.
 */
export const EXPECTED_MASTER_DIRECTORIES = Object.freeze([
  "miaixz-icons-filled-compact.ufo",
  "miaixz-icons-filled-display.ufo",
  "miaixz-icons-filled-standard.ufo",
  "miaixz-icons-outline-compact.ufo",
  "miaixz-icons-outline-display.ufo",
  "miaixz-icons-outline-standard.ufo",
]);

/**
 * Compares strings by their UTF-8 byte sequence.
 *
 * @param {string} left Left value.
 * @param {string} right Right value.
 * @returns {number} Negative, zero, or positive comparison result.
 */
function compareUtf8(left, right) {
  return Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));
}

/**
 * Rejects a failed source invariant.
 *
 * @param {unknown} condition Condition to require.
 * @param {string} message Failure message.
 * @returns {asserts condition} Nothing when the condition is satisfied.
 */
function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

/**
 * Reads one JSON document.
 *
 * @param {string} path Absolute document path.
 * @returns {Promise<any>} Parsed JSON value.
 */
async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

/**
 * Requires canonical two-space JSON serialization.
 *
 * @param {string} path Absolute document path.
 * @returns {Promise<void>} Completion promise.
 */
async function requireCanonicalJson(path) {
  const source = await readFile(path, "utf8");
  invariant(
    source === `${JSON.stringify(JSON.parse(source), null, 2)}\n`,
    `${relative(repositoryRoot, path)} is not canonical JSON.`,
  );
}

/**
 * Applies a compiled JSON Schema validator.
 *
 * @param {import("ajv").ValidateFunction} validator Compiled validator.
 * @param {unknown} value Candidate value.
 * @param {string} label Source label for diagnostics.
 * @returns {void}
 */
function validateWith(validator, value, label) {
  if (validator(value)) return;
  const messages = (validator.errors ?? [])
    .map(({ instancePath, message }) => `${label}${instancePath || "/"} ${message ?? "is invalid"}`)
    .join("\n");
  throw new Error(messages);
}

/**
 * Returns the complete ordered shard-path contract.
 *
 * @returns {string[]} Relative shard paths.
 */
function expectedShardPaths() {
  return Array.from({ length: 7 }, (_, index) => {
    const start = FIRST_CODEPOINT + index * 0x100;
    return `icons/${start.toString(16)}-${(start + 0xff).toString(16)}.json`;
  });
}

/**
 * Parses a UFO contents property list.
 *
 * @param {string} source Property-list source.
 * @param {string} label Source label for diagnostics.
 * @returns {Map<string, string>} Glyph-to-file mappings.
 */
function parseContents(source, label) {
  const entries = [...source.matchAll(/<key>([^<]+)<\/key>\s*<string>([^<]+)<\/string>/gu)].map(
    (match) => [match[1], match[2]],
  );
  invariant(entries.length > 0, `${label} does not contain glyph mappings.`);
  return new Map(entries);
}

/**
 * Parses public.glyphOrder from a UFO library property list.
 *
 * @param {string} source Property-list source.
 * @param {string} label Source label for diagnostics.
 * @returns {string[]} Ordered glyph names.
 */
function parseGlyphOrder(source, label) {
  const match = source.match(/<key>public\.glyphOrder<\/key>\s*<array>([\s\S]*?)<\/array>/u);
  invariant(match !== null, `${label} has no public.glyphOrder.`);
  return [...match[1].matchAll(/<string>([^<]+)<\/string>/gu)].map((entry) => entry[1]);
}

/**
 * Normalizes a GLIF outline to a coordinate-independent topology signature.
 *
 * @param {string} source GLIF source.
 * @returns {string} Normalized topology signature.
 */
function topologySignature(source) {
  const outline = source.match(/<outline>([\s\S]*?)<\/outline>/u)?.[1] ?? "";
  return outline
    .replace(/\s(?:x|y|xScale|xyScale|yxScale|yScale|xOffset|yOffset)="[^"]*"/gu, "")
    .replace(/\s+/gu, " ")
    .trim();
}

/**
 * Validates every Designspace and UFO source invariant.
 *
 * @param {readonly any[]} icons Canonical icon records.
 * @param {any} design Canonical design contract.
 * @returns {Promise<void>} Completion promise.
 */
async function validateUfoSources(icons, design) {
  invariant(
    design.grid.conceptUnits * design.grid.fontUnitsPerConceptUnit === 960,
    "design.json grid must resolve to the UFO 960 units-per-em.",
  );
  const designspace = await readFile(designspacePath, "utf8");
  const sourceFiles = [...designspace.matchAll(/<source filename="([^"]+)"/gu)]
    .map((match) => match[1])
    .sort();
  invariant(
    JSON.stringify(sourceFiles) === JSON.stringify([...EXPECTED_MASTER_DIRECTORIES].sort()),
    "Designspace must reference exactly the six supported UFO masters.",
  );
  invariant(
    /<axis tag="FILL"[^>]*minimum="0"[^>]*maximum="1"[^>]*default="0"/u.test(designspace),
    "Designspace FILL axis contract is invalid.",
  );
  invariant(
    /<axis tag="opsz"[^>]*minimum="12"[^>]*maximum="40"[^>]*default="24"/u.test(designspace),
    "Designspace opsz axis contract is invalid.",
  );

  const expectedGlyphs = [".notdef", ...icons.map(({ name }) => `miaixz.${name}`)];
  const topologyByName = new Map();
  for (const master of EXPECTED_MASTER_DIRECTORIES) {
    const root = resolve(fontsRoot, master);
    const glyphRoot = resolve(root, "glyphs");
    const contents = parseContents(
      await readFile(resolve(glyphRoot, "contents.plist"), "utf8"),
      `${master}/contents.plist`,
    );
    invariant(
      contents.size === EXPECTED_ICON_COUNT + 1,
      `${master} must contain ${EXPECTED_ICON_COUNT} icons and .notdef.`,
    );
    invariant(
      JSON.stringify([...contents.keys()]) === JSON.stringify(expectedGlyphs),
      `${master} contents.plist must follow codepoint order.`,
    );
    const order = parseGlyphOrder(
      await readFile(resolve(root, "lib.plist"), "utf8"),
      `${master}/lib.plist`,
    );
    invariant(
      JSON.stringify(order) === JSON.stringify(expectedGlyphs),
      `${master} public.glyphOrder is invalid.`,
    );
    const fontInfo = await readFile(resolve(root, "fontinfo.plist"), "utf8");
    invariant(
      /<key>unitsPerEm<\/key>\s*<integer>960<\/integer>/u.test(fontInfo),
      `${master} unitsPerEm must be 960.`,
    );
    invariant(
      !/<key>(?:openTypeNameVersion|openTypeNameUniqueID|versionMajor|versionMinor)<\/key>/u.test(
        fontInfo,
      ),
      `${master} contains a project release version.`,
    );
    const glifFiles = (await readdir(glyphRoot)).filter((name) => name.endsWith(".glif"));
    invariant(glifFiles.length === EXPECTED_ICON_COUNT + 1, `${master} GLIF count is invalid.`);
    for (const icon of icons) {
      const glyph = `miaixz.${icon.name}`;
      const filename = contents.get(glyph);
      invariant(filename !== undefined, `${master} is missing ${glyph}.`);
      const source = await readFile(resolve(glyphRoot, filename), "utf8");
      const expectedUnicode = icon.codepoint.toString(16).toUpperCase().padStart(6, "0");
      invariant(
        source.includes(`<glyph name="${glyph}" format="2">`),
        `${master}/${filename} glyph name is invalid.`,
      );
      invariant(
        source.includes(`<unicode hex="${expectedUnicode}"/>`),
        `${master}/${filename} Unicode is invalid.`,
      );
      const topology = topologySignature(source);
      const previous = topologyByName.get(icon.name);
      if (previous === undefined) topologyByName.set(icon.name, topology);
      else invariant(previous === topology, `${icon.name} topology differs across masters.`);
      const points = [...source.matchAll(/<point\b[^>]*\bx="([^"]+)"[^>]*\by="([^"]+)"/gu)].map(
        (match) => [Number(match[1]), Number(match[2])],
      );
      invariant(points.length > 0, `${master}/${filename} has no outline points.`);
      const xs = points.map(([x]) => x);
      const ys = points.map(([, y]) => y);
      const bounds = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
      const [safeLeft, safeBottom, safeRight, safeTop] = design.grid.safeBounds;
      invariant(
        bounds[0] >= safeLeft &&
          bounds[1] >= safeBottom &&
          bounds[2] <= safeRight &&
          bounds[3] <= safeTop,
        `${master}/${filename} exceeds safe bounds.`,
      );
      const opticalRule = design.opticalClasses[icon.opticalClass];
      const longestEdge = Math.max(bounds[2] - bounds[0], bounds[3] - bounds[1]);
      invariant(
        longestEdge >= opticalRule.longestEdge[0] - 2 &&
          longestEdge <= opticalRule.longestEdge[1] + 2,
        `${master}/${filename} violates ${icon.opticalClass} edge limits.`,
      );
      const centerDelta = Math.hypot(
        (bounds[0] + bounds[2]) / 2 - design.grid.opticalCenter[0],
        (bounds[1] + bounds[3]) / 2 - design.grid.opticalCenter[1],
      );
      invariant(
        centerDelta <= opticalRule.centerTolerance,
        `${master}/${filename} violates ${icon.opticalClass} optical centering.`,
      );
    }
  }
}

/**
 * Loads and validates manifest, design, shards, and optionally all UFO sources.
 *
 * @param {{validateUfo?: boolean}} [options] Validation options.
 * @returns {Promise<Readonly<{manifest: any, design: any, icons: readonly any[], categories: readonly string[], shardPaths: readonly string[]}>>} Validated source graph.
 */
export async function loadIconSource({ validateUfo = false } = {}) {
  const [schema, manifest, design] = await Promise.all([
    readJson(schemaPath),
    readJson(manifestPath),
    readJson(designPath),
  ]);
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  ajv.addSchema(schema);
  const manifestValidator = ajv.getSchema(`${schema.$id}#/$defs/manifest`);
  const designValidator = ajv.getSchema(`${schema.$id}#/$defs/design`);
  const shardValidator = ajv.getSchema(`${schema.$id}#/$defs/shard`);
  invariant(
    manifestValidator !== undefined &&
      designValidator !== undefined &&
      shardValidator !== undefined,
    "Icon source schema definitions could not be compiled.",
  );
  validateWith(manifestValidator, manifest, "icons.json");
  validateWith(designValidator, design, "design.json");
  await Promise.all([
    requireCanonicalJson(schemaPath),
    requireCanonicalJson(manifestPath),
    requireCanonicalJson(designPath),
  ]);

  const categoryIds = manifest.categories.map(({ id }) => id);
  invariant(new Set(categoryIds).size === categoryIds.length, "Category ids must be unique.");
  invariant(
    JSON.stringify(categoryIds) === JSON.stringify([...categoryIds].sort(compareUtf8)),
    "Categories must use Unicode codepoint order.",
  );
  const shards = expectedShardPaths();
  invariant(
    JSON.stringify(manifest.shards) === JSON.stringify(shards),
    "Manifest shard list is invalid.",
  );
  const icons = [];
  for (const [shardIndex, shard] of shards.entries()) {
    const path = resolve(assetsRoot, shard);
    const value = await readJson(path);
    validateWith(shardValidator, value, shard);
    await requireCanonicalJson(path);
    const start = FIRST_CODEPOINT + shardIndex * 0x100;
    const end = start + 0xff;
    for (const icon of value.icons) {
      invariant(
        icon.codepoint >= start && icon.codepoint <= end,
        `${icon.name} is outside ${shard}.`,
      );
      icons.push(Object.freeze(icon));
    }
  }
  invariant(
    icons.length === EXPECTED_ICON_COUNT,
    `Expected ${EXPECTED_ICON_COUNT} icons, received ${icons.length}.`,
  );
  invariant(
    new Set(icons.map(({ name }) => name)).size === icons.length,
    "Icon names must be unique.",
  );
  invariant(
    new Set(icons.map(({ codepoint }) => codepoint)).size === icons.length,
    "Icon codepoints must be unique.",
  );
  for (const [index, icon] of icons.entries()) {
    invariant(
      icon.codepoint === FIRST_CODEPOINT + index,
      `${icon.name} breaks the continuous codepoint range.`,
    );
    invariant(categoryIds.includes(icon.category), `${icon.name} references an unknown category.`);
    invariant(
      Object.hasOwn(design.opticalClasses, icon.opticalClass),
      `${icon.name} references an unknown optical class.`,
    );
    if (index > 0)
      invariant(
        compareUtf8(icons[index - 1].name, icon.name) < 0,
        `${icon.name} is not in initial canonical-name order.`,
      );
  }
  for (const id of categoryIds)
    invariant(
      icons.some(({ category }) => category === id),
      `Category ${id} is empty.`,
    );
  if (validateUfo) await validateUfoSources(icons, design);
  return Object.freeze({
    manifest: Object.freeze(manifest),
    design: Object.freeze(design),
    icons: Object.freeze(icons),
    categories: Object.freeze(categoryIds),
    shardPaths: Object.freeze(shards),
  });
}

/**
 * Derives the CSS Unicode range for an ordered icon set.
 *
 * @param {readonly {codepoint: number}[]} icons Ordered icon records.
 * @returns {string} CSS Unicode range.
 */
export function unicodeRangeFor(icons) {
  invariant(icons.length > 0, "Cannot derive a Unicode range from an empty icon set.");
  const first = icons[0].codepoint.toString(16).toUpperCase();
  const last = icons.at(-1).codepoint.toString(16).toUpperCase();
  return `U+${first}-${last}`;
}

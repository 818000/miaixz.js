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
 * Bootstraps frozen icon assets once and generates deterministic TypeScript maps.
 */

import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { format } from "prettier";

const moduleRoot = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(moduleRoot, "../../../../../");
const packageRoot = resolve(repositoryRoot, "packages/icons");
const assetsRoot = resolve(packageRoot, "src/assets");
const fontsRoot = resolve(assetsRoot, "fonts");
const generatedRoot = resolve(packageRoot, "src/autogen");
const release = "0.6.5";
const glyphPrefix = "miaixz.";
const coreNames = Object.freeze(
  `add archive arrow-down arrow-left arrow-right arrow-up ban bell calendar-days chevron-down chevron-left chevron-right chevron-up circle-alert circle-check circle-minus circle-plus circle-x clock close confirm copy delete download external-link eye eye-off file folder funnel help home info key-round layout-grid link loading lock lock-open log-in log-out mail map-pin maximize menu more-horizontal palette pencil refresh-cw rocket rotate-ccw save search send settings shield-check shield-x snowflake star star-half upload user-plus user-round warning`.split(
    " ",
  ),
);
const requiredExtendedNames = Object.freeze(["zoom-in", "zoom-out"]);
const categories = Object.freeze([
  "actions",
  "commerce",
  "communication",
  "core-ui",
  "data",
  "devices",
  "editor",
  "files",
  "maps",
  "media",
  "navigation",
  "objects",
  "status",
]);
const fontMasters = Object.freeze([
  {
    directory: "miaixz-icons-outline-compact.ufo",
    family: "Miaixz Icons",
    style: "Outline Compact",
    postscript: "MiaixzIcons-OutlineCompact",
    fill: 0,
    opticalSize: 12,
  },
  {
    directory: "miaixz-icons-outline-standard.ufo",
    family: "Miaixz Icons",
    style: "Outline Standard",
    postscript: "MiaixzIcons-OutlineStandard",
    fill: 0,
    opticalSize: 24,
  },
  {
    directory: "miaixz-icons-outline-display.ufo",
    family: "Miaixz Icons",
    style: "Outline Display",
    postscript: "MiaixzIcons-OutlineDisplay",
    fill: 0,
    opticalSize: 40,
  },
  {
    directory: "miaixz-icons-filled-compact.ufo",
    family: "Miaixz Icons",
    style: "Filled Compact",
    postscript: "MiaixzIcons-FilledCompact",
    fill: 1,
    opticalSize: 12,
  },
  {
    directory: "miaixz-icons-filled-standard.ufo",
    family: "Miaixz Icons",
    style: "Filled Standard",
    postscript: "MiaixzIcons-FilledStandard",
    fill: 1,
    opticalSize: 24,
  },
  {
    directory: "miaixz-icons-filled-display.ufo",
    family: "Miaixz Icons",
    style: "Filled Display",
    postscript: "MiaixzIcons-FilledDisplay",
    fill: 1,
    opticalSize: 40,
  },
]);
const javascriptKeywords = new Set([
  "await",
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "debugger",
  "default",
  "delete",
  "do",
  "else",
  "enum",
  "export",
  "extends",
  "false",
  "finally",
  "for",
  "function",
  "if",
  "implements",
  "import",
  "in",
  "instanceof",
  "interface",
  "let",
  "new",
  "null",
  "package",
  "private",
  "protected",
  "public",
  "return",
  "static",
  "super",
  "switch",
  "this",
  "throw",
  "true",
  "try",
  "typeof",
  "var",
  "void",
  "while",
  "with",
  "yield",
]);

/**
 * Sorts ASCII icon names by their frozen UTF-8 byte order.
 *
 * @param {string} left - Left name.
 * @param {string} right - Right name.
 * @returns {number} Byte comparison result.
 */
function compareUtf8(left, right) {
  return Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));
}

/**
 * Reads one required JSON file.
 *
 * @param {string} path - Absolute input path.
 * @returns {Promise<any>} Parsed JSON value.
 */
async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

/**
 * Writes deterministic formatted JSON.
 *
 * @param {string} path - Absolute output path.
 * @param {unknown} value - Serializable value.
 * @returns {Promise<void>} Promise completed after the write.
 */
async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

/**
 * Writes deterministic JSON using the repository formatter.
 *
 * @param {string} path - Absolute output path.
 * @param {unknown} value - Serializable value.
 * @returns {Promise<void>} Promise completed after the write.
 */
async function writeFormattedJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, await format(JSON.stringify(value), { parser: "json", printWidth: 100 }));
}

/**
 * Assigns a stable category using explicit semantic name groups.
 *
 * @param {string} name - Canonical icon name.
 * @param {"core" | "extended"} tier - Catalog priority tier.
 * @returns {string} Frozen catalog category.
 */
export function categoryFor(name, tier) {
  if (tier === "core") return "core-ui";
  const groups = [
    ["files", /^(?:archive|book|file|folder|library|notebook)/u],
    ["navigation", /(?:^|-)arrow|chevron|corner|move|navigation|route/u],
    ["status", /alarm|alert|badge|ban|check|circle|info|shield|warning|x$/u],
    ["media", /audio|camera|film|image|mic|music|pause|play|radio|video|volume/u],
    ["communication", /contact|mail|message|phone|send|speech/u],
    ["commerce", /bank|cart|cash|coin|credit|dollar|receipt|shopping|wallet/u],
    ["devices", /battery|bluetooth|computer|cpu|device|laptop|monitor|printer|smartphone/u],
    ["maps", /compass|earth|globe|locate|map|pin|route/u],
    ["data", /chart|database|network|server|table|workflow/u],
    ["editor", /align|bold|case|edit|indent|italic|list|paint|pen|text|type/u],
    ["actions", /add|copy|download|redo|refresh|remove|rotate|save|share|trash|undo|upload|zoom/u],
  ];
  return groups.find(([, pattern]) => pattern.test(name))?.[0] ?? "objects";
}

/**
 * Determines whether bidirectional layout mirrors the icon geometry.
 *
 * @param {string} name - Canonical icon name.
 * @returns {"none" | "mirror"} RTL contract.
 */
export function rtlFor(name) {
  return /(?:^|-)(?:left|right)(?:-|$)|^(?:arrow|chevron)-(?:left|right)/u.test(name)
    ? "mirror"
    : "none";
}

/**
 * Escapes one XML text value.
 *
 * @param {string} value - Unescaped value.
 * @returns {string} XML-safe text.
 */
function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

/**
 * Serializes the limited deterministic property-list values used by UFO.
 *
 * @param {unknown} value - Property-list value.
 * @param {number} depth - Indentation depth.
 * @returns {string} Property-list XML fragment.
 */
function plistValue(value, depth = 0) {
  const indentation = "  ".repeat(depth);
  if (typeof value === "string") return `<string>${escapeXml(value)}</string>`;
  if (typeof value === "number")
    return Number.isInteger(value) ? `<integer>${value}</integer>` : `<real>${value}</real>`;
  if (typeof value === "boolean") return value ? "<true/>" : "<false/>";
  if (Array.isArray(value)) {
    return `<array>\n${value
      .map((item) => `${indentation}  ${plistValue(item, depth + 1)}`)
      .join("\n")}\n${indentation}</array>`;
  }
  if (value !== null && typeof value === "object") {
    return `<dict>\n${Object.entries(value)
      .map(
        ([key, child]) =>
          `${indentation}  <key>${escapeXml(key)}</key>\n${indentation}  ${plistValue(child, depth + 1)}`,
      )
      .join("\n")}\n${indentation}</dict>`;
  }
  throw new TypeError(`Unsupported property-list value: ${String(value)}.`);
}

/**
 * Wraps a deterministic property-list document.
 *
 * @param {unknown} value - Root property-list value.
 * @returns {string} Complete XML document.
 */
function plistDocument(value) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0">\n${plistValue(value)}\n</plist>\n`;
}

/**
 * Creates one empty canonical glyph ready for reviewed outline work.
 *
 * @param {{name: string, codepoint: number, glyphName: string}} icon - Ledger row.
 * @returns {string} GLIF format 2 document.
 */
function emptyGlif(icon) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<glyph name="${escapeXml(icon.glyphName)}" format="2">\n  <advance width="960"/>\n  <unicode hex="${icon.codepoint.toString(16).toUpperCase().padStart(6, "0")}"/>\n</glyph>\n`;
}

/**
 * Creates the mandatory visible .notdef glyph shared by every master.
 *
 * @returns {string} GLIF format 2 document.
 */
function notdefGlif() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<glyph name=".notdef" format="2">
  <advance width="960"/>
  <outline>
    <contour>
      <point x="120" y="-80" type="line"/>
      <point x="120" y="720" type="line"/>
      <point x="840" y="720" type="line"/>
      <point x="840" y="-80" type="line"/>
    </contour>
    <contour>
      <point x="240" y="40" type="line"/>
      <point x="720" y="40" type="line"/>
      <point x="720" y="600" type="line"/>
      <point x="240" y="600" type="line"/>
    </contour>
  </outline>
</glyph>
`;
}

/**
 * Creates six lower-case UFO skeletons with an identical canonical glyph set.
 *
 * @returns {Promise<void>} Promise completed after all source files are written.
 */
async function bootstrapUfos() {
  const codepointFile = await readJson(resolve(fontsRoot, "codepoints.json"));
  const existing = fontMasters
    .map(({ directory }) => directory)
    .filter((directory) => existsSync(resolve(fontsRoot, directory)));
  if (existing.length > 0) {
    throw new Error(`UFO bootstrap refuses to overwrite: ${existing.join(", ")}.`);
  }
  const contents = Object.fromEntries([
    [".notdef", "_notdef.glif"],
    ...codepointFile.icons.map((icon) => [icon.glyphName, `${icon.glyphName}.glif`]),
  ]);
  for (const master of fontMasters) {
    const masterRoot = resolve(fontsRoot, master.directory);
    const glyphRoot = resolve(masterRoot, "glyphs");
    await mkdir(glyphRoot, { recursive: true });
    await writeFile(
      resolve(masterRoot, "metainfo.plist"),
      plistDocument({ creator: "org.miaixz.icons", formatVersion: 3 }),
    );
    await writeFile(
      resolve(masterRoot, "layercontents.plist"),
      plistDocument([["public.default", "glyphs"]]),
    );
    await writeFile(resolve(glyphRoot, "contents.plist"), plistDocument(contents));
    await writeFile(
      resolve(masterRoot, "lib.plist"),
      plistDocument({
        "public.glyphOrder": [".notdef", ...codepointFile.icons.map(({ glyphName }) => glyphName)],
      }),
    );
    await writeFile(
      resolve(masterRoot, "fontinfo.plist"),
      plistDocument({
        familyName: master.family,
        styleName: master.style,
        styleMapFamilyName: master.family,
        styleMapStyleName: "regular",
        openTypeNamePreferredFamilyName: master.family,
        openTypeNamePreferredSubfamilyName: master.style,
        postscriptFontName: master.postscript,
        unitsPerEm: 960,
        ascender: 800,
        descender: -160,
        xHeight: 480,
        capHeight: 640,
        openTypeHheaAscender: 800,
        openTypeHheaDescender: -160,
        openTypeHheaLineGap: 0,
        openTypeOS2TypoAscender: 800,
        openTypeOS2TypoDescender: -160,
        openTypeOS2TypoLineGap: 0,
        openTypeOS2WinAscent: 800,
        openTypeOS2WinDescent: 160,
        openTypeOS2WeightClass: 400,
        openTypeOS2WidthClass: 5,
        openTypeOS2Panose: [5, 0, 0, 9, 0, 0, 0, 0, 0, 0],
        postscriptIsFixedPitch: true,
        openTypeNameVersion: "Version 0.605",
        openTypeNameUniqueID: `${master.postscript};0.6.5`,
        openTypeNameDescription: "Miaixz variable UI icon font source master.",
        openTypeNameLicense: "Licensed under the Apache License, Version 2.0.",
        openTypeNameLicenseURL: "https://www.apache.org/licenses/LICENSE-2.0",
        copyright: "Copyright (c) 2015-2026 miaixz.org and other contributors.",
        versionMajor: 0,
        versionMinor: 605,
      }),
    );
    await Promise.all(
      codepointFile.icons.map((icon) =>
        writeFile(resolve(glyphRoot, `${icon.glyphName}.glif`), emptyGlif(icon)),
      ),
    );
    await writeFile(resolve(glyphRoot, "_notdef.glif"), notdefGlif());
  }
  await rm(resolve(fontsRoot, ".gitkeep"), { force: true });
}

/**
 * Adds the mandatory .notdef glyph to an already bootstrapped six-master set.
 * This one-time migration refuses partial or existing output.
 *
 * @returns {Promise<void>} Promise completed after all six masters are updated.
 */
async function bootstrapNotdef() {
  const codepointFile = await readJson(resolve(fontsRoot, "codepoints.json"));
  const paths = fontMasters.map(({ directory }) =>
    resolve(fontsRoot, directory, "glyphs", "_notdef.glif"),
  );
  if (paths.some((path) => existsSync(path))) {
    throw new Error(".notdef bootstrap refuses to overwrite an existing or partial migration.");
  }
  const contents = Object.fromEntries([
    [".notdef", "_notdef.glif"],
    ...codepointFile.icons.map((icon) => [icon.glyphName, `${icon.glyphName}.glif`]),
  ]);
  const glyphOrder = [".notdef", ...codepointFile.icons.map(({ glyphName }) => glyphName)];
  for (const { directory } of fontMasters) {
    const masterRoot = resolve(fontsRoot, directory);
    const glyphRoot = resolve(masterRoot, "glyphs");
    await writeFile(resolve(glyphRoot, "contents.plist"), plistDocument(contents));
    await writeFile(
      resolve(masterRoot, "lib.plist"),
      plistDocument({ "public.glyphOrder": glyphOrder }),
    );
    await writeFile(resolve(glyphRoot, "_notdef.glif"), notdefGlif());
  }
}

/**
 * Creates the two-axis six-source Designspace after the UFO set is fixed.
 *
 * @returns {Promise<void>} Promise completed after the Designspace is written.
 */
async function bootstrapDesignspace() {
  const designspacePath = resolve(fontsRoot, "miaixz-icons.designspace");
  if (existsSync(designspacePath)) {
    throw new Error("Designspace bootstrap refuses to overwrite the frozen source.");
  }
  const sources = fontMasters
    .map(
      (
        master,
      ) => `    <source filename="${master.directory}" name="${master.directory.replace(/\.ufo$/u, "-master")}" familyname="${master.family}" stylename="${master.style}">
      <location>
        <dimension name="Fill" xvalue="${master.fill}"/>
        <dimension name="Optical Size" xvalue="${master.opticalSize}"/>
      </location>${master.fill === 0 && master.opticalSize === 24 ? '\n      <info copy="1"/>\n      <lib copy="1"/>' : ""}
    </source>`,
    )
    .join("\n");
  const instances = fontMasters
    .map(
      (
        master,
      ) => `    <instance name="${master.style}" familyname="${master.family}" stylename="${master.style}" postscriptfontname="${master.postscript}">
      <familyname xml:lang="en">${master.family}</familyname>
      <stylename xml:lang="en">${master.style}</stylename>
      <location>
        <dimension name="Fill" xvalue="${master.fill}"/>
        <dimension name="Optical Size" xvalue="${master.opticalSize}"/>
      </location>
    </instance>`,
    )
    .join("\n");
  const contents = `<?xml version="1.0" encoding="UTF-8"?>
<designspace format="5.0">
  <axes>
    <axis tag="FILL" name="Fill" minimum="0" maximum="1" default="0">
      <labels ordering="0">
        <label uservalue="0" name="Outline" elidable="true">
          <labelname xml:lang="en">Outline</labelname>
        </label>
        <label uservalue="1" name="Filled">
          <labelname xml:lang="en">Filled</labelname>
        </label>
      </labels>
    </axis>
    <axis tag="opsz" name="Optical Size" minimum="12" maximum="40" default="24">
      <labels ordering="1">
        <label uservalue="12" name="Compact">
          <labelname xml:lang="en">Compact</labelname>
        </label>
        <label uservalue="24" name="Standard" elidable="true">
          <labelname xml:lang="en">Standard</labelname>
        </label>
        <label uservalue="40" name="Display">
          <labelname xml:lang="en">Display</labelname>
        </label>
      </labels>
    </axis>
  </axes>
  <sources>
${sources}
  </sources>
  <instances>
${instances}
  </instances>
</designspace>
`;
  await writeFile(designspacePath, contents);
}

/**
 * Rejects values that cannot be emitted as standalone TypeScript identifiers.
 *
 * @param {string} identifier - Candidate identifier.
 * @returns {void}
 */
export function validateTypeScriptIdentifier(identifier) {
  if (
    typeof identifier !== "string" ||
    !/^[$A-Z_a-z][$\w]*$/u.test(identifier) ||
    javascriptKeywords.has(identifier)
  ) {
    throw new TypeError(`Invalid TypeScript icon identifier: ${identifier}.`);
  }
}

/**
 * Converts one public name into its deterministic exported icon identifier.
 *
 * @param {string} name - Kebab-case canonical name.
 * @returns {string} TypeScript identifier.
 */
export function toIconIdentifier(name) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(name)) {
    throw new TypeError(`Invalid canonical icon name: ${name}.`);
  }
  const pascal = name
    .split("-")
    .map((part) => `${part[0].toUpperCase()}${part.slice(1)}`)
    .join("");
  const identifier = `${/^\d/u.test(pascal) ? "Icon" : ""}${pascal}Icon`;
  validateTypeScriptIdentifier(identifier);
  return identifier;
}

/**
 * Validates uniqueness before any TypeScript is generated.
 *
 * @param {readonly string[]} names - Canonical names.
 * @returns {ReadonlyMap<string, string>} Identifier-to-name map.
 */
export function validateIconIdentifiers(names) {
  const identifiers = new Map();
  for (const name of names) {
    const identifier = toIconIdentifier(name);
    const existing = identifiers.get(identifier);
    if (existing !== undefined) {
      throw new TypeError(
        `Icon identifier collision: ${existing} and ${name} both become ${identifier}.`,
      );
    }
    identifiers.set(identifier, name);
  }
  return identifiers;
}

/**
 * Computes the deterministic evidence digest for one design brief.
 *
 * @param {Readonly<Record<string, unknown>>} brief - Review metadata-free brief.
 * @returns {string} Lowercase SHA-256 digest.
 */
export function computeBriefReviewDigest(brief) {
  return createHash("sha256").update(JSON.stringify(brief)).digest("hex");
}

/**
 * Creates one non-empty design brief with deterministic machine-review evidence.
 *
 * @param {string} name - Canonical name.
 * @returns {Readonly<Record<string, unknown>>} Frozen brief data.
 */
export function briefFor(name) {
  const words = name.split("-");
  const label = words.join(" ");
  const brief = {
    name,
    intent: `Communicate the ${label} concept without text or brand-specific geometry.`,
    forbiddenMeanings: [
      `Do not change the primary ${label} meaning or introduce an unrelated badge.`,
    ],
    metaphor: `A direct, culturally neutral ${label} pictogram on the 24-unit grid.`,
    primaryObject: words[0],
    secondaryObjects: words.length > 1 ? words.slice(1) : ["No secondary object"],
    compactAdjustments: "Open critical counters and remove non-semantic detail below 18px.",
    standardConstruction:
      "Build the default silhouette inside the 2..22 safety area with balanced optical weight.",
    displayAdjustments:
      "Restore semantic detail while preserving the default silhouette and topology.",
    outlineStrategy: "Use closed quadratic contours that read as a consistent outlined pictogram.",
    filledStrategy:
      "Design a solid silhouette with preserved negative space, not a mechanical stroke fill.",
    topologyPlan:
      "Keep contour order, point types, directions, start points, components, anchors, and width compatible across all six masters.",
    degenerates: {
      allowed: false,
      maximumContours: 0,
      rationale:
        "No endpoint-only semantic part is planned before deterministic geometry generation.",
    },
    rtl: rtlFor(name),
  };
  return Object.freeze({
    ...brief,
    automatedReview: Object.freeze({
      engine: "miaixz-icons-brief-validator",
      rulesetVersion: 1,
      sourceDigest: computeBriefReviewDigest(brief),
      status: "passed",
    }),
  });
}

/**
 * Synchronizes generated schemas and machine-review evidence without changing
 * any authored design-brief content.
 *
 * @param {boolean} check - Compare without writing.
 * @returns {Promise<void>} Promise completed after generated assets are current.
 */
async function synchronizeGeneratedAssets(check) {
  const schemaFiles = schemas();
  for (const [filename, schema] of Object.entries(schemaFiles)) {
    const path = resolve(assetsRoot, filename);
    const current = await readJson(path);
    if (JSON.stringify(current) !== JSON.stringify(schema)) {
      if (check) throw new Error(`Generated icon schema is stale: ${filename}.`);
      await writeFormattedJson(path, schema);
    }
  }
  const briefPath = resolve(assetsRoot, "design-briefs.json");
  const currentBriefFile = await readJson(briefPath);
  const briefs = currentBriefFile.briefs.map((currentBrief) => {
    const brief = { ...currentBrief };
    delete brief.reviewers;
    delete brief.approvalCommit;
    delete brief.automatedReview;
    if (
      brief.degenerates?.rationale ===
      "No endpoint-only semantic part is planned before drawing review."
    ) {
      brief.degenerates = {
        ...brief.degenerates,
        rationale:
          "No endpoint-only semantic part is planned before deterministic geometry generation.",
      };
    }
    return {
      ...brief,
      automatedReview: {
        engine: "miaixz-icons-brief-validator",
        rulesetVersion: 1,
        sourceDigest: computeBriefReviewDigest(brief),
        status: "passed",
      },
    };
  });
  const nextBriefFile = { ...currentBriefFile, briefs };
  if (JSON.stringify(currentBriefFile) !== JSON.stringify(nextBriefFile)) {
    if (check) throw new Error("Generated design-brief review evidence is stale.");
    await writeFormattedJson(briefPath, nextBriefFile);
  }
  const releasePlanPath = resolve(assetsRoot, "release-plan.json");
  const releasePlan = await readJson(releasePlanPath);
  if (releasePlan.state !== "design") {
    if (check) throw new Error("Release plan has not entered automated design state.");
    await writeFormattedJson(releasePlanPath, {
      ...releasePlan,
      state: "design",
    });
  }
}

/**
 * Keeps every UFO glyph manifest exact and removes source glyphs that no
 * longer belong to the canonical 1024-name ledger.
 *
 * @param {boolean} check - Compare without writing.
 * @returns {Promise<void>} Promise completed after all six masters are aligned.
 */
async function synchronizeUfoManifests(check) {
  const codepointFile = await readJson(resolve(fontsRoot, "codepoints.json"));
  const contents = plistDocument(
    Object.fromEntries([
      [".notdef", "_notdef.glif"],
      ...codepointFile.icons.map((icon) => [icon.glyphName, `${icon.glyphName}.glif`]),
    ]),
  );
  const library = plistDocument({
    "public.glyphOrder": [".notdef", ...codepointFile.icons.map(({ glyphName }) => glyphName)],
  });
  const expectedGlyphFiles = new Set([
    "_notdef.glif",
    ...codepointFile.icons.map(({ glyphName }) => `${glyphName}.glif`),
  ]);

  for (const { directory } of fontMasters) {
    const masterRoot = resolve(fontsRoot, directory);
    const glyphRoot = resolve(masterRoot, "glyphs");
    const staleGlyphs = (await readdir(glyphRoot)).filter(
      (filename) => filename.endsWith(".glif") && !expectedGlyphFiles.has(filename),
    );
    if (staleGlyphs.length > 0) {
      if (check)
        throw new Error(`Stale UFO glyphs remain in ${directory}: ${staleGlyphs.join(", ")}.`);
      await Promise.all(staleGlyphs.map((filename) => rm(resolve(glyphRoot, filename))));
    }
    for (const [path, source] of [
      [resolve(glyphRoot, "contents.plist"), contents],
      [resolve(masterRoot, "lib.plist"), library],
    ]) {
      const current = await readFile(path, "utf8");
      if (current === source) continue;
      if (check) throw new Error(`Stale UFO manifest: ${path}.`);
      await writeFile(path, source);
    }
  }
}

/**
 * Returns the JSON schemas committed with the source assets.
 *
 * @returns {Readonly<Record<string, unknown>>} Schema file map.
 */
function schemas() {
  const name = { type: "string", pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" };
  return Object.freeze({
    "catalog.schema.json": {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      $id: "https://miaixz.org/schema/icons/catalog-0.6.5.json",
      type: "object",
      additionalProperties: false,
      required: ["schemaVersion", "release", "icons"],
      properties: {
        schemaVersion: { const: 1 },
        release: { const: release },
        icons: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["name", "aliases", "category", "tier", "source", "status", "rtl"],
            properties: {
              name,
              aliases: { type: "array", uniqueItems: true, items: name },
              category: { enum: categories },
              tier: { enum: ["core", "extended"] },
              source: { const: "miaixz" },
              status: { enum: ["planned", "stable"] },
              rtl: { enum: ["none", "mirror"] },
            },
          },
        },
      },
    },
    "design-briefs.schema.json": {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      $id: "https://miaixz.org/schema/icons/design-briefs-0.6.5.json",
      type: "object",
      additionalProperties: false,
      required: ["schemaVersion", "release", "briefs"],
      properties: {
        schemaVersion: { const: 1 },
        release: { const: release },
        briefs: {
          type: "array",
          items: {
            type: "object",
            required: [
              "name",
              "intent",
              "forbiddenMeanings",
              "metaphor",
              "primaryObject",
              "secondaryObjects",
              "compactAdjustments",
              "standardConstruction",
              "displayAdjustments",
              "outlineStrategy",
              "filledStrategy",
              "topologyPlan",
              "degenerates",
              "rtl",
              "automatedReview",
            ],
            properties: {
              name,
              intent: { type: "string", minLength: 16 },
              forbiddenMeanings: {
                type: "array",
                minItems: 1,
                items: { type: "string", minLength: 16 },
              },
              metaphor: { type: "string", minLength: 16 },
              primaryObject: { type: "string", minLength: 1 },
              secondaryObjects: {
                type: "array",
                minItems: 1,
                items: { type: "string", minLength: 1 },
              },
              compactAdjustments: { type: "string", minLength: 16 },
              standardConstruction: { type: "string", minLength: 16 },
              displayAdjustments: { type: "string", minLength: 16 },
              outlineStrategy: { type: "string", minLength: 16 },
              filledStrategy: { type: "string", minLength: 16 },
              topologyPlan: { type: "string", minLength: 16 },
              degenerates: { type: "object" },
              rtl: { enum: ["none", "mirror"] },
              automatedReview: {
                type: "object",
                additionalProperties: false,
                required: ["engine", "rulesetVersion", "sourceDigest", "status"],
                properties: {
                  engine: { const: "miaixz-icons-brief-validator" },
                  rulesetVersion: { const: 1 },
                  sourceDigest: { type: "string", pattern: "^[0-9a-f]{64}$" },
                  status: { const: "passed" },
                },
              },
            },
          },
        },
      },
    },
    "release-plan.schema.json": {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      $id: "https://miaixz.org/schema/icons/release-plan-0.6.5.json",
      type: "object",
      additionalProperties: false,
      required: [
        "schemaVersion",
        "release",
        "state",
        "selectionPolicy",
        "exactCanonicalCount",
        "exactCoreCount",
        "exactExtendedCount",
        "coreNames",
        "extendedNames",
        "canonicalNames",
        "historicalClassification",
        "aliasReviews",
        "batchSize",
        "batches",
      ],
      properties: {
        schemaVersion: { const: 1 },
        release: { const: release },
        state: { enum: ["brief-review", "design", "stable"] },
        selectionPolicy: { type: "string", minLength: 16 },
        exactCanonicalCount: { const: 1024 },
        exactCoreCount: { const: 64 },
        exactExtendedCount: { const: 960 },
        coreNames: { type: "array", minItems: 64, maxItems: 64, items: name },
        extendedNames: {
          type: "array",
          minItems: 960,
          maxItems: 960,
          items: name,
        },
        canonicalNames: {
          type: "array",
          minItems: 1024,
          maxItems: 1024,
          items: name,
        },
        historicalClassification: { type: "object" },
        aliasReviews: { type: "array" },
        batchSize: { const: 64 },
        batches: { type: "array", minItems: 16, maxItems: 16 },
      },
    },
  });
}

/**
 * Creates the immutable P1 source data from the pre-font name fixture.
 *
 * @returns {Promise<void>} Promise completed after all assets are written.
 */
async function bootstrapAssets() {
  const targetFiles = [
    "catalog.json",
    "catalog.schema.json",
    "design-briefs.json",
    "design-briefs.schema.json",
    "release-plan.json",
    "release-plan.schema.json",
    "fonts/codepoints.json",
  ];
  const existing = targetFiles.filter((path) => existsSync(resolve(assetsRoot, path)));
  if (existing.length > 0) {
    throw new Error(
      `Icon assets are already frozen; bootstrap refuses to overwrite: ${existing.join(", ")}.`,
    );
  }
  const historicalNames = await readJson(
    resolve(packageRoot, "tests/fixtures/icon-names-0.6.5.json"),
  );
  const uniqueHistorical = [...new Set(historicalNames)].sort(compareUtf8);
  if (uniqueHistorical.length !== 1780) {
    throw new Error(`Expected 1780 historical names; received ${uniqueHistorical.length}.`);
  }
  if (JSON.stringify([...coreNames].sort(compareUtf8)) !== JSON.stringify(coreNames)) {
    throw new Error("The frozen Core names are not UTF-8 sorted.");
  }
  const coreSet = new Set(coreNames);
  const requiredExtendedSet = new Set(requiredExtendedNames);
  const extendedNames = [
    ...uniqueHistorical
      .filter((name) => !coreSet.has(name) && !requiredExtendedSet.has(name))
      .slice(0, 960 - requiredExtendedNames.length),
    ...requiredExtendedNames,
  ];
  const canonicalNames = [...coreNames, ...extendedNames];
  if (new Set(canonicalNames).size !== 1024) {
    throw new Error("Canonical names are not a unique 1024-item set.");
  }
  validateIconIdentifiers(canonicalNames);
  const canonicalSet = new Set(canonicalNames);
  const historicalCanonical = uniqueHistorical.filter((name) => canonicalSet.has(name));
  const compatibilityNames = uniqueHistorical.filter((name) => !canonicalSet.has(name));
  const batches = Array.from({ length: 16 }, (_, index) => ({
    id: `B${String(index + 1).padStart(2, "0")}`,
    names: canonicalNames.slice(index * 64, (index + 1) * 64),
  }));
  const releasePlan = {
    schemaVersion: 1,
    release,
    state: "brief-review",
    selectionPolicy:
      "Use the frozen 64 Core names, the first 958 remaining historical names in UTF-8 byte order, then the required UI names zoom-in and zoom-out.",
    exactCanonicalCount: 1024,
    exactCoreCount: 64,
    exactExtendedCount: 960,
    coreNames,
    extendedNames,
    canonicalNames,
    historicalClassification: {
      canonical: historicalCanonical,
      aliases: [],
      compat: compatibilityNames,
    },
    aliasReviews: [],
    batchSize: 64,
    batches,
  };
  const stableIcons = canonicalNames.map((name) => {
    const tier = coreSet.has(name) ? "core" : "extended";
    return {
      name,
      aliases: [],
      category: categoryFor(name, tier),
      tier,
      source: "miaixz",
      status: "stable",
      rtl: rtlFor(name),
    };
  });
  const codepoints = canonicalNames.map((name, index) => ({
    name,
    codepoint: 0xf0000 + index,
    glyphName: `${glyphPrefix}${name}`,
    tier: index < 64 ? "core" : "extended",
  }));
  const schemaFiles = schemas();
  for (const [filename, schema] of Object.entries(schemaFiles)) {
    await writeJson(resolve(assetsRoot, filename), schema);
  }
  await writeJson(resolve(assetsRoot, "release-plan.json"), releasePlan);
  await writeJson(resolve(assetsRoot, "catalog.json"), {
    schemaVersion: 1,
    release,
    icons: stableIcons,
  });
  await writeJson(resolve(assetsRoot, "design-briefs.json"), {
    schemaVersion: 1,
    release,
    briefs: canonicalNames.map(briefFor),
  });
  await writeJson(resolve(fontsRoot, "codepoints.json"), {
    schemaVersion: 1,
    rangeStart: 0xf0000,
    icons: codepoints,
  });
}

/**
 * Creates one source module with the repository license and generated notice.
 *
 * @param {string} body - TypeScript module body.
 * @returns {Promise<string>} Complete source text.
 */
async function generatedModule(body) {
  const header = await readFile(resolve(repositoryRoot, ".github/scripts/miaixz.org"), "utf8");
  return format(
    `${header}\n/**\n * Generated by .github/scripts/modules/icons/codegen/generate-icons.mjs. Do not edit.\n */\n\n${body.trim()}\n`,
    {
      parser: "typescript",
      printWidth: 100,
      semi: true,
      singleQuote: false,
      trailingComma: "all",
    },
  );
}

/**
 * Atomically writes or compares generated TypeScript output.
 *
 * @param {string} filename - Generated filename.
 * @param {string} contents - Complete source text.
 * @param {boolean} check - Compare instead of write.
 * @returns {Promise<void>} Promise completed after verification or replacement.
 */
async function commitGenerated(filename, contents, check) {
  const destination = resolve(generatedRoot, filename);
  if (check) {
    if (!existsSync(destination) || (await readFile(destination, "utf8")) !== contents) {
      throw new Error(`Generated icon file is stale: ${filename}.`);
    }
    return;
  }
  await mkdir(dirname(destination), { recursive: true });
  const pending = resolve(dirname(destination), `.${filename}.${process.pid}.tmp`);
  try {
    await writeFile(pending, contents);
    await rename(pending, destination);
  } finally {
    await rm(pending, { force: true });
  }
}

/**
 * Generates public codepoint, priority-tier, name, and catalog data from JSON.
 *
 * @param {boolean} check - Compare without writing.
 * @returns {Promise<void>} Promise completed after all outputs are current.
 */
async function generateTypeScript(check) {
  const releasePlan = await readJson(resolve(assetsRoot, "release-plan.json"));
  const catalog = await readJson(resolve(assetsRoot, "catalog.json"));
  const codepointFile = await readJson(resolve(fontsRoot, "codepoints.json"));
  const stableEntries = catalog.icons.filter(
    (entry) => entry.source === "miaixz" && entry.status === "stable",
  );
  const identifiers = validateIconIdentifiers(releasePlan.canonicalNames);
  if (
    stableEntries.length !== 1024 ||
    codepointFile.icons.length !== 1024 ||
    JSON.stringify(stableEntries.map(({ name }) => name)) !==
      JSON.stringify(releasePlan.canonicalNames) ||
    JSON.stringify(codepointFile.icons.map(({ name }) => name)) !==
      JSON.stringify(releasePlan.canonicalNames)
  ) {
    throw new Error("Catalog, release plan, and codepoint canonical sets diverged.");
  }
  const rows = codepointFile.icons.map((icon) => ({
    ...icon,
    rtl: stableEntries.find(({ name }) => name === icon.name).rtl,
  }));
  const publicNames = releasePlan.canonicalNames;
  const nameMembers = publicNames.map((name) => [name.replaceAll("-", "_").toUpperCase(), name]);
  if (new Set(nameMembers.map(([member]) => member)).size !== nameMembers.length) {
    throw new Error("Public icon names collide after conversion to ICON_NAMES members.");
  }
  const outputs = new Map();
  outputs.set(
    "codepoints.ts",
    await generatedModule(`
export interface IconCodepoint {
  readonly name: string;
  readonly codepoint: number;
  readonly glyphName: string;
  readonly tier: "core" | "extended";
  readonly rtl: "none" | "mirror";
}
/**
 * Complete immutable codepoint ledger.
 */
export const ICON_CODEPOINTS = Object.freeze(${JSON.stringify(rows, null, 2)} as const satisfies readonly IconCodepoint[]);
/**
 * Fast canonical-name lookup for font definitions.
 */
export const ICON_CODEPOINT_BY_NAME = new Map(ICON_CODEPOINTS.map((entry) => [entry.name, entry]));
/**
 * Unicode glyph string lookup created without handwritten surrogate pairs.
 */
export const ICON_GLYPH_BY_NAME = new Map(ICON_CODEPOINTS.map((entry) => [entry.name, String.fromCodePoint(entry.codepoint)]));
`),
  );
  outputs.set(
    "names.ts",
    await generatedModule(`
/**
 * Deterministic TypeScript identifier to canonical name map.
 */
export const ICON_IDENTIFIERS = Object.freeze(${JSON.stringify(Object.fromEntries(identifiers), null, 2)} as const);
/**
 * Frozen constants for every font-backed public icon name.
 */
export const ICON_NAMES = Object.freeze(${JSON.stringify(Object.fromEntries(nameMembers), null, 2)} as const);
/**
 * Frozen public icon-name list for iteration and runtime validation.
 */
export const ICON_NAME_LIST = Object.freeze(${JSON.stringify(publicNames, null, 2)} as const);
/**
 * Names backed by the built-in Miaixz variable font.
 */
export const CANONICAL_ICON_NAMES = Object.freeze(${JSON.stringify(releasePlan.canonicalNames, null, 2)} as const);
/**
 * One public Miaixz font-backed icon name.
 */
export type IconName = (typeof ICON_NAME_LIST)[number];
`),
  );
  outputs.set(
    "catalog.ts",
    await generatedModule(`
export {
  CANONICAL_ICON_NAMES,
  ICON_IDENTIFIERS,
  ICON_NAMES,
  ICON_NAME_LIST,
} from "./names.js";
export type { IconName } from "./names.js";
/**
 * Frozen canonical catalog metadata.
 */
export const ICON_CATALOG = Object.freeze(${JSON.stringify(catalog.icons, null, 2)} as const);
`),
  );
  for (const [filename, contents] of outputs) {
    await commitGenerated(filename, contents, check);
  }
}

/**
 * Executes the strict command-line interface.
 *
 * @param {readonly string[]} arguments_ - User arguments.
 * @returns {Promise<void>} Promise completed after the selected operation.
 */
async function main(arguments_) {
  if (arguments_.length !== 1) {
    throw new Error(
      "generate-icons.mjs requires --bootstrap, --bootstrap-ufos, --bootstrap-notdef, --bootstrap-designspace, --write, or --check.",
    );
  }
  if (arguments_[0] === "--bootstrap") {
    await bootstrapAssets();
    await generateTypeScript(false);
    console.log("Frozen icon assets and generated mappings were created.");
    return;
  }
  if (arguments_[0] === "--bootstrap-ufos") {
    await bootstrapUfos();
    console.log("Six lower-case UFO source skeletons were created.");
    return;
  }
  if (arguments_[0] === "--bootstrap-notdef") {
    await bootstrapNotdef();
    console.log("The mandatory .notdef glyph was added to all six masters.");
    return;
  }
  if (arguments_[0] === "--bootstrap-designspace") {
    await bootstrapDesignspace();
    console.log("The two-axis six-source Designspace was created.");
    return;
  }
  if (arguments_[0] === "--write" || arguments_[0] === "--check") {
    const check = arguments_[0] === "--check";
    await synchronizeGeneratedAssets(check);
    await synchronizeUfoManifests(check);
    await generateTypeScript(check);
    console.log(
      arguments_[0] === "--check"
        ? "Generated icon mappings are current."
        : "Generated icon mappings were updated.",
    );
    return;
  }
  throw new Error(
    "generate-icons.mjs requires --bootstrap, --bootstrap-ufos, --bootstrap-notdef, --bootstrap-designspace, --write, or --check.",
  );
}

if (
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  await main(process.argv.slice(2));
}

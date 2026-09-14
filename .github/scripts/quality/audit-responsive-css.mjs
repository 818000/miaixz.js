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

import { readFile, readdir } from "node:fs/promises";
import { extname, relative, resolve } from "node:path";
import process from "node:process";
import { repositoryRoot } from "../miaixz.mjs";

const packageDirectory = resolve(repositoryRoot, "ui");
const styleFiles = [
  ...(await collectFiles(resolve(packageDirectory, "src/styles"), new Set([".css"]))),
  ...(await collectFiles(resolve(packageDirectory, "src/theme"), new Set([".css"]))),
];
const sourceFiles = await collectFiles(resolve(packageDirectory, "src"), new Set([".ts", ".tsx"]));
const findings = [];
const dimensionOwnership = {
  componentGeometry: 0,
  densityGeometry: 0,
  foundationGeometry: 0,
  themeGeometry: 0,
};

for (const file of styleFiles) {
  const source = await readFile(file, "utf8");
  const fileName = relative(packageDirectory, file);
  const isFoundation = fileName.includes("/foundation/") || fileName.endsWith("foundation.css");
  const isGeneratedTheme = /^src\/theme\/(?:miaixz|neutral|contrast|theme)\.css$/.test(fileName);
  const isResponsive = fileName.endsWith("/foundation/responsive.css");
  if (!isResponsive) {
    inspect(
      fileName,
      source,
      /@media\s*\([^)]*(?:767|768|1023|1024|1279|1280|1439|1440)px[^)]*\)/g,
      "RESPONSIVE_BREAKPOINT_DUPLICATE",
    );
  }
  if (source.includes("100vh") && !source.includes("100dvh")) {
    addFinding(fileName, source, source.indexOf("100vh"), "RESPONSIVE_VH_WITHOUT_DVH", "100vh");
  }
  inspect(
    fileName,
    source,
    /\b(?:margin-left|margin-right|padding-left|padding-right|border-left|border-right|left|right)\s*:/g,
    "RESPONSIVE_PHYSICAL_PROPERTY",
  );
  classifyDimensionDeclarations(fileName, source, {
    isFoundation: isFoundation || isResponsive,
    isGeneratedTheme,
  });
  for (const match of source.matchAll(/@container\s+([a-z0-9-]+)/g)) {
    const name = match[1];
    if (!new RegExp(`container(?:-name)?\\s*:\\s*${name}(?:\\s*\\/|\\b)`).test(source)) {
      addFinding(fileName, source, match.index, "RESPONSIVE_CONTAINER_UNDECLARED", name);
    }
  }
  inspectResponsiveHiddenContent(fileName, source);
}

const combinedStyles = (await Promise.all(styleFiles.map((file) => readFile(file, "utf8")))).join(
  "\n",
);
if (!/@media\s*\(pointer:\s*coarse\)[\s\S]*44px/.test(combinedStyles)) {
  addFinding(
    "src/styles",
    combinedStyles,
    0,
    "RESPONSIVE_TOUCH_TARGET",
    "missing 44px coarse-pointer rule",
  );
}
if (
  /\b(?:img|svg|canvas|video)\b/.test(combinedStyles) &&
  !/:is\(img, svg, video, canvas\)[\s\S]*max-inline-size\s*:\s*100%/.test(combinedStyles)
) {
  addFinding("src/styles", combinedStyles, 0, "RESPONSIVE_MEDIA_MAX_SIZE", "media elements");
}

for (const file of sourceFiles) {
  const source = await readFile(file, "utf8");
  const fileName = relative(packageDirectory, file);
  inspect(
    fileName,
    source,
    /(?:window\.innerWidth|document\.documentElement\.clientWidth|matchMedia\(["'][^"']*(?:width|min-width|max-width))/g,
    "RESPONSIVE_SSR_WIDTH_BRANCH",
  );
}

for (const finding of findings) process.stderr.write(`${finding}\n`);
if (findings.length > 0) process.exitCode = 1;

/**
 * Records every regular-expression match as a policy finding.
 *
 * @param {string} fileName Repository-relative file name.
 * @param {string} source Complete source text.
 * @param {RegExp} pattern Global pattern that identifies violations.
 * @param {string} code Stable policy diagnostic code.
 * @returns {void}
 */
function inspect(fileName, source, pattern, code) {
  for (const match of source.matchAll(pattern))
    addFinding(fileName, source, match.index, code, match[0]);
}

/**
 * Counts dimension declarations by their owning design-system layer.
 *
 * @param {string} fileName Package-relative stylesheet name.
 * @param {string} source Complete stylesheet source.
 * @param {{ isFoundation: boolean, isGeneratedTheme: boolean }} classification Stylesheet ownership flags.
 * @returns {void}
 */
function classifyDimensionDeclarations(fileName, source, { isFoundation, isGeneratedTheme }) {
  const declaration =
    /(?:^|[;{]\s*)((?:min-|max-)?(?:inline-size|block-size|width|height)|padding(?:-[a-z]+)?|margin(?:-[a-z]+)?|gap|inset(?:-[a-z]+)?)\s*:\s*([^;{}]+)/gim;
  for (const match of source.matchAll(declaration)) {
    const value = match[2].trim();
    const dimensions = [...value.matchAll(/-?(?:\d*\.)?\d+(?:px|rem|em|ch|vw|vh|vi|dvh)\b/gi)].map(
      ([dimension]) => dimension.toLowerCase(),
    );
    if (dimensions.length === 0) continue;
    if (/var\(--miaixz-(?:density|geometry)-/u.test(value)) {
      dimensionOwnership.densityGeometry += 1;
    } else if (isFoundation) {
      dimensionOwnership.foundationGeometry += 1;
    } else if (isGeneratedTheme) {
      dimensionOwnership.themeGeometry += 1;
    } else if (fileName.includes("/components/")) {
      dimensionOwnership.componentGeometry += 1;
    }
  }
}

/**
 * Detects content hidden only at responsive breakpoints.
 *
 * @param {string} fileName Package-relative stylesheet name.
 * @param {string} source Complete stylesheet source.
 * @returns {void}
 */
function inspectResponsiveHiddenContent(fileName, source) {
  for (const match of source.matchAll(/@media\s*([^{]+){/gi)) {
    const condition = match[1].trim();
    if (/\bprint\b/i.test(condition) || !/(?:width|orientation|pointer|hover)/i.test(condition)) {
      continue;
    }
    const bodyStart = match.index + match[0].length;
    const bodyEnd = findBlockEnd(source, bodyStart);
    if (bodyEnd < 0) continue;
    const body = source.slice(bodyStart, bodyEnd);
    for (const hidden of body.matchAll(/display\s*:\s*none\s*;/gi)) {
      addFinding(
        fileName,
        source,
        bodyStart + hidden.index,
        "RESPONSIVE_HIDDEN_CONTENT",
        `@media ${condition}: display: none`,
      );
    }
  }
}

/**
 * Finds the closing brace for a CSS block while respecting nested blocks.
 *
 * @param {string} source Complete stylesheet source.
 * @param {number} bodyStart Offset immediately after the opening brace.
 * @returns {number} Closing-brace offset, or -1 when the block is incomplete.
 */
function findBlockEnd(source, bodyStart) {
  let depth = 1;
  for (let index = bodyStart; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    else if (source[index] === "}") depth -= 1;
    if (depth === 0) return index;
  }
  return -1;
}

/**
 * Appends a normalized, line-addressable responsive policy finding.
 *
 * @param {string} fileName Package-relative file name.
 * @param {string} source Complete source text.
 * @param {number} index Character offset of the violation.
 * @param {string} code Stable policy diagnostic code.
 * @param {unknown} value Source value that triggered the diagnostic.
 * @returns {void}
 */
function addFinding(fileName, source, index, code, value) {
  const line = source.slice(0, Math.max(index, 0)).split("\n").length;
  findings.push(`${fileName}:${line}: ${code}: ${String(value).trim()}`);
}

/**
 * Recursively collects files whose extensions are included in the supplied set.
 *
 * @param {string} directory Absolute directory to traverse.
 * @param {Set<string>} extensions File extensions to include.
 * @returns {Promise<string[]>} Stable absolute file paths.
 */
async function collectFiles(directory, extensions) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const target = resolve(directory, entry.name);
      return entry.isDirectory()
        ? collectFiles(target, extensions)
        : Promise.resolve(extensions.has(extname(entry.name)) ? [target] : []);
    }),
  );
  return nested.flat().sort();
}

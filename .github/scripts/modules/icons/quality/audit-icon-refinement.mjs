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
 * Scans actual source contours without changing glyphs or creating process records.
 */
import { relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { assetsRoot, fontsRoot, repositoryRoot, loadIconSource } from "../source.mjs";
import { inspectFontSource } from "../fonts/read-font-source.mjs";
import { sourceMasterName } from "../fonts/interpolate-icon-source.mjs";

const refinementMasterNames = Object.freeze([
  "outline-compact",
  "outline-standard",
  "outline-display",
  "filled-compact",
  "filled-standard",
  "filled-display",
]);

/**
 * Selects small four-line axis-aligned rectangles as candidates, never confirmed defects.
 * @param {object} glyph Raw structured GLIF.
 * @returns {object[]} Candidate contour indices and complete actual point snapshots.
 */
export function scanRefinementCandidates(glyph) {
  return glyph.contours.flatMap((contour, index) => {
    const p = contour.points;
    if (p.length !== 4 || p.some((point) => point.type !== "line")) return [];
    const x = [...new Set(p.map((point) => point.x))].sort((a, b) => a - b),
      y = [...new Set(p.map((point) => point.y))].sort((a, b) => a - b);
    if (
      x.length !== 2 ||
      y.length !== 2 ||
      x[1] - x[0] > 150 ||
      y[1] - y[0] > 120 ||
      new Set(p.map((point) => point.x + "|" + point.y)).size !== 4 ||
      p.some((point, i) => point.x !== p[(i + 1) % 4].x && point.y !== p[(i + 1) % 4].y)
    )
      return [];
    return [
      {
        code: "NON_SEMANTIC_CONTOUR",
        contour: index,
        points: p.map((point) => ({ ...point })),
      },
    ];
  });
}

/**
 * Groups exact geometry in memory; a shared signature is not itself a defect.
 * @param {object[]} entries Name, master and actual contour records.
 * @returns {object[]} Repeated geometry groups with their exact member names.
 */
export function sharedGeometryGroups(entries) {
  const buckets = new Map();
  for (const entry of entries) {
    const geometry = entry.contours.map((contour) =>
      contour.points.map((point) => [point.x, point.y, point.type ?? null]),
    );
    const key = entry.master + "|" + JSON.stringify(geometry);
    if (!buckets.has(key)) buckets.set(key, { master: entry.master, names: [] });
    buckets.get(key).names.push(entry.name);
  }
  return [...buckets.values()]
    .filter((group) => group.names.length > 1)
    .map((group) => ({ ...group, names: group.names.sort() }));
}

/**
 * Reads every business glyph independently in each master, excluding only .notdef.
 * @param {{assetsRoot?:string,fontsRoot?:string}} options Isolated source override for tests.
 * @returns {Promise<object>} Canonical identities, structured source and 6xN scan rows.
 */
export async function scanIconRefinement(options = {}) {
  const source = await loadIconSource({
    assetsRoot: options.assetsRoot ?? assetsRoot,
  });
  const fontRoot = options.fontsRoot ?? fontsRoot,
    fontSource = await inspectFontSource({ fontsRoot: fontRoot });
  const glyphs = [],
    completeGeometry = [],
    defaultBodies = [];
  for (const icon of source.icons)
    for (const [i, master] of fontSource.masters.entries()) {
      const glyph = fontSource.rawMasters[i].get("miaixz." + icon.name);
      if (!glyph) throw new Error("Missing business glyph: " + icon.name);
      const masterName = sourceMasterName(master),
        candidates = scanRefinementCandidates(glyph);
      completeGeometry.push({ name: icon.name, master: masterName, contours: glyph.contours });
      if (masterName === "outline-standard") {
        const lastThree = [
          glyph.contours.length - 3,
          glyph.contours.length - 2,
          glyph.contours.length - 1,
        ];
        /**
         * This exclusion is only a comparison lens; the actual source remains entirely intact.
         */
        if (
          lastThree.every(
            (index) => index >= 0 && candidates.some((candidate) => candidate.contour === index),
          )
        )
          defaultBodies.push({
            name: icon.name,
            master: masterName,
            contours: glyph.contours.slice(0, -3),
          });
      }
      glyphs.push({
        name: icon.name,
        master: sourceMasterName(master),
        path: relative(repositoryRoot, resolve(fontRoot, glyph.sourcePath)).split(sep).join("/"),
        sha256: glyph.sha256,
        contourCount: glyph.contours.length,
        candidates,
        errors: [],
      });
    }
  glyphs.sort((a, b) =>
    a.name < b.name
      ? -1
      : a.name > b.name
        ? 1
        : a.master < b.master
          ? -1
          : a.master > b.master
            ? 1
            : 0,
  );
  return {
    source,
    fontSource,
    masters: [...refinementMasterNames],
    glyphs,
    sharedContours: sharedGeometryGroups(completeGeometry),
    defaultBodyGroups: sharedGeometryGroups(defaultBodies),
  };
}

/**
 * Accepts only the read-only scan command; record initialization is retired.
 * @param {string[]} args CLI arguments.
 * @returns {{mode:string}} Validated scan mode.
 */
export function parseArguments(args) {
  if (args.length !== 2 || args[0] !== "--mode" || args[1] !== "scan")
    throw new Error("Expected --mode scan; persistent refinement records are disabled.");
  return { mode: "scan" };
}

/**
 * Prints actual candidate counts without declaring candidates defects or completed reviews.
 * @param {string[]} args CLI arguments.
 * @returns {Promise<object>} Actual in-memory source scan.
 */
export async function main(args = process.argv.slice(2)) {
  parseArguments(args);
  const result = await scanIconRefinement();
  console.log(
    "Scanned " +
      result.source.icons.length +
      " names and " +
      result.glyphs.length +
      " master glyphs; " +
      result.glyphs.reduce((sum, glyph) => sum + glyph.candidates.length, 0) +
      " candidate contours require individual review. No files written.",
  );
  return result;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href)
  await main();

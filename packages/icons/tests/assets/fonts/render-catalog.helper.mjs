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
 * Compares independent source interpolation with the actual release font at native CSS sizes.
 * Importing this module does not launch browsers or write evidence.
 */
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { isUint8Array } from "node:util/types";
import { chromium, firefox, webkit } from "@playwright/test";
import { PNG } from "pngjs";
import {
  fontsRoot,
  loadIconSource,
  packageRoot,
  repositoryRoot,
} from "../../../../../.github/scripts/modules/icons/source.mjs";
import { inspectFontSource } from "../../../../../.github/scripts/modules/icons/fonts/read-font-source.mjs";
import {
  compatibleSourceContours,
  interpolateIconSource,
  sourceSvg,
} from "../../../../../.github/scripts/modules/icons/fonts/interpolate-icon-source.mjs";
import { flattenGlyphContours } from "../../../../../.github/scripts/modules/icons/fonts/font-geometry.mjs";
import {
  sourceSha256,
  validateRefinedFont,
} from "../../../../../.github/scripts/modules/icons/fonts/validate-icon-font.mjs";

const browserTypes = { chromium, firefox, webkit };
/**
 * Hashes the exact supplied source or in-memory coverage bytes.
 * @param bytes - Actual unmodified file or raster bytes.
 * @returns Actual SHA-256 digest.
 */
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
/**
 * Constructs a concrete in-memory measured-state diagnostic.
 * @param code - Specific failure identifier.
 * @param message - Actual failure explanation.
 * @param sampleKey - Actual state key or null.
 * @returns Closed public error record.
 */
const error = (code, message, sampleKey = null) => ({
  code,
  message,
  path: null,
  sampleKey,
});

/**
 * Recovers exact black-foreground coverage from an opaque white browser surface.
 * Black composited on white gives RGB=255-alpha; no alignment or threshold is changed.
 * Non-grayscale or nonopaque pixels reject an incorrectly configured test surface.
 * @param {{width:number,height:number,data:Uint8Array}} raster Actual decoded screenshot.
 * @returns {{width:number,height:number,data:Buffer}} Independent in-memory coverage raster.
 */
export function coverageRaster(raster) {
  if (
    !Number.isSafeInteger(raster.width) ||
    raster.width <= 0 ||
    !Number.isSafeInteger(raster.height) ||
    raster.height <= 0 ||
    !isUint8Array(raster.data) ||
    raster.data.length !== raster.width * raster.height * 4
  )
    throw new Error("Invalid coverage raster dimensions or RGBA bytes.");
  const data = Buffer.alloc(raster.data.length);
  for (let i = 0; i < data.length; i += 4) {
    if (
      raster.data[i] !== raster.data[i + 1] ||
      raster.data[i] !== raster.data[i + 2] ||
      raster.data[i + 3] !== 255
    )
      throw new Error("Coverage capture requires opaque grayscale black-on-white pixels.");
    data[i + 3] = 255 - raster.data[i];
  }
  return { width: raster.width, height: raster.height, data };
}

/**
 * Defines the complete dimensions from actual identities, with no per-icon exclusions.
 * @param icons - Current canonical identity records.
 * @returns Complete fixed matrix and coverage counts.
 */
export function visualMatrix(icons) {
  const names = icons.length,
    mirrorNames = icons.filter((i) => i.rtl === "mirror").length;
  const opticalSizes = [12, 16, 20, 24, 32, 40],
    fills = [0, 0.25, 0.5, 0.75, 1];
  const browsers = ["chromium", "firefox", "webkit"],
    dprs = [1, 2];
  const states = opticalSizes.length * fills.length * browsers.length * dprs.length;
  return {
    names,
    mirrorNames,
    opticalSizes,
    fills,
    browsers,
    dprs,
    directions: ["ltr", "rtl"],
    ltrPairs: names * states,
    rtlPairs: mirrorNames * states,
    totalPairs: (names + mirrorNames) * states,
  };
}

/**
 * Produces the prescribed unique key, without decimal padding or aliases.
 * @param s - Actual name and visual state.
 * @returns Prescribed unique decimal sample key.
 */
export function visualSampleKey(s) {
  return [s.name, s.opticalSize, s.fill, s.browser, s.dpr, s.direction].join("|");
}

/**
 * Rejects every missing, duplicate, extra or illegal state; count alone cannot prove coverage.
 * @param input - Canonical icons, recorded dimensions and actual rendered samples.
 * @returns Exact missing, duplicate or illegal state diagnostics.
 */
export function validateVisualCoverage({ icons, matrix, samples }) {
  const expectedMatrix = visualMatrix(icons),
    failures = [];
  if (JSON.stringify(matrix) !== JSON.stringify(expectedMatrix))
    failures.push(error("MATRIX", "Visual dimensions differ from the fixed current matrix."));
  const expected = new Set();
  for (const icon of icons)
    for (const opticalSize of expectedMatrix.opticalSizes)
      for (const fill of expectedMatrix.fills)
        for (const browser of expectedMatrix.browsers)
          for (const dpr of expectedMatrix.dprs)
            for (const direction of icon.rtl === "mirror" ? ["ltr", "rtl"] : ["ltr"])
              expected.add(
                visualSampleKey({
                  name: icon.name,
                  opticalSize,
                  fill,
                  browser,
                  dpr,
                  direction,
                }),
              );
  const seen = new Set();
  for (const sample of samples) {
    const key = visualSampleKey(sample);
    if (!expected.has(key))
      failures.push(error("EXTRA_SAMPLE", "Illegal name or visual state.", key));
    if (seen.has(key))
      failures.push(error("DUPLICATE_SAMPLE", "Visual state appears more than once.", key));
    seen.add(key);
  }
  for (const key of expected)
    if (!seen.has(key))
      failures.push(error("MISSING_SAMPLE", "Required visual state was not rendered.", key));
  return failures;
}

/**
 * Extracts fixed-size raw RGBA pixels from a contact sheet without shifting or resampling.
 * @param sheet - Decoded actual PNG screenshot.
 * @param index - Zero-based cell index.
 * @param cellPixels - Native device-pixel cell extent.
 * @param columns - Contact-sheet columns.
 * @returns Unmodified fixed-size RGBA crop.
 */
export function cropRaster(sheet, index, cellPixels, columns = 32) {
  if (
    !Number.isSafeInteger(index) ||
    index < 0 ||
    !Number.isSafeInteger(cellPixels) ||
    cellPixels <= 0 ||
    !Number.isSafeInteger(columns) ||
    columns <= 0 ||
    !Number.isSafeInteger(sheet.width) ||
    sheet.width <= 0 ||
    !Number.isSafeInteger(sheet.height) ||
    sheet.height <= 0 ||
    !isUint8Array(sheet.data) ||
    sheet.data.length !== sheet.width * sheet.height * 4
  )
    throw new Error("Invalid native raster grid or dimensions.");
  const x = (index % columns) * cellPixels,
    y = Math.floor(index / columns) * cellPixels;
  if (x + cellPixels > sheet.width || y + cellPixels > sheet.height)
    throw new Error("Raster crop is outside the actual screenshot.");
  const data = Buffer.alloc(cellPixels * cellPixels * 4);
  const bytes = Buffer.from(sheet.data.buffer, sheet.data.byteOffset, sheet.data.byteLength);
  for (let row = 0; row < cellPixels; row++)
    bytes.copy(
      data,
      row * cellPixels * 4,
      ((y + row) * sheet.width + x) * 4,
      ((y + row) * sheet.width + x + cellPixels) * 4,
    );
  return { width: cellPixels, height: cellPixels, data };
}

/**
 * Measures alpha-weighted area and centroid, and the exact four-neighbour mask boundary.
 * @param raster - Raw RGBA pixels and native dimensions.
 * @param alphaThreshold - Design mask alpha threshold.
 * @returns Weighted measurements and four-neighbour mask boundary.
 */
function measureRaster(raster, alphaThreshold) {
  const { width, height, data } = raster,
    mask = new Uint8Array(width * height),
    boundary = [];
  let area = 0,
    wx = 0,
    wy = 0,
    clipped = false;
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const i = y * width + x,
        alpha = data[i * 4 + 3] / 255;
      mask[i] = data[i * 4 + 3] >= alphaThreshold ? 1 : 0;
      area += alpha;
      wx += alpha * (x + 0.5);
      wy += alpha * (y + 0.5);
      if (alpha > 0 && (x === 0 || y === 0 || x === width - 1 || y === height - 1)) clipped = true;
    }
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      if (
        mask[i] &&
        (x === 0 ||
          y === 0 ||
          x === width - 1 ||
          y === height - 1 ||
          !mask[i - 1] ||
          !mask[i + 1] ||
          !mask[i - width] ||
          !mask[i + width])
      )
        boundary.push([x, y]);
    }
  return {
    area,
    centroid: area ? [wx / area, wy / area] : [0, 0],
    mask,
    boundary,
    clipped,
    /**
     * The binary mask measures thresholded boundaries, not foreground existence.
     * Antialiased native strokes may contain visible ink entirely below the mask threshold.
     */
    empty: area === 0,
  };
}

/**
 * Computes the exact nearest distance between device-pixel boundary centres.
 * @param point - Device-pixel boundary centre.
 * @param boundary - Actual target boundary pixel centres.
 * @param indices - Target boundary indices for exact zero/one-distance lookup.
 * @param width - Native raster width.
 * @returns Exact Euclidean distance to the nearest target boundary.
 */
function nearestDistance(point, boundary, indices, width) {
  const [x, y] = point,
    key = y * width + x;
  if (indices.has(key)) return 0;
  if (
    (indices.has(key - 1) && x > 0) ||
    (indices.has(key + 1) && x + 1 < width) ||
    (indices.has(key - width) && y > 0) ||
    indices.has(key + width)
  )
    return 1;
  /**
   * Integer-grid neighbours in increasing squared distance give the exact minimum.
   * Every point outside this two-pixel square is at least three pixels away.
   */
  for (const [squared, offsets] of nearbyBoundaryOffsets)
    for (const [dx, dy] of offsets) {
      const nx = x + dx,
        ny = y + dy;
      if (nx >= 0 && nx < width && ny >= 0 && indices.has(ny * width + nx))
        return Math.sqrt(squared);
    }
  let distance = Infinity;
  for (const q of boundary) distance = Math.min(distance, Math.hypot(x - q[0], y - q[1]));
  return distance;
}

/**
 * Exact device-pixel neighbour groups; zero and cardinal distance one are checked first.
 */
const nearbyBoundaryOffsets = [
  [
    2,
    [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ],
  ],
  [
    4,
    [
      [-2, 0],
      [2, 0],
      [0, -2],
      [0, 2],
    ],
  ],
  [
    5,
    [
      [-2, -1],
      [-2, 1],
      [2, -1],
      [2, 1],
      [-1, -2],
      [1, -2],
      [-1, 2],
      [1, 2],
    ],
  ],
  [
    8,
    [
      [-2, -2],
      [-2, 2],
      [2, -2],
      [2, 2],
    ],
  ],
];

/**
 * Recomputes every fixed raster metric from actual RGBA bytes, not screenshot file hashes.
 * @param source - Independently interpolated source raster.
 * @param font - Actual release-font raster.
 * @param rules - Single design comparison rule object.
 * @returns Actual raster metrics from raw alpha pixels.
 */
export function compareRasters(source, font, rules) {
  if (
    source.width !== font.width ||
    source.height !== font.height ||
    source.data.length !== source.width * source.height * 4 ||
    font.data.length !== font.width * font.height * 4
  )
    throw new Error("Source and font rasters must have the same unmodified dimensions.");
  const a = measureRaster(source, rules.alphaThreshold),
    b = measureRaster(font, rules.alphaThreshold);
  const width = source.width,
    aset = new Set(a.boundary.map((p) => p[1] * width + p[0])),
    bset = new Set(b.boundary.map((p) => p[1] * width + p[0]));
  let maxBoundaryPixels = 0,
    xorOutsideBoundary = 0;
  if (!a.empty && !b.empty) {
    for (const p of a.boundary)
      maxBoundaryPixels = Math.max(maxBoundaryPixels, nearestDistance(p, b.boundary, bset, width));
    for (const p of b.boundary)
      maxBoundaryPixels = Math.max(maxBoundaryPixels, nearestDistance(p, a.boundary, aset, width));
  }
  for (let i = 0; i < a.mask.length; i++)
    if (a.mask[i] !== b.mask[i]) {
      const p = [i % width, Math.floor(i / width)];
      if (
        Math.min(
          nearestDistance(p, a.boundary, aset, width),
          nearestDistance(p, b.boundary, bset, width),
        ) > rules.boundaryPixels
      )
        xorOutsideBoundary++;
    }
  return {
    sourceArea: a.area,
    fontArea: b.area,
    areaRelativeError: a.area ? Math.abs(a.area - b.area) / a.area : b.area ? 1 : 0,
    sourceCentroid: a.centroid,
    fontCentroid: b.centroid,
    centroidDistancePixels: Math.hypot(
      a.centroid[0] - b.centroid[0],
      a.centroid[1] - b.centroid[1],
    ),
    maxBoundaryPixels,
    xorOutsideBoundary,
    sourceEmpty: a.empty,
    fontEmpty: b.empty,
    clipped: a.clipped || b.clipped,
  };
}

/**
 * Evaluates the single design threshold source; there are no browser-specific relaxations.
 * @param metrics - Actual raster measurements or null when unavailable.
 * @param rules - Single design comparison threshold object.
 * @param sampleKey - Actual visual state identifier.
 * @returns Fixed quality-rule failures.
 */
export function rasterFailures(metrics, rules, sampleKey = null) {
  if (!metrics) return [error("NO_RASTER", "The visual pair was not measured.", sampleKey)];
  const failures = [];
  if (metrics.sourceEmpty || metrics.fontEmpty)
    failures.push(error("EMPTY_RASTER", "Source or font is empty.", sampleKey));
  if (metrics.clipped)
    failures.push(
      error("CLIPPED", "Nontransparent pixels touch the sampling boundary.", sampleKey),
    );
  if (metrics.maxBoundaryPixels > rules.boundaryPixels)
    failures.push(
      error("BOUNDARY", "Device-pixel boundary distance exceeds the fixed limit.", sampleKey),
    );
  if (metrics.areaRelativeError > rules.areaRelativeError)
    failures.push(
      error("AREA", "Alpha-weighted coverage differs beyond the fixed limit.", sampleKey),
    );
  if (metrics.centroidDistancePixels > rules.centroidPixels)
    failures.push(
      error("CENTROID", "Alpha-weighted centroid differs beyond the fixed limit.", sampleKey),
    );
  if (metrics.xorOutsideBoundary !== 0)
    failures.push(
      error("INTERIOR_XOR", "Interior structure differs outside the boundary band.", sampleKey),
    );
  return failures;
}

/**
 * Classifies pixel centres from independent source curves, never from either screenshot.
 * Labels zero/one are exterior/interior cores; two is the fixed one-device-pixel edge band.
 * The flattening error is added only to bound the distance to the original exact curve.
 * @param input - Independent contours, actual size/DPR/origin, mirror flag and design rules.
 * @returns Immutable-by-contract reference dimensions and pixel-region labels.
 */
export function referencePixelRegions({ contours, size, dpr, mirror = false, rules, unitsPerEm }) {
  if (!Number.isFinite(size) || size <= 0 || ![1, 2].includes(dpr) || unitsPerEm !== 960)
    throw new Error("Invalid native reference projection.");
  const extent = (size + 2 * rules.paddingCssPixels) * dpr,
    scale = (size * dpr) / unitsPerEm,
    padding = rules.paddingCssPixels * dpr;
  if (!Number.isSafeInteger(extent) || extent <= 0) throw new Error("Invalid reference extent.");
  const polygons = flattenGlyphContours(contours, rules.subdivisionUnits).contours.map((polygon) =>
    polygon.map(([x, y]) => [
      padding + (mirror ? unitsPerEm - x : x) * scale,
      padding + (800 - y) * scale,
    ]),
  );
  const edges = polygons.flatMap((polygon) => polygon.slice(1).map((p, i) => [polygon[i], p])),
    data = new Uint8Array(extent * extent);
  if (!edges.length) throw new Error("Independent reference contours are empty.");
  for (let y = 0; y < extent; y++) {
    const py = y + 0.5,
      crossings = edges
        .filter(([a, b]) => (a[1] <= py && b[1] > py) || (b[1] <= py && a[1] > py))
        .map(([a, b]) => [
          a[0] + ((py - a[1]) * (b[0] - a[0])) / (b[1] - a[1]),
          b[1] > a[1] ? 1 : -1,
        ])
        .sort((a, b) => a[0] - b[0]);
    let winding = 0,
      crossing = 0;
    for (let x = 0; x < extent; x++) {
      while (crossing < crossings.length && crossings[crossing][0] <= x + 0.5)
        winding += crossings[crossing++][1];
      data[y * extent + x] = winding === 0 ? 0 : 1;
    }
  }
  const band = rules.boundaryPixels + rules.subdivisionUnits * scale;
  for (const [a, b] of edges) {
    const dx = b[0] - a[0],
      dy = b[1] - a[1],
      length = dx * dx + dy * dy;
    for (
      let y = Math.max(0, Math.ceil(Math.min(a[1], b[1]) - band - 0.5));
      y <= Math.min(extent - 1, Math.floor(Math.max(a[1], b[1]) + band - 0.5));
      y++
    )
      for (
        let x = Math.max(0, Math.ceil(Math.min(a[0], b[0]) - band - 0.5));
        x <= Math.min(extent - 1, Math.floor(Math.max(a[0], b[0]) + band - 0.5));
        x++
      ) {
        const t =
          length === 0
            ? 0
            : Math.max(0, Math.min(1, ((x + 0.5 - a[0]) * dx + (y + 0.5 - a[1]) * dy) / length));
        if (Math.hypot(x + 0.5 - a[0] - t * dx, y + 0.5 - a[1] - t * dy) <= band)
          data[y * extent + x] = 2;
      }
  }
  return { width: extent, height: extent, data };
}

/**
 * Retains raw cross-renderer metrics and independently rejects changes outside the source edge band.
 * Neither raster can move the reference band or supply its own correctness expectation.
 * @param source - Actual independent SVG coverage raster.
 * @param font - Actual release-font coverage raster.
 * @param reference - Independent projected source regions.
 * @param rules - Exact design comparison rules.
 * @returns Raw diagnostics plus independent source/font core violations.
 */
export function compareReferenceCoverage(source, font, reference, rules) {
  const metrics = compareRasters(source, font, rules);
  if (
    reference.width !== source.width ||
    reference.height !== source.height ||
    reference.data.length !== source.width * source.height
  )
    throw new Error("Reference region dimensions differ from native rasters.");
  let sourceCoreErrors = 0,
    fontCoreErrors = 0;
  for (let i = 0; i < reference.data.length; i++) {
    const region = reference.data[i];
    if (![0, 1, 2].includes(region)) throw new Error("Invalid source reference region.");
    if (region === 2) continue;
    for (const [layer, raster] of [
      ["source", source],
      ["font", font],
    ]) {
      const alpha = raster.data[i * 4 + 3],
        failed = region === 0 ? alpha >= rules.alphaThreshold : alpha < rules.alphaThreshold;
      if (failed) {
        if (layer === "source") sourceCoreErrors++;
        else fontCoreErrors++;
      }
    }
  }
  return { ...metrics, sourceCoreErrors, fontCoreErrors };
}

/**
 * Evaluates native coverage only after the independently checked geometry gate.
 * Raw alpha area, centroid and mask distances remain diagnostics, not browser exemptions.
 * @param metrics - Actual coverage and independently derived core violations.
 * @param rules - Unchanged design rules.
 * @param sampleKey - Exact native-state identity.
 * @returns Native empty/crop/core failures; vector thresholds are checked by the geometry gate.
 */
export function referenceRasterFailures(metrics, rules, sampleKey = null) {
  if (!metrics) return [error("NO_RASTER", "The visual pair was not measured.", sampleKey)];
  const failures = [];
  if (metrics.sourceEmpty || metrics.fontEmpty)
    failures.push(error("EMPTY_RASTER", "Source or font is empty.", sampleKey));
  if (metrics.clipped)
    failures.push(
      error("CLIPPED", "Nontransparent pixels touch the sampling boundary.", sampleKey),
    );
  if (
    !Number.isSafeInteger(metrics.sourceCoreErrors) ||
    metrics.sourceCoreErrors < 0 ||
    !Number.isSafeInteger(metrics.fontCoreErrors) ||
    metrics.fontCoreErrors < 0
  )
    failures.push(
      error("NO_REFERENCE", "Independent source core measurements are absent.", sampleKey),
    );
  else {
    if (metrics.sourceCoreErrors)
      failures.push(
        error(
          "SOURCE_CORE",
          "SVG coverage contradicts independent source geometry outside the fixed edge band.",
          sampleKey,
        ),
      );
    if (metrics.fontCoreErrors)
      failures.push(
        error(
          "FONT_CORE",
          "Font coverage contradicts independent source geometry outside the fixed edge band.",
          sampleKey,
        ),
      );
  }
  return failures;
}

/**
 * Builds both layers at exactly the same grid origin using the release CSS line box.
 * @param input - Actual entries, independent source paths, release CSS and native dimensions.
 * @returns Both layers at the same grid origins with production line boxes.
 */
export function surface({ entries, sourcePaths, css, size, fill, padding, layer }) {
  const cell = size + 2 * padding,
    columns = 32;
  const content = entries
    .map((entry, i) => {
      const body =
        layer === "font"
          ? '<span class="miaixz-icon-glyph" data-miaixz-icon-mirror="' +
            (entry.rtl === "mirror") +
            '" data-miaixz-icon-glyph="' +
            String.fromCodePoint(entry.codepoint) +
            '"></span>'
          : '<span class="refinement-source" data-miaixz-icon-mirror="' +
            (entry.rtl === "mirror") +
            '">' +
            sourcePaths[i] +
            "</span>";
      return (
        '<div class="cell" dir="' +
        entry.direction +
        '"><span class="miaixz-icon" data-motion="none">' +
        body +
        "</span></div>"
      );
    })
    .join("");
  return (
    '<!doctype html><html><head><meta charset="utf-8"><style>' +
    css +
    "\nhtml,body{margin:0;background:#ffffff;color:#000000;width:" +
    cell * columns +
    "px}" +
    "body{display:grid;grid-template-columns:repeat(" +
    columns +
    "," +
    cell +
    "px);grid-auto-rows:" +
    cell +
    "px}" +
    ".cell{display:flex;align-items:center;justify-content:center;width:" +
    cell +
    "px;height:" +
    cell +
    "px}" +
    ".miaixz-icon{--miaixz-icon-size:" +
    size +
    "px;--miaixz-icon-fill:" +
    fill +
    ";--miaixz-icon-opsz:" +
    size +
    "}" +
    ".refinement-source,.refinement-source svg{display:block;width:100%;height:100%}" +
    '.refinement-source[data-miaixz-icon-mirror="true"]:dir(rtl){transform:scaleX(-1)}' +
    "</style></head><body>" +
    content +
    "</body></html>"
  );
}

/**
 * Rejects incomplete, stale, reordered or duplicate geometry evidence before native coverage.
 * @param input - Same-invocation measurements, identities and current byte digests.
 * @returns Completion only when every prescribed axis state has been measured and passed.
 */
export function validateGeometryEvidence({ evidence, icons, fontSha256, sourceDigest }) {
  const expectedStates = new Set(
    [12, 16, 20, 24, 32, 40].flatMap((size) =>
      [0, 0.25, 0.5, 0.75, 1].map((fill) => size + "|" + fill),
    ),
  );
  if (
    !evidence ||
    evidence.status !== "passed" ||
    evidence.fontSha256 !== fontSha256 ||
    evidence.sourceSha256 !== sourceDigest ||
    !Array.isArray(evidence.glyphs) ||
    evidence.glyphs.length !== icons.length
  )
    throw new Error("Complete current source/font geometry evidence is required.");
  for (const [index, glyph] of evidence.glyphs.entries()) {
    if (
      glyph.name !== icons[index].name ||
      glyph.status !== "passed" ||
      !Array.isArray(glyph.states) ||
      glyph.states.length !== expectedStates.size
    )
      throw new Error("Geometry evidence has a missing, failed or reordered glyph.");
    const seen = new Set();
    for (const state of glyph.states) {
      const key = state.opticalSize + "|" + state.fill,
        moments = state.outlineMoments;
      if (
        !expectedStates.has(key) ||
        seen.has(key) ||
        state.status !== "passed" ||
        !moments ||
        !Number.isFinite(moments.areaRelativeError) ||
        !Number.isFinite(moments.centroidDistancePixels) ||
        moments.areaRelativeError < 0 ||
        moments.centroidDistancePixels < 0
      )
        throw new Error("Geometry evidence has missing, duplicate, illegal or unmeasured states.");
      seen.add(key);
    }
  }
}

/**
 * Renders the complete native matrix after current independent geometry has passed.
 * @param input - Actual release font directory and optional same-invocation geometry evidence.
 * @returns Current in-memory measurements; never writes a report or screenshot.
 */
export async function renderCatalog({ fontDir, geometry = null }) {
  const source = await loadIconSource(),
    fontSource = await inspectFontSource({ fontsRoot });
  const matrix = visualMatrix(source.icons),
    samples = [],
    tools = [],
    errors = [];
  let firstFailurePrinted = false;
  const font = await readFile(resolve(fontDir, "miaixz-icons.woff2"));
  const evidence = geometry ?? (await validateRefinedFont()),
    sourceDigest = await sourceSha256();
  validateGeometryEvidence({ evidence, icons: source.icons, fontSha256: hash(font), sourceDigest });
  const css = (await readFile(resolve(packageRoot, "dist/styles.css"), "utf8")).replace(
    /url\([^)]*miaixz-icons\.woff2[^)]*\)/gu,
    'url("data:font/woff2;base64,' + font.toString("base64") + '")',
  );
  if (!css.includes("data:font/woff2;base64,"))
    throw new Error("Production font URL was not found.");
  const entries = [
    ...source.icons.map((i) => ({ ...i, direction: "ltr" })),
    ...source.icons.filter((i) => i.rtl === "mirror").map((i) => ({ ...i, direction: "rtl" })),
  ];
  const compatible = new Map();
  for (const icon of source.icons)
    compatible.set(
      icon.name,
      compatibleSourceContours({
        source: fontSource,
        glyphName: "miaixz." + icon.name,
      }),
    );
  for (const browserName of matrix.browsers) {
    let browser;
    try {
      browser = await browserTypes[browserName].launch({ headless: true });
      tools.push({ name: browserName, version: browser.version() });
      for (const dpr of matrix.dprs) {
        const browserContext = await browser.newContext({
          deviceScaleFactor: dpr,
          viewport: { width: 1440, height: 1000 },
        });
        const page = await browserContext.newPage();
        try {
          for (const size of matrix.opticalSizes)
            for (const fill of matrix.fills) {
              const sourceGlyphs = entries.map((icon) =>
                interpolateIconSource({
                  source: fontSource,
                  glyphName: "miaixz." + icon.name,
                  fill,
                  opticalSize: size,
                  compatible: compatible.get(icon.name),
                }),
              );
              const sourcePaths = sourceGlyphs.map(sourceSvg),
                references = entries.map((icon, i) =>
                  referencePixelRegions({
                    contours: sourceGlyphs[i].contours,
                    size,
                    dpr,
                    mirror: icon.rtl === "mirror" && icon.direction === "rtl",
                    rules: source.design.visual.comparison,
                    unitsPerEm: source.design.font.unitsPerEm,
                  }),
                );
              const sheets = [],
                cell = size + 2 * source.design.visual.comparison.paddingCssPixels;
              await page.setViewportSize({
                width: 32 * cell,
                height: Math.ceil(entries.length / 32) * cell,
              });
              for (const layer of ["source", "font"]) {
                await page.setContent(
                  surface({
                    entries,
                    sourcePaths,
                    css,
                    size,
                    fill,
                    padding: source.design.visual.comparison.paddingCssPixels,
                    layer,
                  }),
                );
                await page.evaluate(
                  async ({ family, size, glyph }) => {
                    const faces = await document.fonts.load(size + 'px "' + family + '"', glyph);
                    if (!faces.length) throw new Error("Actual release font face is absent.");
                    await document.fonts.ready;
                    if (!document.fonts.check(size + 'px "' + family + '"', glyph))
                      throw new Error("Actual release font did not load.");
                    await new Promise((done) =>
                      requestAnimationFrame(() => requestAnimationFrame(done)),
                    );
                  },
                  {
                    family: source.design.font.familyName,
                    size,
                    glyph: String.fromCodePoint(source.icons[0].codepoint),
                  },
                );
                sheets.push(
                  coverageRaster(
                    PNG.sync.read(
                      await page.screenshot({
                        fullPage: false,
                      }),
                    ),
                  ),
                );
              }
              const [sourceSheet, fontSheet] = sheets;
              const width = 32 * cell * dpr,
                height = Math.ceil(entries.length / 32) * cell * dpr;
              if (sheets.some((s) => s.width !== width || s.height !== height))
                throw new Error(
                  "Actual contact-sheet dimensions " +
                    sheets.map((s) => s.width + "x" + s.height).join(", ") +
                    " differ from " +
                    width +
                    "x" +
                    height +
                    ".",
                );
              for (const [i, entry] of entries.entries()) {
                const sample = {
                  name: entry.name,
                  opticalSize: size,
                  fill,
                  browser: browserName,
                  dpr,
                  direction: entry.direction,
                };
                const a = cropRaster(sourceSheet, i, cell * dpr),
                  b = cropRaster(fontSheet, i, cell * dpr);
                const metrics = compareReferenceCoverage(
                    a,
                    b,
                    references[i],
                    source.design.visual.comparison,
                  ),
                  failures = referenceRasterFailures(
                    metrics,
                    source.design.visual.comparison,
                    visualSampleKey(sample),
                  );
                if (failures.length && !firstFailurePrinted) {
                  console.error(
                    JSON.stringify({ firstFailedSample: sample, metrics, errors: failures }),
                  );
                  firstFailurePrinted = true;
                }
                samples.push({
                  ...sample,
                  sourceRasterSha256: hash(a.data),
                  fontRasterSha256: hash(b.data),
                  metrics,
                  status: failures.length ? "failed" : "passed",
                  errors: failures,
                });
              }
              process.stdout.write(
                "Rendered " +
                  browserName +
                  " DPR " +
                  dpr +
                  " size " +
                  size +
                  " FILL " +
                  fill +
                  ".\n",
              );
            }
        } finally {
          await browserContext.close();
        }
      }
    } catch (cause) {
      errors.push(error("RENDER_FAILURE", browserName + ": " + cause.message));
      console.error("Render failed in " + browserName + ": " + cause.message);
    } finally {
      if (browser) await browser.close();
    }
  }
  if (
    (await sourceSha256()) !== sourceDigest ||
    hash(await readFile(resolve(fontDir, "miaixz-icons.woff2"))) !== hash(font)
  )
    errors.push(error("INPUT_CHANGED", "Current source or font changed during native coverage."));
  errors.push(...validateVisualCoverage({ icons: source.icons, matrix, samples }));
  const failed = samples.filter((sample) => sample.status !== "passed").length;
  const failedNames = [
    ...new Set(samples.filter((sample) => sample.status !== "passed").map((sample) => sample.name)),
  ].sort();
  if (errors.length || failed) {
    console.error(
      JSON.stringify({
        errorCount: errors.length,
        firstErrors: errors.slice(0, 25),
        failedSamples: failed,
        failedNames: failedNames.length,
        firstFailedSamples: samples.filter((sample) => sample.status !== "passed").slice(0, 25),
      }),
    );
  }
  console.log(
    "Checked " +
      samples.length +
      " / " +
      matrix.totalPairs +
      " source/font pairs; failed=" +
      failed +
      ". No screenshots or reports saved.",
  );
  return {
    status: errors.length || failed ? "failed" : "passed",
    matrix,
    samples,
    errors,
    tools,
    failedNames,
  };
}

/**
 * Parses the retained exact render entry point.
 * @param args - Exact CLI argument vector.
 * @returns Validated release font directory.
 */
export function parseArguments(args) {
  if (args.length !== 4 || args[0] !== "--font-dir" || args[2] !== "--browser" || args[3] !== "all")
    throw new Error("Expected --font-dir <directory> --browser all.");
  return { fontDir: resolve(repositoryRoot, args[1]) };
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const report = await renderCatalog(parseArguments(process.argv.slice(2)));
  if (report.status !== "passed") process.exitCode = 1;
}

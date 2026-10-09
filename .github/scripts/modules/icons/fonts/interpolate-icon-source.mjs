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
 * Independently interpolates six GLIF masters; never reads compiled font outlines.
 */
import {
  contourSegments,
  evaluateSegment,
  expandGlyphContours,
  measureGlyph,
} from "./font-geometry.mjs";

/**
 * Computes the six tensor-product interpolation weights, without clamping invalid axes.
 * @param {number} fill FILL in [0,1].
 * @param {number} opticalSize opsz in [12,40].
 * @returns {Map<string,number>} Ordered weights matching the six source combinations.
 */
export function sourceWeights(fill, opticalSize) {
  if (
    !Number.isFinite(fill) ||
    fill < 0 ||
    fill > 1 ||
    !Number.isFinite(opticalSize) ||
    opticalSize < 12 ||
    opticalSize > 40
  )
    throw new Error("Source axes must be finite: FILL in [0,1], opsz in [12,40].");
  const optical =
    opticalSize <= 24
      ? {
          compact: (24 - opticalSize) / 12,
          standard: (opticalSize - 12) / 12,
          display: 0,
        }
      : {
          compact: 0,
          standard: (40 - opticalSize) / 16,
          display: (opticalSize - 24) / 16,
        };
  return new Map(
    ["outline", "filled"].flatMap((variant) =>
      ["compact", "standard", "display"].map((size) => [
        variant + "-" + size,
        (variant === "outline" ? 1 - fill : fill) * optical[size],
      ]),
    ),
  );
}

/**
 * Maps exact master coordinates to a refinement key; filenames are not parsed.
 * @param {object} master Structured source master.
 * @returns {string} Exact six-master key.
 */
export function sourceMasterName(master) {
  if (![0, 1].includes(master?.location?.FILL) || ![12, 24, 40].includes(master?.location?.opsz))
    throw new Error("Invalid source master coordinate.");
  return (
    (master.location.FILL === 0 ? "outline-" : "filled-") +
    { 12: "compact", 24: "standard", 40: "display" }[master.location.opsz]
  );
}

/**
 * Integrates signed contour area exactly with three-point Gaussian quadrature.
 * @param {object} contour Closed source contour.
 * @returns {number} Signed area; reversed holes keep their negative sign.
 */
export function contourSignedArea(contour) {
  let area = 0;
  const nodes = [(1 - Math.sqrt(3 / 5)) / 2, 0.5, (1 + Math.sqrt(3 / 5)) / 2],
    weights = [5 / 18, 4 / 9, 5 / 18];
  for (const segment of contourSegments(contour)) {
    const degree = segment.length - 1;
    const derivative = segment
      .slice(1)
      .map((p, i) => p.map((v, a) => (v - segment[i][a]) * degree));
    for (let i = 0; i < 3; i++) {
      const p = evaluateSegment(segment, nodes[i]);
      /**
       * A line has a constant derivative rather than another Bézier segment.
       */
      const d = derivative.length === 1 ? derivative[0] : evaluateSegment(derivative, nodes[i]);
      area += (weights[i] * (p[0] * d[1] - p[1] * d[0])) / 2;
    }
  }
  if (!Number.isFinite(area)) throw new Error("Nonfinite contour area.");
  return area;
}

/**
 * Verifies six raw topologies before expanding components and interpolating points.
 * @param {{source:object,glyphName:string}} input Structured reader output and internal glyph name.
 * @returns {Map<string,object[]>} Compatible expanded masters; original order is retained.
 */
export function compatibleSourceContours({ source, glyphName }) {
  if (
    !Array.isArray(source?.masters) ||
    source.masters.length !== 6 ||
    !Array.isArray(source.rawMasters) ||
    source.rawMasters.length !== 6
  )
    throw new Error("Six structured source maps are required.");
  const result = new Map();
  let topology = null,
    expandedTopology = null,
    orientation = null;
  for (let i = 0; i < 6; i++) {
    const master = sourceMasterName(source.masters[i]),
      glyph = source.rawMasters[i].get(glyphName);
    if (result.has(master) || !glyph)
      throw new Error("Duplicate master or missing glyph: " + master + "/" + glyphName);
    if (topology !== null && glyph.topologySignature !== topology)
      throw new Error("Incompatible raw topology: " + master + "/" + glyphName);
    topology = glyph.topologySignature;
    const contours = expandGlyphContours({
      glyphName,
      glyphs: source.rawMasters[i],
    });
    const signature = JSON.stringify(
      contours.map((c) => c.points.map((p) => [p.type, p.smooth, p.name])),
    );
    if (expandedTopology !== null && expandedTopology !== signature)
      throw new Error("Incompatible expanded topology: " + master + "/" + glyphName);
    expandedTopology = signature;
    const signs = contours.map((c) => Math.sign(contourSignedArea(c)));
    if (
      signs.some((s) => s === 0) ||
      (orientation !== null && signs.some((s, j) => s !== orientation[j]))
    )
      throw new Error(
        "Degenerate contour or incompatible hole orientation: " + master + "/" + glyphName,
      );
    orientation = signs;
    result.set(master, contours);
  }
  return result;
}

/**
 * Interpolates coordinates from raw six-master points at a validated axis position.
 * @param {{source:object,glyphName:string,fill:number,opticalSize:number,compatible?:Map<string,object[]>}} input Source and requested axes.
 * @returns {object} Interpolated ordered contours and exact measurements.
 */
export function interpolateIconSource({ source, glyphName, fill, opticalSize, compatible }) {
  const weights = sourceWeights(fill, opticalSize);
  const masters = compatible ?? compatibleSourceContours({ source, glyphName });
  if (masters.size !== 6 || [...weights.keys()].some((k) => !masters.has(k)))
    throw new Error("Incomplete compatible source set.");
  const reference = masters.get("outline-standard");
  const contours = reference.map((contour, c) => ({
    closed: true,
    outlineIndex: c,
    points: contour.points.map((point, p) => ({
      ...point,
      x: [...weights].reduce((sum, [master, w]) => sum + masters.get(master)[c].points[p].x * w, 0),
      y: [...weights].reduce((sum, [master, w]) => sum + masters.get(master)[c].points[p].y * w, 0),
    })),
  }));
  for (let c = 0; c < contours.length; c++) {
    const sign = Math.sign(contourSignedArea(contours[c]));
    if (sign === 0 || sign !== Math.sign(contourSignedArea(reference[c])))
      throw new Error("Interpolated contour collapses or reverses a hole: " + glyphName);
  }
  const measurement = measureGlyph({
    glyphName,
    glyphs: new Map([[glyphName, { contours, components: [] }]]),
  });
  return { glyphName, fill, opticalSize, contours, measurement };
}

/**
 * Serializes an interpolated source as a 24-unit SVG path with the production baseline.
 * @param {object} glyph Interpolated glyph contours.
 * @returns {string} Escaped numeric SVG path data, not an external graphic.
 */
export function sourceSvgPath(glyph) {
  const position = (p) => p.map((v, a) => (a === 0 ? v : 800 - v) / 40).join(" ");
  return glyph.contours
    .map((contour) => {
      const segments = contourSegments(contour);
      return (
        "M" +
        position(segments[0][0]) +
        segments
          .map(
            (segment) =>
              ({ 2: "L", 3: "Q", 4: "C" })[segment.length] +
              segment.slice(1).map(position).join(" "),
          )
          .join("") +
        "Z"
      );
    })
    .join("");
}

/**
 * Creates a diagnostic source SVG; runtime never ships or imports this representation.
 * @param {object} glyph Interpolated source glyph.
 * @returns {string} Complete transparent 24x24 SVG.
 */
export function sourceSvg(glyph) {
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#000000" fill-rule="nonzero" d="' +
    sourceSvgPath(glyph) +
    '"/></svg>'
  );
}

/**
 * Determines actual axis behavior by comparing six compatible source point coordinates.
 * @param {Map<string,object[]>} masters Compatible expanded source contours.
 * @returns {{fill:string,opticalSize:string}} Measured changes or constant behavior.
 */
export function measureSourceAxisBehavior(masters) {
  const coordinates = (master) =>
    JSON.stringify(masters.get(master).map((c) => c.points.map((p) => [p.x, p.y])));
  const fill = ["compact", "standard", "display"].some(
    (size) => coordinates("outline-" + size) !== coordinates("filled-" + size),
  );
  const opticalSize = ["outline", "filled"].some(
    (variant) =>
      coordinates(variant + "-compact") !== coordinates(variant + "-standard") ||
      coordinates(variant + "-standard") !== coordinates(variant + "-display"),
  );
  return {
    fill: fill ? "changes" : "constant",
    opticalSize: opticalSize ? "changes" : "constant",
  };
}

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
 * Measures expanded glyph curves and checks optical-class constraint feasibility.
 *
 * Rejects nonfinite metric values before they enter geometric calculations.
 * @param {number} value Numeric value to validate.
 * @param label Source path or metric used in diagnostics.
 * @returns {number} The unchanged finite value.
 */
const finite = (value, label) => {
  if (!Number.isFinite(value)) throw new Error(label + " must be finite.");
  return value;
};

/**
 * Solves a quadratic derivative, reducing degenerate equations to a linear case.
 * @param {number} a Quadratic coefficient in a*t*t + b*t + c.
 * @param {number} b Linear coefficient.
 * @param {number} c Constant coefficient.
 * @returns {number[]} Real roots; callers select roots inside the segment interval.
 */
function roots(a, b, c) {
  const scale = Math.max(Math.abs(a), Math.abs(b), Math.abs(c));
  if (scale === 0) return [];
  finite(scale, "Derivative scale");
  a /= scale;
  b /= scale;
  c /= scale;
  if (Math.abs(a) <= 1e-12) return Math.abs(b) <= 1e-12 ? [] : [-c / b];
  let discriminant = b * b - 4 * a * c;
  if (discriminant < -1e-12) return [];
  if (discriminant < 0) discriminant = 0;
  const q = -0.5 * (b + (b < 0 ? -1 : 1) * Math.sqrt(discriminant));
  return q === 0 ? [-b / (2 * a)] : [q / a, c / q];
}

/**
 * Applies an affine transformation to a point.
 * @param {{x:number,y:number}} point Source point in font units.
 * @param {number[]} matrix Affine coefficients [xx, xy, yx, yy, dx, dy].
 * @returns {number[]} Transformed [x, y] coordinates in font units.
 */
function pointAt(point, matrix) {
  return [
    finite(matrix[0] * point.x + matrix[2] * point.y + matrix[4], "Transformed x"),
    finite(matrix[1] * point.x + matrix[3] * point.y + matrix[5], "Transformed y"),
  ];
}

/**
 * Composes a parent transform with a component transform.
 * @param {number[]} a Parent affine transform in UFO coefficient order.
 * @param {number[]} b Component affine transform applied before the parent.
 * @returns {number[]} Composed affine coefficients in the same order.
 */
function compose(a, b) {
  if (
    !Array.isArray(b) ||
    b.length !== 6 ||
    b.some((v) => !Number.isFinite(v)) ||
    !Number.isFinite(b[0] * b[3] - b[1] * b[2]) ||
    b[0] * b[3] - b[1] * b[2] === 0
  )
    throw new Error("Component transform must be finite and invertible.");
  return [
    a[0] * b[0] + a[2] * b[1],
    a[1] * b[0] + a[3] * b[1],
    a[0] * b[2] + a[2] * b[3],
    a[1] * b[2] + a[3] * b[3],
    a[0] * b[4] + a[2] * b[5] + a[4],
    a[1] * b[4] + a[3] * b[5] + a[5],
  ].map((v) => finite(v, "Composed transform"));
}

/**
 * Integrates oriented outline area and first moments without browser antialiasing.
 * Five-point Gaussian quadrature is exact for the degree-eight cubic moment integrands.
 * Opposing holes subtract; overlapping contours retain their winding multiplicity.
 * This is an outline integral, not the nonzero-winding union area or screenshot coverage.
 * @param {object[]} contours Closed expanded line, quadratic or cubic contours.
 * @returns {{area:number,centroid:number[]}} Absolute oriented area and font-unit centroid.
 */
export function measureOutlineMoments(contours) {
  if (!Array.isArray(contours) || !contours.length)
    throw new Error("Outline moments require nonempty closed contours.");
  const outer = Math.sqrt(5 + 2 * Math.sqrt(10 / 7)) / 3,
    inner = Math.sqrt(5 - 2 * Math.sqrt(10 / 7)) / 3,
    nodes = [(1 - outer) / 2, (1 - inner) / 2, 0.5, (1 + inner) / 2, (1 + outer) / 2],
    weights = [
      (322 - 13 * Math.sqrt(70)) / 1800,
      (322 + 13 * Math.sqrt(70)) / 1800,
      128 / 450,
      (322 + 13 * Math.sqrt(70)) / 1800,
      (322 - 13 * Math.sqrt(70)) / 1800,
    ];
  const origin = [contours[0].points?.[0]?.x, contours[0].points?.[0]?.y];
  if (origin.some((v) => !Number.isFinite(v))) throw new Error("Nonfinite outline origin.");
  let area = 0,
    mx = 0,
    my = 0;
  for (const contour of contours) {
    if (!contour.closed) throw new Error("Outline moments require closed contours.");
    for (const raw of contourSegments(contour)) {
      const segment = raw.map((p) => p.map((v, axis) => finite(v - origin[axis], "Outline point"))),
        degree = segment.length - 1,
        derivative = segment
          .slice(1)
          .map((p, i) => p.map((v, axis) => degree * (v - segment[i][axis])));
      for (let i = 0; i < nodes.length; i++) {
        const [x, y] = evaluateSegment(segment, nodes[i]),
          [dx, dy] =
            derivative.length === 1 ? derivative[0] : evaluateSegment(derivative, nodes[i]),
          weight = weights[i] / 2;
        area += weight * (x * dy - y * dx);
        mx += weight * x * x * dy;
        my -= weight * y * y * dx;
      }
    }
  }
  if (!Number.isFinite(area) || !Number.isFinite(mx) || !Number.isFinite(my) || area === 0)
    throw new Error("Outline moments require finite nonzero oriented area.");
  return {
    area: Math.abs(area),
    centroid: [
      finite(origin[0] + mx / area, "Outline centroid"),
      finite(origin[1] + my / area, "Outline centroid"),
    ],
  };
}

/**
 * Integrates actual nonzero-winding ink on bounded flattened curves.
 * Vertex and crossing ordinates partition scanlines into constant edge-order intervals.
 * Two-point Gaussian integration exactly measures polygon union area and first moments.
 * Oppositely oriented separated parts cannot cancel; genuine opposing overlap and holes do.
 * @param {object[]} contours Closed expanded source or compiled contours.
 * @param {number} tolerance Proven curve subdivision bound in font units.
 * @returns {{area:number,centroid:number[],subdivisionErrorUnits:number}} Nonzero-winding ink moments.
 */
export function measureInkMoments(contours, tolerance) {
  if (!Array.isArray(contours) || !contours.length || contours.some((c) => !c.closed))
    throw new Error("Ink moments require nonempty closed contours.");
  const flattened = flattenGlyphContours(contours, tolerance),
    origin = flattened.contours[0][0],
    edges = flattened.contours
      .flatMap((polygon) =>
        polygon.slice(1).map((point, index) => {
          const a = polygon[index].map((v, axis) => v - origin[axis]),
            b = point.map((v, axis) => v - origin[axis]);
          return {
            a,
            b,
            minY: Math.min(a[1], b[1]),
            maxY: Math.max(a[1], b[1]),
            minX: Math.min(a[0], b[0]),
            maxX: Math.max(a[0], b[0]),
          };
        }),
      )
      .filter((edge) => edge.minY !== edge.maxY),
    events = new Set(edges.flatMap((edge) => [edge.minY, edge.maxY]));
  let active = [];
  for (const edge of edges.slice().sort((a, b) => a.minY - b.minY)) {
    active = active.filter((other) => other.maxY > edge.minY);
    const [a, b] = [edge.a, edge.b],
      dx = b[0] - a[0],
      dy = b[1] - a[1];
    for (const other of active) {
      if (other.maxX < edge.minX || other.minX > edge.maxX) continue;
      const [c, d] = [other.a, other.b],
        ex = d[0] - c[0],
        ey = d[1] - c[1],
        determinant = dx * ey - dy * ex;
      if (determinant === 0) continue;
      const cx = c[0] - a[0],
        cy = c[1] - a[1],
        t = (cx * ey - cy * ex) / determinant,
        u = (cx * dy - cy * dx) / determinant;
      if (t > 0 && t < 1 && u > 0 && u < 1) events.add(a[1] + t * dy);
    }
    active.push(edge);
  }
  const ordinates = [...events].sort((a, b) => a - b);
  let area = 0,
    mx = 0,
    my = 0;
  for (let interval = 1; interval < ordinates.length; interval++) {
    const lo = ordinates[interval - 1],
      hi = ordinates[interval],
      half = (hi - lo) / 2,
      middle = (hi + lo) / 2,
      crossingEdges = edges.filter((edge) => edge.minY <= lo && edge.maxY >= hi);
    for (const y of [middle - half / Math.sqrt(3), middle + half / Math.sqrt(3)]) {
      const crossings = crossingEdges
        .map(({ a, b }) => [
          a[0] + ((y - a[1]) * (b[0] - a[0])) / (b[1] - a[1]),
          b[1] > a[1] ? 1 : -1,
        ])
        .sort((a, b) => a[0] - b[0]);
      let winding = 0,
        lastX = 0;
      for (const [x, direction] of crossings) {
        if (winding !== 0) {
          const width = x - lastX;
          area += half * width;
          mx += (half * width * (x + lastX)) / 2;
          my += half * width * y;
        }
        winding += direction;
        lastX = x;
      }
      if (winding !== 0) throw new Error("Ink contour scanline is not closed.");
    }
  }
  if (!Number.isFinite(area) || area <= 0 || !Number.isFinite(mx) || !Number.isFinite(my))
    throw new Error("Ink moments require finite positive nonzero-winding area.");
  return {
    area,
    centroid: [origin[0] + mx / area, origin[1] + my / area],
    subdivisionErrorUnits: flattened.errorBound,
  };
}

/**
 * Measures a complete glyph after recursively expanding same-master components.
 * @param {{glyphName:string, glyphs:Map<string, any>}} input Structured glyph input.
 * @returns {{bounds:number[]|null,width:number,height:number,longestEdge:number,aspectRatio:number|null,center:number[]|null,nonEmpty:boolean}} Exact metrics.
 */
export function measureGlyph({ glyphName, glyphs }) {
  if (!(glyphs instanceof Map)) throw new TypeError("glyphs must be a Map.");
  const bounds = [Infinity, Infinity, -Infinity, -Infinity];
  let nonEmpty = false;
  const active = new Set();
  /**
   * Adds one finite curve point to the measured bounds.
   * @param {number[]} p Curve position [x, y] in font units.
   * @returns {void} Updates the bounding box and marks the glyph nonempty.
   */
  function include(p) {
    finite(p[0], "Curve x");
    finite(p[1], "Curve y");
    bounds[0] = Math.min(bounds[0], p[0]);
    bounds[1] = Math.min(bounds[1], p[1]);
    bounds[2] = Math.max(bounds[2], p[0]);
    bounds[3] = Math.max(bounds[3], p[1]);
    nonEmpty = true;
  }
  /**
   * Includes endpoints and exact internal Bézier extrema.
   * @param {number[][]} points Endpoints and controls for a line, quadratic, or cubic segment.
   * @returns {void} Expands the bounding box with endpoints and internal extrema.
   */
  function segment(points) {
    include(points[0]);
    include(points.at(-1));
    for (const axis of [0, 1]) {
      let candidates = [];
      if (points.length === 3) {
        const [p0, p1, p2] = points.map((p) => p[axis]);
        candidates = roots(0, 2 * (p0 - 2 * p1 + p2), 2 * (p1 - p0));
      } else if (points.length === 4) {
        const [p0, p1, p2, p3] = points.map((p) => p[axis]);
        candidates = roots(3 * (-p0 + 3 * p1 - 3 * p2 + p3), 6 * (p0 - 2 * p1 + p2), 3 * (p1 - p0));
      }
      for (const t of candidates)
        if (t > 0 && t < 1) {
          const work = points.map((p) => [...p]);
          for (let count = work.length - 1; count > 0; count--)
            for (let j = 0; j < count; j++)
              work[j] = [
                work[j][0] * (1 - t) + work[j + 1][0] * t,
                work[j][1] * (1 - t) + work[j + 1][1] * t,
              ];
          include(work[0]);
        }
    }
  }
  /**
   * Computes the implicit on-curve midpoint between two quadratic control points.
   *
   * @param a - First transformed [x, y] coordinate.
   * @param b - Second transformed [x, y] coordinate.
   * @returns Midpoint [x, y] in font units.
   */
  const midpoint = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  /**
   * Measures a closed contour including implicit quadratic points.
   * @param {object} value Closed GLIF contour with ordered point records.
   * @param {number[]} matrix Affine transform in UFO coefficient order.
   * @returns {void} Adds every contour segment to the glyph bounding box.
   */
  function contour(value, matrix) {
    if (!value.closed) throw new Error(glyphName + " has an open contour.");
    const points = value.points;
    if (!Array.isArray(points) || points.length === 0) throw new Error("Empty contour.");
    for (const p of points) {
      finite(p.x, "Point x");
      finite(p.y, "Point y");
      if (!["line", "curve", "qcurve", "offcurve"].includes(p.type))
        throw new Error("Invalid segment type: " + p.type);
    }
    const transformed = points.map((p) => pointAt(p, matrix));
    const start = points.findIndex((p) => p.type !== "offcurve");
    if (start === -1) {
      for (let i = 0; i < points.length; i++)
        segment([
          midpoint(transformed[(i + points.length - 1) % points.length], transformed[i]),
          transformed[i],
          midpoint(transformed[i], transformed[(i + 1) % points.length]),
        ]);
      return;
    }
    let previous = transformed[start],
      controls = [];
    for (let step = 1; step <= points.length; step++) {
      const index = (start + step) % points.length,
        point = transformed[index],
        type = points[index].type;
      if (type === "offcurve") {
        controls.push(point);
        continue;
      }
      if (type === "line") {
        if (controls.length) throw new Error("Line segment has off-curve controls.");
        segment([previous, point]);
      } else if (type === "curve") {
        if (controls.length !== 2) throw new Error("Cubic segment requires two controls.");
        segment([previous, ...controls, point]);
      } else {
        if (!controls.length) segment([previous, point]);
        for (let i = 0; i < controls.length; i++) {
          const end = i === controls.length - 1 ? point : midpoint(controls[i], controls[i + 1]);
          segment([previous, controls[i], end]);
          previous = end;
        }
      }
      previous = point;
      controls = [];
    }
  }
  /**
   * Recursively measures same-master component outlines.
   * @param {string} name Glyph name resolved in the current master's glyph map.
   * @param {number[]} matrix Accumulated component transform.
   * @returns {void} Includes the glyph and its components; rejects cycles or missing glyphs.
   */
  function expand(name, matrix) {
    if (active.has(name)) throw new Error("Component cycle: " + [...active, name].join(" -> "));
    const glyph = glyphs.get(name);
    if (!glyph) throw new Error("Missing component glyph: " + name);
    active.add(name);
    for (const c of glyph.contours ?? []) contour(c, matrix);
    for (const c of glyph.components ?? []) expand(c.base, compose(matrix, c.transform));
    active.delete(name);
  }
  expand(glyphName, [1, 0, 0, 1, 0, 0]);
  if (!nonEmpty)
    return {
      bounds: null,
      width: 0,
      height: 0,
      longestEdge: 0,
      aspectRatio: null,
      center: null,
      nonEmpty: false,
    };
  const width = finite(bounds[2] - bounds[0], "Width"),
    height = finite(bounds[3] - bounds[1], "Height");
  return {
    bounds,
    width,
    height,
    longestEdge: Math.max(width, height),
    aspectRatio: height === 0 ? null : finite(width / height, "Aspect ratio"),
    center: [
      finite((bounds[0] + bounds[2]) / 2, "Center x"),
      finite((bounds[1] + bounds[3]) / 2, "Center y"),
    ],
    nonEmpty: true,
  };
}

/**
 * Validates measured metrics without applying unconfigured numerical slack.
 * @param {{measurement:any,opticalClass:string,design:any}} input Metrics and design.
 * @returns {{centerDistance:number|null,violations:any[]}} Ordered diagnostics.
 */
export function validateGlyphGeometry({ measurement: m, opticalClass, design, exceptions = [] }) {
  const rule = design.opticalClasses[opticalClass];
  if (!rule) throw new Error("Unknown optical class: " + opticalClass);
  const violations = [],
    lengthTolerance = design.grid.lengthTolerance;
  const reviewed = validateGeometryExceptions(exceptions);
  /**
   * Appends one optical-class violation to the ordered diagnostics.
   *
   * @param metric - Metric whose constraint failed.
   * @param actual - Measured value that violated the constraint.
   * @param expected - Required value, interval, or diagnostic expectation.
   * @param tolerance - Numerical slack explicitly allowed for this metric.
   * @returns New number of recorded violations.
   */
  const add = (metric, actual, expected, tolerance = 0) =>
    violations.push({ metric, actual, expected, tolerance });
  if (!m.nonEmpty || !(m.width > 0) || !(m.height > 0))
    add(
      "nonEmpty",
      { nonEmpty: m.nonEmpty, width: m.width, height: m.height },
      "closed nonempty outline with positive width and height",
    );
  if (m.bounds) {
    const [l, b, r, t] = design.grid.safeBounds;
    if (m.bounds[0] < l || m.bounds[1] < b || m.bounds[2] > r || m.bounds[3] > t)
      add("safeBounds", m.bounds, design.grid.safeBounds);
  }
  for (const metric of ["longestEdge"]) {
    const tolerance = reviewed.has(metric + "|") ? 0 : lengthTolerance;
    const actual = m[metric],
      expected = reviewed.get(metric + "|")?.allowed ?? rule[metric];
    if (
      actual === null ||
      !Number.isFinite(actual) ||
      actual < expected[0] - tolerance ||
      actual > expected[1] + tolerance
    )
      add(metric, actual, expected, tolerance);
  }
  const centerDistance = m.center
    ? Math.hypot(
        m.center[0] - design.grid.opticalCenter[0],
        m.center[1] - design.grid.opticalCenter[1],
      )
    : null;
  const centerRange = reviewed.get("centerDistance|")?.allowed ?? [0, rule.centerTolerance];
  if (
    centerDistance === null ||
    !Number.isFinite(centerDistance) ||
    centerDistance < centerRange[0] ||
    centerDistance > centerRange[1]
  )
    add("centerDistance", centerDistance, centerRange);
  return { centerDistance, violations };
}

/**
 * Converts a closed GLIF contour to ordered Bézier segments, including implied quadratic points.
 * @param {object} contour Ordered GLIF point records.
 * @returns {number[][][]} Each segment's endpoints and controls in font coordinates.
 */
export function contourSegments(contour) {
  if (!contour?.closed || !Array.isArray(contour.points) || !contour.points.length)
    throw new Error("A nonempty closed contour is required.");
  const points = contour.points;
  const coordinates = points.map((p) => {
    if (!["line", "curve", "qcurve", "offcurve"].includes(p.type))
      throw new Error("Invalid segment type: " + p.type);
    return [finite(p.x, "Point x"), finite(p.y, "Point y")];
  });
  const midpoint = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const start = points.findIndex((p) => p.type !== "offcurve");
  if (start < 0)
    return coordinates.map((p, i) => [
      midpoint(coordinates[(i + points.length - 1) % points.length], p),
      p,
      midpoint(p, coordinates[(i + 1) % points.length]),
    ]);
  const segments = [];
  let previous = coordinates[start],
    controls = [];
  for (let step = 1; step <= points.length; step++) {
    const i = (start + step) % points.length,
      p = coordinates[i],
      type = points[i].type;
    if (type === "offcurve") {
      controls.push(p);
      continue;
    }
    if (type === "line") {
      if (controls.length) throw new Error("Line segment has off-curve controls.");
      segments.push([previous, p]);
    } else if (type === "curve") {
      if (controls.length !== 2) throw new Error("Cubic segment requires two controls.");
      segments.push([previous, ...controls, p]);
    } else if (!controls.length) {
      segments.push([previous, p]);
    } else {
      for (let j = 0; j < controls.length; j++) {
        const end = j === controls.length - 1 ? p : midpoint(controls[j], controls[j + 1]);
        segments.push([previous, controls[j], end]);
        previous = end;
      }
    }
    previous = p;
    controls = [];
  }
  return segments;
}

/**
 * Evaluates a line, quadratic or cubic using de Casteljau interpolation.
 * @param {number[][]} segment Ordered endpoints and controls.
 * @param {number} t Parameter in the closed interval [0,1].
 * @returns {number[]} Finite position [x,y].
 */
export function evaluateSegment(segment, t) {
  if (!Number.isFinite(t) || t < 0 || t > 1 || ![2, 3, 4].includes(segment?.length))
    throw new Error("Invalid Bézier sample.");
  const work = segment.map((p) => [finite(p[0], "Sample x"), finite(p[1], "Sample y")]);
  for (let n = work.length - 1; n > 0; n--)
    for (let i = 0; i < n; i++)
      work[i] = work[i].map((v, axis) =>
        finite(v * (1 - t) + work[i + 1][axis] * t, "Sample coordinate"),
      );
  return work[0];
}

/**
 * Expands same-master components without changing child or point order.
 * @param {{glyphName:string,glyphs:Map<string,object>}} input Glyph and its complete master map.
 * @returns {object[]} Ordered contours in world coordinates, with component provenance.
 */
export function expandGlyphContours({ glyphName, glyphs }) {
  if (!(glyphs instanceof Map)) throw new TypeError("glyphs must be a Map.");
  const result = [],
    active = new Set();
  const visit = (name, matrix, componentPath) => {
    if (active.has(name)) throw new Error("Component cycle: " + [...active, name].join(" -> "));
    const glyph = glyphs.get(name);
    if (!glyph) throw new Error("Missing component glyph: " + name);
    active.add(name);
    const children = [
      ...(glyph.contours ?? []).map((c, i) => ({
        kind: "contour",
        index: c.outlineIndex ?? i,
        value: c,
      })),
      ...(glyph.components ?? []).map((c, i) => ({
        kind: "component",
        index: c.outlineIndex ?? (glyph.contours?.length ?? 0) + i,
        value: c,
      })),
    ].sort((a, b) => a.index - b.index);
    for (const child of children) {
      const c = child.value;
      if (child.kind === "component")
        visit(c.base, compose(matrix, c.transform), [
          ...componentPath,
          glyphs.get(c.base)?.sourcePath ?? c.base,
        ]);
      else {
        contourSegments(c);
        result.push({
          closed: true,
          outlineIndex: result.length,
          componentPath: [...componentPath],
          points: c.points.map((p) => {
            const [x, y] = pointAt(p, matrix);
            return { ...p, x, y };
          }),
        });
      }
    }
    active.delete(name);
  };
  visit(glyphName, [1, 0, 0, 1, 0, 0], []);
  return result;
}

/**
 * Checks explicit reviewed exceptions; no exception can bypass safety or topology.
 * @param {object[]} exceptions Per-master exception records.
 * @param {object[]} samples Actual per-master stroke samples.
 * @returns {Map<string,object>} Exceptions keyed by metric and sample identifier.
 */
export function validateGeometryExceptions(exceptions = [], samples = []) {
  const result = new Map(),
    ids = new Set(),
    sampleIds = new Set(samples.map((s) => s.id));
  for (const e of exceptions) {
    if (
      !e ||
      typeof e.id !== "string" ||
      !e.id.trim() ||
      ids.has(e.id) ||
      !["strokeWidth", "longestEdge", "centerDistance", "frameCornerRadius"].includes(e.metric) ||
      !Array.isArray(e.allowed) ||
      e.allowed.length !== 2 ||
      e.allowed.some((v) => !Number.isFinite(v)) ||
      e.allowed[0] > e.allowed[1] ||
      typeof e.reason !== "string" ||
      !e.reason.trim() ||
      typeof e.reviewedBy !== "string" ||
      !e.reviewedBy.trim() ||
      typeof e.reviewedAt !== "string" ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/u.test(e.reviewedAt) ||
      !Number.isFinite(Date.parse(e.reviewedAt)) ||
      new Date(e.reviewedAt).toISOString().slice(0, 19) !== e.reviewedAt.slice(0, 19) ||
      (e.metric === "strokeWidth" ? !sampleIds.has(e.sampleId) : e.sampleId !== null)
    )
      throw new Error("Invalid geometry exception: " + (e?.id ?? "missing id"));
    const key = e.metric + "|" + (e.sampleId ?? "");
    if (result.has(key)) throw new Error("Duplicate geometry exception: " + key);
    ids.add(e.id);
    result.set(key, e);
  }
  return result;
}

/**
 * Recomputes stroke widths from located edges instead of trusting recorded measurements.
 * @param {{contours:object[],samples:object[],exceptions?:object[],master:string,design:object,notes?:string}} input Actual geometry and record.
 * @returns {{samples:object[],violations:object[]}} Recomputed samples and exact failures.
 */
export function validateStrokeSamples({
  contours,
  samples,
  exceptions = [],
  master,
  design,
  notes = "",
}) {
  const reviewed = validateGeometryExceptions(exceptions, samples),
    ids = new Set(),
    measured = [],
    violations = [];
  const filled = master.startsWith("filled-"),
    optical = master.split("-")[1],
    rule = design.visual.strokeWidths[optical];
  if (!rule) throw new Error("Unknown master: " + master);
  if (filled && samples.length)
    throw new Error("Filled masters must not carry outline stroke samples.");
  if (!filled && samples.length < 2 && !notes.trim())
    violations.push({
      metric: "strokeSamples",
      actual: samples.length,
      expected: "at least two actual main-stroke samples, or a documented non-stroke subject",
    });
  const locate = (edge) => {
    if (
      !edge ||
      !Number.isInteger(edge.contour) ||
      edge.contour < 0 ||
      !Number.isInteger(edge.segment) ||
      edge.segment < 0
    )
      throw new Error("Invalid stroke edge location.");
    const c = contours[edge.contour];
    if (!c) throw new Error("Stroke contour is missing.");
    const segment = contourSegments(c)[edge.segment];
    if (!segment) throw new Error("Stroke segment is missing.");
    return evaluateSegment(segment, edge.t);
  };
  for (const s of samples) {
    if (
      !s ||
      typeof s.id !== "string" ||
      !s.id.trim() ||
      ids.has(s.id) ||
      !Array.isArray(s.normal) ||
      s.normal.length !== 2 ||
      s.normal.some((v) => !Number.isFinite(v)) ||
      Math.abs(Math.hypot(...s.normal) - 1) > 1e-9 ||
      !Number.isFinite(s.width) ||
      s.width <= 0
    )
      throw new Error("Invalid stroke sample: " + (s?.id ?? "missing id"));
    ids.add(s.id);
    const a = locate(s.edgeA),
      b = locate(s.edgeB);
    const width = finite(
      Math.abs((a[0] - b[0]) * s.normal[0] + (a[1] - b[1]) * s.normal[1]),
      "Stroke width",
    );
    if (!(width > 0) || Math.abs(width - s.width) > 1e-7)
      violations.push({
        metric: "recordedStrokeWidth",
        sampleId: s.id,
        actual: width,
        expected: s.width,
      });
    const interval = reviewed.get("strokeWidth|" + s.id)?.allowed ?? [
      rule.target - rule.tolerance,
      rule.target + rule.tolerance,
    ];
    if (width < interval[0] || width > interval[1])
      violations.push({
        metric: "strokeWidth",
        sampleId: s.id,
        actual: width,
        expected: interval,
      });
    measured.push({ ...s, width });
  }
  return { samples: measured, violations };
}

/**
 * Bounds distance from a point to the closed chord segment.
 * @param {number[]} point Query coordinates.
 * @param {number[]} a Chord start.
 * @param {number[]} b Chord end.
 * @returns {number} Euclidean distance, including collinear backtracking controls.
 */
export function distanceToSegment(point, a, b) {
  const dx = b[0] - a[0],
    dy = b[1] - a[1],
    length = dx * dx + dy * dy;
  const t =
    length === 0
      ? 0
      : Math.max(0, Math.min(1, ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / length));
  return Math.hypot(point[0] - a[0] - t * dx, point[1] - a[1] - t * dy);
}

/**
 * Merges compatible cubic subdivisions only after a six-master control-hull proof.
 * Each old cubic is compared with the matching parameter interval of the candidate.
 * Bernstein convexity bounds every point, including all linear axis interpolations.
 * Line segments, named nodes, contour direction and corresponding endpoints are retained.
 * @param {object[]} family Same ordered contour from all six source masters.
 * @param {number} tolerance Maximum source displacement in font units.
 * @returns {{contours:object[],errorBound:number,removedPoints:number}} Pure, bounded source candidates.
 */
export function mergeCompatibleCubicContour(family, tolerance) {
  if (!Array.isArray(family) || family.length !== 6)
    throw new Error("Curve reduction requires six compatible source contours.");
  if (!Number.isFinite(tolerance) || tolerance <= 0)
    throw new Error("Curve reduction tolerance must be positive and finite.");
  const signature = (c) => JSON.stringify(c.points.map((p) => [p.type, p.smooth, p.name]));
  if (family.some((c) => !c.closed || signature(c) !== signature(family[0])))
    throw new Error("Curve reduction requires closed corresponding source points.");
  if (family[0].points.some((p) => !["line", "curve", "offcurve"].includes(p.type)))
    return { contours: family, errorBound: 0, removedPoints: 0 };
  if (family.some((c) => c.points.some((p) => !Number.isFinite(p.x) || !Number.isFinite(p.y))))
    throw new Error("Curve reduction received nonfinite source points.");
  const segments = family.map((c) => {
    const start = c.points.findIndex((p) => p.type !== "offcurve");
    if (start < 0) throw new Error("Curve reduction contour lacks an endpoint.");
    const result = [];
    let previous = c.points[start],
      controls = [];
    for (let step = 1; step <= c.points.length; step++) {
      const point = c.points[(start + step) % c.points.length];
      if (point.type === "offcurve") {
        controls.push(point);
        continue;
      }
      if (point.type === "curve" ? controls.length !== 2 : controls.length !== 0)
        throw new Error("Curve reduction received invalid segment controls.");
      result.push([previous, ...controls, point]);
      previous = point;
      controls = [];
    }
    return result;
  });
  const coordinate = (p) => [p.x, p.y];
  const restrict = (q, a, b) => {
    const pa = evaluateSegment(q, a),
      pb = evaluateSegment(q, b);
    const derivative = q.slice(1).map((p, i) => p.map((v, axis) => 3 * (v - q[i][axis])));
    const da = evaluateSegment(derivative, a),
      db = evaluateSegment(derivative, b);
    return [
      pa,
      pa.map((v, axis) => v + ((b - a) * da[axis]) / 3),
      pb.map((v, axis) => v - ((b - a) * db[axis]) / 3),
      pb,
    ];
  };
  const candidate = (parts, start, count) => {
    const first = parts[start],
      last = parts[start + count - 1];
    return [
      coordinate(first[0]),
      coordinate(first[0]).map((v, axis) => v + count * (coordinate(first[1])[axis] - v)),
      coordinate(last[3]).map((v, axis) => v + count * (coordinate(last[2])[axis] - v)),
      coordinate(last[3]),
    ];
  };
  const plans = [];
  let bound = 0,
    removedPoints = 0;
  for (let start = 0; start < segments[0].length;) {
    let best = 1,
      bestBound = 0,
      curves = null;
    if (segments[0][start].length === 4) {
      for (let count = 2; count <= 32 && start + count <= segments[0].length; count++) {
        const selected = segments[0].slice(start, start + count);
        if (selected.some((s) => s.length !== 4 || s.some((p) => p.name != null))) break;
        const candidates = segments.map((parts) => candidate(parts, start, count));
        let trialBound = 0;
        for (let master = 0; master < 6; master++) {
          for (let j = 0; j < count; j++) {
            const restricted = restrict(candidates[master], j / count, (j + 1) / count);
            const original = segments[master][start + j];
            for (let p = 0; p < 4; p++)
              trialBound = Math.max(
                trialBound,
                Math.hypot(restricted[p][0] - original[p].x, restricted[p][1] - original[p].y),
              );
          }
        }
        if (trialBound > tolerance) break;
        best = count;
        bestBound = trialBound;
        curves = candidates;
      }
    }
    plans.push({ start, count: best, curves });
    removedPoints += 3 * (best - 1);
    bound = Math.max(bound, bestBound);
    start += best;
  }
  if (!removedPoints) return { contours: family, errorBound: 0, removedPoints: 0 };
  const contours = family.map((contour, master) => {
    const points = [{ ...segments[master][0][0] }];
    for (const { start, count, curves } of plans) {
      const first = segments[master][start],
        last = segments[master][start + count - 1];
      if (curves) {
        const q = curves[master];
        points.push(
          { ...first[1], x: q[1][0], y: q[1][1] },
          { ...last[2], x: q[2][0], y: q[2][1] },
        );
      } else points.push(...first.slice(1, -1).map((p) => ({ ...p })));
      if (start + count < segments[master].length) points.push({ ...last.at(-1) });
    }
    return { ...contour, points };
  });
  return { contours, errorBound: bound, removedPoints };
}

/**
 * Adaptively flattens source curves with a convex-hull distance error bound.
 * @param {object[]} contours Closed expanded contours.
 * @param {number} tolerance Maximum distance in font units.
 * @returns {{contours:number[][][],errorBound:number}} Ordered polylines and actual maximum leaf bound.
 */
export function flattenGlyphContours(contours, tolerance) {
  if (!Number.isFinite(tolerance) || tolerance <= 0)
    throw new Error("Subdivision tolerance must be positive and finite.");
  let errorBound = 0;
  const flatten = (points, output, depth) => {
    const bound = Math.max(...points.map((p) => distanceToSegment(p, points[0], points.at(-1))));
    if (bound <= tolerance) {
      errorBound = Math.max(errorBound, bound);
      output.push(points.at(-1));
      return;
    }
    if (depth >= 32) throw new Error("Curve subdivision exceeded the safe recursion limit.");
    const levels = [points];
    while (levels.at(-1).length > 1) {
      const previous = levels.at(-1);
      levels.push(previous.slice(1).map((p, i) => p.map((v, a) => (v + previous[i][a]) / 2)));
    }
    flatten(
      levels.map((level) => level[0]),
      output,
      depth + 1,
    );
    flatten(levels.map((level) => level.at(-1)).reverse(), output, depth + 1);
  };
  const polylines = contours.map((c) => {
    const segments = contourSegments(c),
      output = [segments[0][0]];
    for (const segment of segments) flatten(segment, output, 0);
    return output;
  });
  return { contours: polylines, errorBound };
}

/**
 * Measures maximum circular radial error conservatively, including the curve subdivision bound.
 * @param {{contour:object,center:number[],radius:number,tolerance:number}} input Actual circular contour.
 * @returns {number} Proven upper bound in font units.
 */
export function measureCircleApproximation({ contour, center, radius, tolerance }) {
  if (
    !Array.isArray(center) ||
    center.length !== 2 ||
    center.some((v) => !Number.isFinite(v)) ||
    !(radius > 0)
  )
    throw new Error("Invalid analytic circle.");
  const flat = flattenGlyphContours([contour], tolerance);
  let error = 0;
  for (const points of flat.contours)
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1],
        b = points[i],
        maximum = Math.max(
          Math.hypot(a[0] - center[0], a[1] - center[1]),
          Math.hypot(b[0] - center[0], b[1] - center[1]),
        ),
        minimum = distanceToSegment(center, a, b);
      error = Math.max(error, Math.abs(maximum - radius), Math.abs(minimum - radius));
    }
  return error + flat.errorBound;
}

/**
 * Builds a nearest-edge tree for bounded, repeated point-to-outline queries.
 * @param {number[][][]} contours Closed flattened contours.
 * @returns {(point:number[])=>{distance:number,edge:object}} Exact distance and one nearest segment.
 */
function outlineDistance(contours) {
  const edges = contours.flatMap((points) =>
    points.slice(1).map((b, i) => ({
      a: points[i],
      b,
      bounds: [
        Math.min(points[i][0], b[0]),
        Math.min(points[i][1], b[1]),
        Math.max(points[i][0], b[0]),
        Math.max(points[i][1], b[1]),
      ],
    })),
  );
  if (!edges.length) throw new Error("Cannot compare empty outlines.");
  const tree = (items) => {
    const bounds = [
      Math.min(...items.map((e) => e.bounds[0])),
      Math.min(...items.map((e) => e.bounds[1])),
      Math.max(...items.map((e) => e.bounds[2])),
      Math.max(...items.map((e) => e.bounds[3])),
    ];
    if (items.length <= 8) return { bounds, items };
    const axis = bounds[2] - bounds[0] >= bounds[3] - bounds[1] ? 0 : 1;
    items.sort(
      (a, b) => a.bounds[axis] + a.bounds[axis + 2] - (b.bounds[axis] + b.bounds[axis + 2]),
    );
    const half = Math.floor(items.length / 2);
    return {
      bounds,
      left: tree(items.slice(0, half)),
      right: tree(items.slice(half)),
    };
  };
  const root = tree(edges);
  return (point) => {
    let minimum = Infinity,
      nearestEdge;
    const boxDistance = (b) =>
      Math.hypot(
        Math.max(b[0] - point[0], 0, point[0] - b[2]),
        Math.max(b[1] - point[1], 0, point[1] - b[3]),
      );
    const visit = (node) => {
      if (boxDistance(node.bounds) >= minimum) return;
      if (node.items)
        for (const edge of node.items) {
          const distance = distanceToSegment(point, edge.a, edge.b);
          if (distance < minimum) {
            minimum = distance;
            nearestEdge = edge;
          }
        }
      else {
        const children = [node.left, node.right].sort(
          (a, b) => boxDistance(a.bounds) - boxDistance(b.bounds),
        );
        children.forEach(visit);
      }
    };
    visit(root);
    return { distance: minimum, edge: nearestEdge };
  };
}

/**
 * Compares whole source and compiled boundaries using conservative bilateral distance bounds.
 * @param {{sourceContours:object[],compiledContours:object[],tolerance:number,boundaryLimit?:number}} input Two independent outlines and an optional fixed decision limit.
 * @returns {{maxBoundaryUnits:number,subdivisionErrorUnits:number}} Proven boundary upper bound; no automatic alignment.
 */
export function compareOutlineBoundaries({
  sourceContours,
  compiledContours,
  tolerance,
  boundaryLimit,
}) {
  if (boundaryLimit !== undefined && (!Number.isFinite(boundaryLimit) || boundaryLimit <= 0))
    throw new Error("Invalid fixed boundary limit.");
  let result;
  for (let round = 0; round < (boundaryLimit === undefined ? 1 : 7); round++) {
    result = outlineBoundaryInterval(sourceContours, compiledContours, tolerance / 4 ** round);
    if (
      boundaryLimit === undefined ||
      result.maxBoundaryUnits <= boundaryLimit ||
      result.lower > boundaryLimit
    )
      break;
  }
  return {
    maxBoundaryUnits: result.maxBoundaryUnits,
    subdivisionErrorUnits: result.subdivisionErrorUnits,
  };
}

/**
 * Bounds true bilateral distance above and below, including both curve-flattening errors.
 * @param {object[]} sourceContours Independent source contours.
 * @param {object[]} compiledContours Actual compiled contours.
 * @param {number} tolerance Current subdivision and search tolerance.
 * @returns {object} Internal interval; only the upper bound can prove a passing comparison.
 */
function outlineBoundaryInterval(sourceContours, compiledContours, tolerance) {
  const a = flattenGlyphContours(sourceContours, tolerance),
    b = flattenGlyphContours(compiledContours, tolerance);
  const directed = (from, to) => {
    const nearest = outlineDistance(to);
    let lower = 0,
      upper = 0;
    const search = (p, q, dp, dq, depth) => {
      const length = Math.hypot(q[0] - p[0], q[1] - p[1]),
        middle = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2],
        dm = nearest(middle);
      lower = Math.max(lower, dp.distance, dq.distance, dm.distance);
      /**
       * Distance to a closed set is 1-Lipschitz; endpoint cones bound each half chord.
       * Distance to one fixed segment is convex, so its endpoint maximum also bounds
       * the whole chord. Taking the smaller proven bound avoids subdividing coincident
       * or parallel straight edges without changing curve errors or acceptance limits.
       */
      const coneBound = Math.max(
          (dp.distance + dm.distance + length / 2) / 2,
          (dm.distance + dq.distance + length / 2) / 2,
        ),
        segmentBound = Math.min(
          ...[...new Set([dp.edge, dq.edge, dm.edge])].map((edge) =>
            Math.max(distanceToSegment(p, edge.a, edge.b), distanceToSegment(q, edge.a, edge.b)),
          ),
        ),
        bound = Math.min(coneBound, segmentBound);
      if (bound <= lower + tolerance || length <= tolerance) {
        upper = Math.max(upper, bound);
        return;
      }
      if (depth >= 32) throw new Error("Boundary comparison exceeded the safe recursion limit.");
      search(p, middle, dp, dm, depth + 1);
      search(middle, q, dm, dq, depth + 1);
    };
    for (const points of from)
      for (let i = 1; i < points.length; i++)
        search(points[i - 1], points[i], nearest(points[i - 1]), nearest(points[i]), 0);
    return { lower, upper: Math.max(lower, upper) };
  };
  const forward = directed(a.contours, b.contours),
    reverse = directed(b.contours, a.contours);
  return {
    maxBoundaryUnits: Math.max(forward.upper, reverse.upper) + a.errorBound + b.errorBound,
    lower: Math.max(0, Math.max(forward.lower, reverse.lower) - a.errorBound - b.errorBound),
    subdivisionErrorUnits: Math.max(a.errorBound, b.errorBound),
  };
}
/**
 * Checks an explicitly measured ordinary frame corner against its optical-master rule or reviewed exception.
 * @param {{radius:number,master:string,exceptions?:object[],design:object}} input Measured source radius.
 * @returns {object[]} No implicit exception or global threshold change is permitted.
 */
export function validateFrameCornerRadius({ radius, master, exceptions = [], design }) {
  const optical = master.split("-")[1],
    stroke = design.visual.strokeWidths[optical];
  if (!stroke || !Number.isFinite(radius) || radius < 0)
    throw new Error("Invalid frame radius measurement.");
  const reviewed = validateGeometryExceptions(exceptions.filter((e) => e.metric !== "strokeWidth"));
  const expected =
    (design.visual.frameCornerRadius.standard * stroke.target) /
    design.visual.strokeWidths.standard.target;
  const interval = reviewed.get("frameCornerRadius|")?.allowed ?? [expected, expected];
  return radius >= interval[0] - 1e-7 && radius <= interval[1] + 1e-7
    ? []
    : [{ metric: "frameCornerRadius", actual: radius, expected: interval }];
}
/**
 * Ensures longest-edge and centering constraints can fit inside the safe rectangle.
 * Width, height and aspect ratio are not optical-class constraints.
 * @param {object} design Design configuration.
 * @returns {void} Rejects invalid or geometrically impossible class rules.
 */
export function validateDesignGeometry(design) {
  const { safeBounds: s, opticalCenter: o, lengthTolerance: tol } = design.grid;
  if (
    !Array.isArray(s) ||
    s.length !== 4 ||
    s.some((v) => !Number.isFinite(v)) ||
    s[0] >= s[2] ||
    s[1] >= s[3] ||
    !Array.isArray(o) ||
    o.length !== 2 ||
    o.some((v) => !Number.isFinite(v)) ||
    o[0] < s[0] ||
    o[0] > s[2] ||
    o[1] < s[1] ||
    o[1] > s[3] ||
    !Number.isFinite(tol) ||
    tol < 0
  )
    throw new Error("Invalid design grid.");
  for (const [name, rule] of Object.entries(design.opticalClasses)) {
    if (Object.keys(rule).some((k) => !["longestEdge", "centerTolerance"].includes(k)))
      throw new Error(name + " has retired or unknown optical constraints.");
    const edge = rule.longestEdge;
    if (
      !Array.isArray(edge) ||
      edge.length !== 2 ||
      edge.some((v) => !Number.isFinite(v) || v <= 0) ||
      edge[0] > edge[1]
    )
      throw new Error(name + " has invalid longestEdge.");
    if (!Number.isFinite(rule.centerTolerance) || rule.centerTolerance <= 0)
      throw new Error(name + " has invalid centerTolerance.");
    const minimum = edge[0] - tol;
    if (!(minimum > 0)) throw new Error(name + " tolerance produces nonpositive dimensions.");
    const feasible = [0, 1].some((axis) => {
      const low = s[axis] + minimum / 2,
        high = s[axis + 2] - minimum / 2;
      const distance = Math.abs(o[axis] - Math.max(low, Math.min(high, o[axis])));
      const transverse = 1 - axis;
      return (
        low <= high &&
        (distance < rule.centerTolerance ||
          (distance === rule.centerTolerance &&
            o[transverse] > s[transverse] &&
            o[transverse] < s[transverse + 2]))
      );
    });
    if (!feasible)
      throw new Error(
        name + " has contradictory longestEdge/safeBounds/centerTolerance constraints.",
      );
  }
}

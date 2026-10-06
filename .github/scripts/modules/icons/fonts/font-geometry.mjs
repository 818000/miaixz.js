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
export function validateGlyphGeometry({ measurement: m, opticalClass, design }) {
  const rule = design.opticalClasses[opticalClass];
  if (!rule) throw new Error("Unknown optical class: " + opticalClass);
  const violations = [],
    lengthTolerance = design.grid.lengthTolerance;
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
  for (const metric of ["longestEdge", "width", "height", "aspectRatio"]) {
    const tolerance = metric === "aspectRatio" ? 0 : lengthTolerance;
    const actual = m[metric],
      expected = rule[metric];
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
  if (centerDistance === null || centerDistance > rule.centerTolerance)
    add("centerDistance", centerDistance, [0, rule.centerTolerance]);
  return { centerDistance, violations };
}

/**
 * Eliminates one dimension of a system of non-strict linear inequalities.
 * @param {number[][]} rows Coefficients and right-hand bounds of non-strict inequalities.
 * @param {number} index Coefficient column to eliminate by pairing opposite signs.
 * @returns {number[][]} Projected inequalities with that coefficient set to zero.
 */
function eliminate(rows, index) {
  const positives = [],
    negatives = [],
    result = [];
  for (const row of rows) {
    if (row[index] === 0) result.push(row);
    else {
      const normalized = row.map((v) =>
        finite(v / Math.abs(row[index]), "Elimination coefficient"),
      );
      (row[index] > 0 ? positives : negatives).push(normalized);
    }
  }
  for (const p of positives)
    for (const n of negatives) {
      const row = p.map((v, i) => finite(v + n[i], "Projected constraint"));
      row[index] = 0;
      result.push(row);
    }
  return result;
}

/**
 * Clips a closed convex center domain, preserving lines and single points.
 * @param {number[][]} polygon Ordered [x, y] vertices of the convex center domain.
 * @param {number} a X coefficient of the half-plane a*x + b*y <= c.
 * @param {number} b Y coefficient of the half-plane.
 * @param {number} c Inclusive half-plane bound.
 * @returns {number[][]} Clipped vertices, or an empty array when no center is feasible.
 */
function clip(polygon, a, b, c) {
  if (a === 0 && b === 0) return c >= 0 ? polygon : [];
  const result = [];
  for (let i = 0; i < polygon.length; i++) {
    const p = polygon[i],
      q = polygon[(i + 1) % polygon.length];
    const dp = finite(a * p[0] + b * p[1] - c, "Half-plane distance"),
      dq = finite(a * q[0] + b * q[1] - c, "Half-plane distance");
    if (dp <= 0) result.push(p);
    if (dp <= 0 !== dq <= 0) {
      const t = finite(dp / finite(dp - dq, "Intersection divisor"), "Intersection parameter");
      result.push([
        finite(p[0] + t * (q[0] - p[0]), "Intersection x"),
        finite(p[1] + t * (q[1] - p[1]), "Intersection y"),
      ]);
    }
  }
  return result;
}

/**
 * Validates joint dimension, safe-area and centering feasibility.
 * @param {any} design Design configuration.
 * @returns {void} Throws with the class and contradictory constraints on failure.
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
    for (const metric of ["width", "height", "longestEdge", "aspectRatio"]) {
      const range = rule[metric];
      if (
        !Array.isArray(range) ||
        range.length !== 2 ||
        range.some((v) => !Number.isFinite(v) || v <= 0) ||
        range[0] > range[1]
      )
        throw new Error(name + " has invalid " + metric);
    }
    if (!Number.isFinite(rule.centerTolerance) || rule.centerTolerance <= 0)
      throw new Error(name + " has invalid centerTolerance.");
    const w = [rule.width[0] - tol, rule.width[1] + tol],
      h = [rule.height[0] - tol, rule.height[1] + tol],
      edge = [rule.longestEdge[0] - tol, rule.longestEdge[1] + tol],
      ratio = rule.aspectRatio;
    for (const interval of [w, h, edge])
      for (const value of interval) finite(value, name + " expanded interval");
    if (w[0] <= 0 || h[0] <= 0)
      throw new Error(name + " tolerance produces nonpositive dimensions.");
    let feasible = false;
    for (const horizontal of [true, false]) {
      let rows = [
        [-1, 0, 0, 0, -w[0]],
        [1, 0, 0, 0, w[1]],
        [0, -1, 0, 0, -h[0]],
        [0, 1, 0, 0, h[1]],
        [-1, ratio[0], 0, 0, 0],
        [1, -ratio[1], 0, 0, 0],
        [0.5, 0, -1, 0, -s[0]],
        [0.5, 0, 1, 0, s[2]],
        [0, 0.5, 0, -1, -s[1]],
        [0, 0.5, 0, 1, s[3]],
        horizontal ? [-1, 1, 0, 0, 0] : [1, -1, 0, 0, 0],
        horizontal ? [-1, 0, 0, 0, -edge[0]] : [0, -1, 0, 0, -edge[0]],
        horizontal ? [1, 0, 0, 0, edge[1]] : [0, 1, 0, 0, edge[1]],
      ];
      rows = eliminate(eliminate(rows, 1), 0);
      let polygon = [
        [s[0], s[1]],
        [s[2], s[1]],
        [s[2], s[3]],
        [s[0], s[3]],
      ];
      for (const row of rows) polygon = clip(polygon, row[2], row[3], row[4]);
      if (!polygon.length) continue;
      let distance = Infinity;
      if (rows.every((r) => finite(r[2] * o[0] + r[3] * o[1], name + " center constraint") <= r[4]))
        distance = 0;
      for (let i = 0; i < polygon.length; i++) {
        const p = polygon[i],
          q = polygon[(i + 1) % polygon.length],
          dx = q[0] - p[0],
          dy = q[1] - p[1];
        const length = finite(dx * dx + dy * dy, "Center edge length");
        const projection = finite((o[0] - p[0]) * dx + (o[1] - p[1]) * dy, "Center projection");
        const t = length === 0 ? 0 : Math.max(0, Math.min(1, projection / length));
        distance = Math.min(
          distance,
          finite(Math.hypot(o[0] - p[0] - t * dx, o[1] - p[1] - t * dy), "Center distance"),
        );
      }
      if (distance <= rule.centerTolerance) feasible = true;
    }
    if (!feasible)
      throw new Error(
        name +
          " has contradictory width/height/longestEdge/aspectRatio/safeBounds/centerTolerance constraints: " +
          JSON.stringify(rule),
      );
  }
}

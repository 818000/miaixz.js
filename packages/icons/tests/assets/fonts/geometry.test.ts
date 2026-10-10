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
 * Exercises isolated icon architecture inputs and immutable output contracts.
 */

import { mkdtemp, readFile, writeFile, rm, readdir, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
const repositoryRoot = resolve(process.cwd(), "../..");
/**
 * Loads one repository tool without running its CLI.
 *
 * @param name - Repository-relative icon tool path.
 * @returns Imported tool exports.
 */
const importScript = async (name: string) =>
  import(pathToFileURL(resolve(repositoryRoot, ".github/scripts/modules/icons/" + name)).href);
const { createIconFixture, fixtureDesign } = await import(
  pathToFileURL(resolve(process.cwd(), "tests/assets/fonts/create-fixtures.helper.mjs")).href
);
const temporary: string[] = [];

describe("independent outline moments", () => {
  /**
   * Constructs an independent closed polygon with its supplied winding unchanged.
   * @param points - Mathematical polygon vertices.
   * @returns Closed line contour.
   */
  const polygon = (points: number[][]) => ({
    closed: true,
    points: points.map(([x, y]) => ({ x: x!, y: y!, type: "line" })),
  });
  it("integrates squares, opposing holes and reversed winding without reading raster pixels", async () => {
    const { measureOutlineMoments } = await importScript("fonts/font-geometry.mjs");
    const outer = polygon([
        [0, 0],
        [4, 0],
        [4, 4],
        [0, 4],
      ]),
      hole = polygon([
        [1, 1],
        [1, 3],
        [3, 3],
        [3, 1],
      ]);
    const measured = measureOutlineMoments([outer, hole]);
    expect(measured.area).toBeCloseTo(12, 12);
    for (const value of measured.centroid) expect(value).toBeCloseTo(2, 12);
    const reversed = measureOutlineMoments(
      [outer, hole].map((c) => ({ ...c, points: c.points.slice().reverse() })),
    );
    expect(reversed.area).toBeCloseTo(12, 12);
    for (const value of reversed.centroid) expect(value).toBeCloseTo(2, 12);
    expect(measureOutlineMoments([outer]).area).toBeCloseTo(16, 12);
  });
  it("integrates independent quadratic and cubic graph moments exactly", async () => {
    const { measureOutlineMoments } = await importScript("fonts/font-geometry.mjs");
    for (const degree of [2, 3]) {
      const points = [
        { x: 0, y: 0, type: "line" },
        ...Array.from({ length: degree - 1 }, (_, i) => ({
          x: (i + 1) / degree,
          y: 0,
          type: "offcurve",
        })),
        { x: 1, y: 1, type: degree === 2 ? "qcurve" : "curve" },
        { x: 1, y: 0, type: "line" },
      ];
      const measured = measureOutlineMoments([{ closed: true, points }]);
      expect(measured.area).toBeCloseTo(1 / (degree + 1), 12);
      expect(measured.centroid[0]).toBeCloseTo((degree + 1) / (degree + 2), 12);
      expect(measured.centroid[1]).toBeCloseTo((degree + 1) / (4 * degree + 2), 12);
    }
  });
  it("preserves translation and rejects empty, open, collapsed and nonfinite contours", async () => {
    const { measureOutlineMoments } = await importScript("fonts/font-geometry.mjs");
    const original = polygon([
        [480, 320],
        [484, 320],
        [484, 324],
        [480, 324],
      ]),
      shifted = { ...original, points: original.points.map((p) => ({ ...p, x: p.x + 2 })) };
    expect(
      measureOutlineMoments([shifted]).centroid[0] - measureOutlineMoments([original]).centroid[0],
    ).toBeCloseTo(2, 12);
    for (const contours of [
      [],
      [{ ...original, closed: false }],
      [
        polygon([
          [0, 0],
          [1, 1],
          [2, 2],
        ]),
      ],
      [
        polygon([
          [0, 0],
          [NaN, 1],
          [2, 2],
        ]),
      ],
    ])
      expect(() => measureOutlineMoments(contours)).toThrow();
  });
});

describe("nonzero-winding ink moments", () => {
  /**
   * Constructs independent polygon vertices without normalizing their winding.
   * @param coordinates - Mathematical polygon coordinates.
   * @returns Closed line contour.
   */
  const polygon = (coordinates: number[][]) => ({
    closed: true,
    points: coordinates.map(([x, y]) => ({ x: x!, y: y!, type: "line" })),
  });
  it("measures separated opposite windings, overlapping union, cancellation and self-crossings", async () => {
    const { measureInkMoments } = await importScript("fonts/font-geometry.mjs");
    const square = polygon([
        [0, 0],
        [4, 0],
        [4, 4],
        [0, 4],
      ]),
      shifted = (x: number, reverse = false) => ({
        ...square,
        points: square.points.map((p) => ({ ...p, x: p.x + x }))[reverse ? "reverse" : "slice"](),
      });
    for (const [contours, area, cx] of [
      [[square, shifted(6, true)], 32, 5],
      [[square, shifted(2)], 24, 3],
      [[square, shifted(2, true)], 16, 3],
      [
        [
          polygon([
            [0, 0],
            [4, 4],
            [0, 4],
            [4, 0],
          ]),
        ],
        8,
        2,
      ],
      [
        [
          square,
          polygon([
            [1, 1],
            [1, 3],
            [3, 3],
            [3, 1],
          ]),
        ],
        12,
        2,
      ],
    ] as const) {
      const moments = measureInkMoments(contours, fixtureDesign.visual.comparison.subdivisionUnits);
      expect(moments.area).toBeCloseTo(area, 12);
      expect(moments.centroid[0]).toBeCloseTo(cx, 12);
      expect(moments.centroid[1]).toBeCloseTo(2, 12);
      expect(moments.subdivisionErrorUnits).toBe(0);
    }
    expect(() => measureInkMoments([square, shifted(0, true)], 0.05)).toThrow();
    expect(() => measureInkMoments([], 0.05)).toThrow();
    expect(() => measureInkMoments([{ ...square, closed: false }], 0.05)).toThrow();
    const nearVertex = measureInkMoments(
      [
        polygon([
          [0, 0],
          [4, 4],
          [0, 4 + Number.EPSILON * 8],
        ]),
      ],
      0.05,
    );
    expect(nearVertex.area).toBeCloseTo(8, 12);
    expect(nearVertex.centroid[0]).toBeCloseTo(4 / 3, 12);
    expect(nearVertex.centroid[1]).toBeCloseTo(8 / 3, 12);
  });
});

describe("bounded six-master curve reduction", () => {
  /**
   * Constructs exact subdivisions from an independent cubic polynomial and derivative.
   * @returns Six compatible independently calculated native cubic contours.
   */
  const family = () =>
    Array.from({ length: 6 }, (_, master) => {
      const scale = 1 + master / 10;
      const point = (t: number) => {
        const u = 1 - t;
        return [
          scale * (3 * u * u * t * 80 + 3 * u * t * t * 200 + t * t * t * 300),
          master * 20 + scale * (3 * u * u * t * 120 - 3 * u * t * t * 30 + t * t * t * 80),
        ];
      };
      const derivative = (t: number) => {
        const u = 1 - t;
        return [
          scale * (3 * u * u * 80 + 6 * u * t * 120 + 3 * t * t * 100),
          scale * (3 * u * u * 120 - 6 * u * t * 150 + 3 * t * t * 110),
        ];
      };
      const node = (p: number[], type: string) => ({
        x: p[0]!,
        y: p[1]!,
        type,
        smooth: type === "curve",
        name: null as string | null,
      });
      const points = [node(point(0), "line")];
      for (let i = 0; i < 8; i++) {
        const a = i / 8,
          b = (i + 1) / 8,
          pa = point(a),
          pb = point(b);
        const da = derivative(a),
          db = derivative(b);
        points.push(
          node(
            pa.map((v, axis) => v + da[axis]! / 24),
            "offcurve",
          ),
          node(
            pb.map((v, axis) => v - db[axis]! / 24),
            "offcurve",
          ),
          node(pb, "curve"),
        );
      }
      return { closed: true, points };
    });

  it("merges exact cubic subdivisions with a whole-curve proof and no input mutation", async () => {
    const { mergeCompatibleCubicContour } = await importScript("fonts/font-geometry.mjs");
    const input = family(),
      before = JSON.stringify(input);
    const result = mergeCompatibleCubicContour(input, 0.05);
    expect(result.removedPoints).toBe(21);
    expect(result.errorBound).toBeLessThan(1e-10);
    for (let master = 0; master < 6; master++) {
      const scale = 1 + master / 10;
      expect(result.contours[master].points).toHaveLength(4);
      expect(result.contours[master].points[1].x).toBeCloseTo(80 * scale, 9);
      expect(result.contours[master].points[1].y).toBeCloseTo(master * 20 + 120 * scale, 9);
      expect(result.contours[master].points[2].x).toBeCloseTo(200 * scale, 9);
      expect(result.contours[master].points[2].y).toBeCloseTo(master * 20 - 30 * scale, 9);
    }
    expect(JSON.stringify(input)).toBe(before);
  });

  it("bounds nonzero reduction error independently at all masters and between both axes", async () => {
    const { mergeCompatibleCubicContour } = await importScript("fonts/font-geometry.mjs");
    const input = family();
    input.forEach((contour, index) => {
      contour.points[10]!.y += (index + 1) * 0.004;
    });
    const result = mergeCompatibleCubicContour(input, 0.05);
    expect(result.removedPoints).toBe(21);
    expect(result.errorBound).toBeCloseTo(0.024, 9);
    const cubic = (points: { x: number; y: number }[], t: number) => {
      const u = 1 - t;
      const weights = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
      return ["x", "y"].map((axis) =>
        points.reduce((sum, point, index) => sum + point[axis as "x" | "y"] * weights[index]!, 0),
      );
    };
    const optical = (19.1 - 12) / 12,
      fill = 0.37;
    const blend = [
      (1 - fill) * (1 - optical),
      (1 - fill) * optical,
      0,
      fill * (1 - optical),
      fill * optical,
      0,
    ];
    for (const weights of [
      ...Array.from({ length: 6 }, (_, index) =>
        Array.from({ length: 6 }, (_, master) => Number(index === master)),
      ),
      blend,
    ]) {
      for (let step = 0; step <= 256; step++) {
        const t = step / 256,
          part = Math.min(7, Math.floor(t * 8)),
          local = t * 8 - part;
        const expected = input.map((contour) =>
          cubic(contour.points.slice(part * 3, part * 3 + 4), local),
        );
        const actual = result.contours.map((contour: { points: { x: number; y: number }[] }) =>
          cubic(contour.points, t),
        );
        const error = Math.hypot(
          ...[0, 1].map((axis) =>
            weights.reduce(
              (sum, weight, master) =>
                sum + weight * (actual[master][axis]! - expected[master]![axis]!),
              0,
            ),
          ),
        );
        expect(error).toBeLessThanOrEqual(result.errorBound + 1e-9);
      }
    }
  });

  it("retains an incompatible master excursion and named nodes instead of hiding them", async () => {
    const { mergeCompatibleCubicContour } = await importScript("fonts/font-geometry.mjs");
    const excursion = family();
    excursion[5]!.points[7]!.y += 20;
    const result = mergeCompatibleCubicContour(excursion, 0.05);
    expect(result.errorBound).toBeLessThanOrEqual(0.05);
    expect(result.contours[5].points.length).toBeGreaterThan(4);
    expect(
      result.contours[5].points.some((p: { y: number }) => p.y === excursion[5]!.points[7]!.y),
    ).toBe(true);
    const named = family();
    for (const contour of named) contour.points[9]!.name = "semantic-junction";
    expect(
      mergeCompatibleCubicContour(named, 0.05).contours.every(
        (c: { points: { name: string | null }[] }) =>
          c.points.some((p) => p.name === "semantic-junction"),
      ),
    ).toBe(true);
    expect(() => mergeCompatibleCubicContour(named.slice(1), 0.05)).toThrow("six");
    for (const limit of [0, -1, NaN, Infinity])
      expect(() => mergeCompatibleCubicContour(named, limit)).toThrow("tolerance");
  });
});

afterEach(async () => {
  for (const path of temporary.splice(0)) await rm(path, { recursive: true, force: true });
});
/**
 * Creates a fresh temporary six-master test source.
 *
 * @param records - Complete test icon records.
 * @returns Isolated fixture roots and written files.
 */
const make = async (
  records = [
    {
      name: "alpha",
      codepoint: 0xf0000,
      category: "actions",
      opticalClass: "regular",
      rtl: "none",
    },
  ],
) => {
  const directory = await mkdtemp(resolve(tmpdir(), "miaixz-icon-test-"));
  temporary.push(directory);
  return createIconFixture({
    directory,
    categories: [{ id: "actions", description: "Actions; excludes navigation" }],
    records,
    design: structuredClone(fixtureDesign),
  });
};
/**
 * Mutates an isolated fixture to construct a negative input.
 *
 * @param path - Temporary fixture path.
 * @param change - Exact test mutation.
 * @returns File-write completion.
 */
const edit = async (path: string, change: (value: string) => string) =>
  writeFile(path, change(await readFile(path, "utf8")));
/**
 * Captures fixture bytes for zero-write and determinism assertions.
 *
 * @param root - Isolated fixture root.
 * @returns Relative file paths and their text.
 */
const snapshot = async (root: string): Promise<Record<string, string>> => {
  const result: Record<string, string> = {};
  /**
   * Captures every fixture file recursively for byte-preservation assertions.
   *
   * @param path - Directory path relative to the isolated fixture root.
   * @returns Promise resolving after all descendant file contents are recorded.
   */
  const walk = async (path: string) => {
    for (const entry of await readdir(resolve(root, path), {
      withFileTypes: true,
    })) {
      const p = path ? path + "/" + entry.name : entry.name;
      if (entry.isDirectory()) await walk(p);
      else result[p] = await readFile(resolve(root, p), "utf8");
    }
  };
  await walk("");
  return result;
};

/**
 * Expected curve bounds and dimensions checked by the geometry test cases.
 */
interface Measurement {
  bounds: number[] | null;
  width: number;
  height: number;
  longestEdge: number;
  aspectRatio: number | null;
  center: number[] | null;
  nonEmpty: boolean;
}
/**
 * Named geometry operation with its input and expected result or failure diagnostics.
 */
interface GeometryCase {
  id: string;
  kind: "measureGlyph" | "validateGlyphGeometry" | "validateDesignGeometry";
  input: unknown;
  expected: Record<string, unknown> & {
    throws?: boolean;
    messageIncludes?: string[];
    returnsUndefined?: boolean;
  };
}
const geometry = await importScript("fonts/font-geometry.mjs");
const { measureGlyph, validateGlyphGeometry, validateDesignGeometry } = geometry;
/**
 * Defines a closed rectangular test contour.
 *
 * @param l - Left coordinate.
 * @param b - Bottom coordinate.
 * @param r - Right coordinate.
 * @param t - Top coordinate.
 * @returns Ordered line points.
 */
const points = (l: number, b: number, r: number, t: number) => [
  { x: l, y: b, type: "line" },
  { x: r, y: b, type: "line" },
  { x: r, y: t, type: "line" },
  { x: l, y: t, type: "line" },
];
/**
 * Measures a centered rectangular fixture.
 *
 * @param w - Width in design units.
 * @param h - Height in design units.
 * @param cx - Horizontal center.
 * @param cy - Vertical center.
 * @returns Exact rectangle metrics.
 */
const measure = (w: number, h: number, cx = 480, cy = 320) =>
  measureGlyph({
    glyphName: "g",
    glyphs: new Map([
      [
        "g",
        {
          contours: [
            {
              closed: true,
              points: points(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2),
            },
          ],
          components: [],
        },
      ],
    ]),
  });
const cases = JSON.parse(
  await readFile(resolve(process.cwd(), "tests/assets/fonts/geometry-cases.fixture.json"), "utf8"),
) as GeometryCase[];
describe("exact geometry", () => {
  it("requires every reusable case to have a unique ASCII-sorted id", () => {
    const ids = cases.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual([...ids].sort());
    for (const c of cases) expect(Object.keys(c)).toEqual(["id", "kind", "input", "expected"]);
  });
  it.each([1e-8, 1 - 1e-8])("keeps an extremum strictly inside the endpoint at t=%s", (root) => {
    const peak = 1;
    const left = peak - root * root;
    const right = peak - (1 - root) * (1 - root);
    const control = left + root;
    const result = measureGlyph({
      glyphName: "g",
      glyphs: new Map([
        [
          "g",
          {
            contours: [
              {
                closed: true,
                points: [
                  { x: 0, y: left, type: "line" },
                  { x: 0.5, y: control, type: "offcurve" },
                  { x: 1, y: right, type: "qcurve" },
                ],
              },
            ],
            components: [],
          },
        ],
      ]),
    });
    expect(result.bounds[3]).toBeCloseTo(peak, 15);
    expect(result.bounds[3]).toBeGreaterThanOrEqual(Math.max(left, right));
  });
  it.each(cases)("$id", (c) => {
    const input =
      c.kind === "measureGlyph"
        ? {
            ...(c.input as { glyphName: string }),
            glyphs: new Map((c.input as { glyphs: [string, unknown][] }).glyphs),
          }
        : c.input;
    if (c.expected.throws) {
      for (const text of c.expected.messageIncludes ?? [])
        expect(() => geometry[c.kind](input)).toThrow(text);
    } else if (c.expected.returnsUndefined) expect(geometry[c.kind](input)).toBeUndefined();
    else expect(geometry[c.kind](input)).toEqual(c.expected);
  });
  it.each(Object.keys(fixtureDesign.opticalClasses))(
    "checks all metrics and tolerance for %s",
    (opticalClass) => {
      const rule = fixtureDesign.opticalClasses[opticalClass],
        /**
         * Returns the violated metric names for the current optical-class fixture.
         *
         * @param measurement - Measured glyph geometry to check against the current optical class.
         * @param design - Design constraints used for this geometry assertion.
         * @returns Metric names whose optical-class constraints were violated.
         */
        check = (measurement: Measurement, design = fixtureDesign) =>
          validateGlyphGeometry({
            measurement,
            opticalClass,
            design,
          }).violations.map((v: { metric: string }) => v.metric);
      const width = (rule.longestEdge[0] + rule.longestEdge[1]) / 2,
        height = 140;
      for (const metric of ["longestEdge"]) {
        const m = {
          ...measure(width, height),
          [metric]: rule[metric][0] - 2.01,
        };
        expect(check(m)).toContain(metric);
        expect(check({ ...m, [metric]: rule[metric][0] - 2 })).not.toContain(metric);
      }
      expect(check(measure(width, height, 480 + rule.centerTolerance + 0.01, 320))).toContain(
        "centerDistance",
      );
      const m = measure(width, height);
      m.bounds[0] = fixtureDesign.grid.safeBounds[0] - 0.000001;
      expect(check(m)).toContain("safeBounds");
    },
  );
  it("reports violations in fixed order and never uses rounded values", () => {
    const result = validateGlyphGeometry({
      measurement: {
        bounds: [0, 0, 1, 1],
        width: 1,
        height: 0,
        longestEdge: 1,
        aspectRatio: null,
        center: [0, 0],
        nonEmpty: true,
      },
      opticalClass: "regular",
      design: fixtureDesign,
    });
    expect(result.violations.map((v: { metric: string }) => v.metric)).toEqual([
      "nonEmpty",
      "safeBounds",
      "longestEdge",
      "centerDistance",
    ]);
    expect(
      validateGlyphGeometry({
        measurement: measure(677.9999999, 140),
        opticalClass: "regular",
        design: fixtureDesign,
      }).violations.map((v: { metric: string }) => v.metric),
    ).toContain("longestEdge");
  });
  it("transforms actual curves before measurement, including nested components", () => {
    const shape = {
      contours: [
        {
          closed: true,
          points: [
            { x: 0, y: 0, type: "line" },
            { x: 50, y: 100, type: "offcurve" },
            { x: 100, y: 0, type: "qcurve" },
          ],
        },
      ],
      components: [],
    };
    const transformed = {
      contours: [],
      components: [{ base: "shape", transform: [0, 2, -2, 0, 100, 20] }],
    };
    const result = measureGlyph({
      glyphName: "g",
      glyphs: new Map<string, unknown>([
        ["g", transformed],
        ["shape", shape],
      ]),
    });
    expect(result.bounds).toEqual([0, 20, 100, 220]);
    const direct = {
      contours: [
        {
          closed: true,
          points: [
            { x: 100, y: 20, type: "line" },
            { x: -100, y: 120, type: "offcurve" },
            { x: 100, y: 220, type: "qcurve" },
          ],
        },
      ],
      components: [],
    };
    expect(result).toEqual(
      measureGlyph({
        glyphName: "direct",
        glyphs: new Map([["direct", direct]]),
      }),
    );
  });
  it.each(["safe domain", "center distance", "point", "line"])(
    "checks jointly constrained %s",
    (mode) => {
      const d = structuredClone(fixtureDesign);
      d.grid = {
        safeBounds: [0, 0, 10, 10],
        opticalCenter: [5, 5],
        lengthTolerance: 0,
      };
      for (const name of Object.keys(d.opticalClasses))
        d.opticalClasses[name] = {
          longestEdge: [10, 10],
          centerTolerance: 1,
        };
      if (mode === "safe domain") {
        d.grid.safeBounds = [0, 0, 9, 9];
        d.grid.opticalCenter = [4, 5];
        expect(() => validateDesignGeometry(d)).toThrow("contradictory");
      } else if (mode === "center distance") {
        d.grid.safeBounds = [0, 0, 12, 10];
        d.grid.opticalCenter = [0, 0];
        expect(() => validateDesignGeometry(d)).toThrow("contradictory");
      } else {
        if (mode === "line") d.grid.safeBounds = [0, 0, 12, 10];
        expect(validateDesignGeometry(d)).toBeUndefined();
      }
    },
  );

  it("recomputes located stroke widths and rejects invalid normals, samples and filled annotations", () => {
    const contours = [{ closed: true, points: points(100, 100, 800, 170) }];
    const samples = [
      {
        id: "left",
        edgeA: { contour: 0, segment: 0, t: 0.25 },
        edgeB: { contour: 0, segment: 2, t: 0.75 },
        normal: [0, 1],
        width: 70,
      },
      {
        id: "right",
        edgeA: { contour: 0, segment: 0, t: 0.75 },
        edgeB: { contour: 0, segment: 2, t: 0.25 },
        normal: [0, 1],
        width: 70,
      },
    ];
    const input = {
      contours,
      samples,
      master: "outline-standard",
      design: fixtureDesign,
    };
    expect(geometry.validateStrokeSamples(input).violations).toEqual([]);
    expect(
      geometry.validateStrokeSamples({
        ...input,
        samples: [{ ...samples[0], width: 69 }, samples[1]],
      }).violations,
    ).toContainEqual(expect.objectContaining({ metric: "recordedStrokeWidth" }));
    expect(() =>
      geometry.validateStrokeSamples({
        ...input,
        samples: [{ ...samples[0], normal: [0, 2] }, samples[1]],
      }),
    ).toThrow("Invalid stroke");
    expect(() =>
      geometry.validateStrokeSamples({
        ...input,
        samples: [{ ...samples[0], edgeA: { contour: 2, segment: 0, t: 0 } }, samples[1]],
      }),
    ).toThrow("contour");
    expect(() => geometry.validateStrokeSamples({ ...input, master: "filled-standard" })).toThrow(
      "Filled",
    );
    expect(geometry.validateStrokeSamples({ ...input, samples: [] }).violations).not.toEqual([]);
  });
  it("bounds parallel edges without changing the fixed one-unit decision", () => {
    const original = [{ closed: true, points: points(100, 100, 800, 800) }];
    const translated = (distance: number) =>
      original.map((contour) => ({
        ...contour,
        points: contour.points.map((point) => ({
          ...point,
          x: point.x + distance,
        })),
      }));
    const coarse = geometry.compareOutlineBoundaries({
      sourceContours: original,
      compiledContours: translated(0.99),
      tolerance: 0.05,
    });
    expect(coarse.maxBoundaryUnits).toBeGreaterThanOrEqual(0.99);
    expect(coarse.maxBoundaryUnits).toBeLessThanOrEqual(1);
    const exact = geometry.compareOutlineBoundaries({
      sourceContours: original,
      compiledContours: translated(0.99),
      tolerance: 0.05,
      boundaryLimit: 1,
    });
    expect(exact.maxBoundaryUnits).toBeGreaterThanOrEqual(0.99);
    expect(exact.maxBoundaryUnits).toBeLessThanOrEqual(1);
    expect(exact.subdivisionErrorUnits).toBeLessThanOrEqual(0.05);
    expect(
      geometry.compareOutlineBoundaries({
        sourceContours: original,
        compiledContours: translated(1.1),
        tolerance: 0.05,
        boundaryLimit: 1,
      }).maxBoundaryUnits,
    ).toBeGreaterThan(1);
    expect(() =>
      geometry.compareOutlineBoundaries({
        sourceContours: original,
        compiledContours: original,
        tolerance: 0.05,
        boundaryLimit: 0,
      }),
    ).toThrow();
  });
  it("compares coincident edges independently of order and detects an added interior contour", () => {
    const outer = { closed: true, points: points(100, 100, 800, 800) };
    const reversed = { ...outer, points: [...outer.points].reverse() };
    expect(
      geometry.compareOutlineBoundaries({
        sourceContours: [outer],
        compiledContours: [reversed],
        tolerance: 0.05,
        boundaryLimit: 1,
      }).maxBoundaryUnits,
    ).toBe(0);
    expect(
      geometry.compareOutlineBoundaries({
        sourceContours: [outer],
        compiledContours: [outer, { closed: true, points: points(300, 300, 600, 600) }],
        tolerance: 0.05,
        boundaryLimit: 1,
      }).maxBoundaryUnits,
    ).toBeGreaterThan(1);
  });
  it("rejects a longest-edge placement that leaves only a zero-height boundary solution", () => {
    const design = structuredClone(fixtureDesign);
    design.grid = {
      safeBounds: [0, 0, 10, 10],
      opticalCenter: [4, 0],
      lengthTolerance: 0,
    };
    for (const name of Object.keys(design.opticalClasses))
      design.opticalClasses[name] = {
        longestEdge: [10, 10],
        centerTolerance: 1,
      };
    expect(() => validateDesignGeometry(design)).toThrow("contradictory");
    design.grid.opticalCenter = [4, 5];
    expect(validateDesignGeometry(design)).toBeUndefined();
  });
  it("permits only explicit reviewed exceptions and never exempts safe bounds", () => {
    const exception = {
      id: "edge",
      metric: "longestEdge",
      sampleId: null,
      allowed: [900, 920],
      reason: "isolated negative geometry fixture",
      reviewedBy: "fixture-reviewer",
      reviewedAt: "2026-10-06T00:00:00.000Z",
    };
    expect(() =>
      geometry.validateGeometryExceptions([{ ...exception, metric: "safeBounds" }]),
    ).toThrow();
    expect(() =>
      geometry.validateGeometryExceptions([{ ...exception, allowed: [920, 900] }]),
    ).toThrow();
    expect(() => geometry.validateGeometryExceptions([{ ...exception, reviewedBy: "" }])).toThrow();
    expect(() =>
      geometry.validateGeometryExceptions([
        { ...exception, metric: "strokeWidth", sampleId: "missing" },
      ]),
    ).toThrow();
    const result = validateGlyphGeometry({
      measurement: measure(910, 140),
      opticalClass: "regular",
      design: fixtureDesign,
      exceptions: [exception],
    });
    expect(result.violations.map((v: { metric: string }) => v.metric)).toEqual(["safeBounds"]);
  });
  it("checks analytic circle error and scaled frame radius without rounding away failures", async () => {
    const { circleFixtureContour } = await import(
      pathToFileURL(resolve(process.cwd(), "tests/assets/fonts/create-fixtures.helper.mjs")).href
    );
    const contour = circleFixtureContour(320);
    expect(
      geometry.measureCircleApproximation({
        contour,
        center: [480, 320],
        radius: 320,
        tolerance: 0.05,
      }),
    ).toBeLessThan(0.5);
    const flat = geometry.flattenGlyphContours([contour], 0.05);
    expect(flat.errorBound).toBeLessThanOrEqual(0.05);
    expect(() => geometry.flattenGlyphContours([contour], 0)).toThrow();
    expect(
      geometry.validateFrameCornerRadius({
        radius: 40,
        master: "outline-standard",
        design: fixtureDesign,
      }),
    ).toEqual([]);
    expect(
      geometry.validateFrameCornerRadius({
        radius: (40 * 82) / 70,
        master: "outline-compact",
        design: fixtureDesign,
      }),
    ).toEqual([]);
    expect(
      geometry.validateFrameCornerRadius({
        radius: 41,
        master: "outline-standard",
        design: fixtureDesign,
      }),
    ).not.toEqual([]);
  });
  it("rejects nonfinite coordinates and invalid segments", () => {
    expect(() =>
      measureGlyph({
        glyphName: "g",
        glyphs: new Map([
          [
            "g",
            {
              contours: [{ closed: true, points: [{ x: Infinity, y: 0, type: "line" }] }],
              components: [],
            },
          ],
        ]),
      }),
    ).toThrow("finite");
    expect(() =>
      measureGlyph({
        glyphName: "g",
        glyphs: new Map([
          [
            "g",
            {
              contours: [{ closed: false, points: points(0, 0, 1, 1) }],
              components: [],
            },
          ],
        ]),
      }),
    ).toThrow("open");
    expect(() =>
      measureGlyph({
        glyphName: "g",
        glyphs: new Map([
          [
            "g",
            {
              contours: [
                {
                  closed: true,
                  points: [
                    { x: 0, y: 0, type: "curve" },
                    { x: 1, y: 1, type: "line" },
                  ],
                },
              ],
              components: [],
            },
          ],
        ]),
      }),
    ).toThrow("two controls");
  });
});

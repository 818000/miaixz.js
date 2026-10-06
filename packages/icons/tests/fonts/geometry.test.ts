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
  pathToFileURL(resolve(process.cwd(), "tests/fixtures/icon-geometry/create-fixtures.mjs")).href
);
const temporary: string[] = [];
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
    for (const entry of await readdir(resolve(root, path), { withFileTypes: true })) {
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
            { closed: true, points: points(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2) },
          ],
          components: [],
        },
      ],
    ]),
  });
const cases = JSON.parse(
  await readFile(
    resolve(process.cwd(), "tests/fixtures/icon-geometry/geometry-cases.json"),
    "utf8",
  ),
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
          validateGlyphGeometry({ measurement, opticalClass, design }).violations.map(
            (v: { metric: string }) => v.metric,
          );
      const width = (rule.width[0] + rule.width[1]) / 2,
        height = (rule.height[0] + rule.height[1]) / 2;
      for (const metric of ["width", "height", "longestEdge", "aspectRatio"]) {
        const m = {
          ...measure(width, height),
          [metric]: rule[metric][0] - (metric === "aspectRatio" ? 0.01 : 2.01),
        };
        expect(check(m)).toContain(metric);
        expect(
          check({ ...m, [metric]: rule[metric][0] - (metric === "aspectRatio" ? 0 : 2) }),
        ).not.toContain(metric);
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
      "width",
      "height",
      "aspectRatio",
      "centerDistance",
    ]);
    expect(
      validateGlyphGeometry({
        measurement: measure(747.9999999, 760),
        opticalClass: "regular",
        design: fixtureDesign,
      }).violations.map((v: { metric: string }) => v.metric),
    ).toContain("width");
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
      measureGlyph({ glyphName: "direct", glyphs: new Map([["direct", direct]]) }),
    );
  });
  it.each(["safe domain", "center distance", "point", "line"])(
    "checks jointly constrained %s",
    (mode) => {
      const d = structuredClone(fixtureDesign);
      d.grid = { safeBounds: [0, 0, 10, 10], opticalCenter: [5, 5], lengthTolerance: 0 };
      for (const name of Object.keys(d.opticalClasses))
        d.opticalClasses[name] = {
          width: [10, 10],
          height: [10, 10],
          longestEdge: [10, 10],
          aspectRatio: [1, 1],
          centerTolerance: 1,
        };
      if (mode === "safe domain") {
        d.grid.safeBounds = [0, 0, 9, 10];
        d.grid.opticalCenter = [4, 5];
        expect(() => validateDesignGeometry(d)).toThrow("contradictory");
      } else if (mode === "center distance") {
        d.grid.safeBounds = [0, 0, 12, 10];
        d.grid.opticalCenter = [0, 5];
        expect(() => validateDesignGeometry(d)).toThrow("contradictory");
      } else {
        if (mode === "line") d.grid.safeBounds = [0, 0, 12, 10];
        expect(validateDesignGeometry(d)).toBeUndefined();
      }
    },
  );
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
          ["g", { contours: [{ closed: false, points: points(0, 0, 1, 1) }], components: [] }],
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

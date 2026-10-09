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
 * Checks independent six-master interpolation with arithmetic fixture expectations.
 */
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

const root = resolve(process.cwd(), "../..");
/**
 * * Loads one repository module without executing its guarded CLI.
 * @param path - Repository-relative module path.
 * @returns Imported module exports.
 */
const load = (path: string) => import(pathToFileURL(resolve(root, path)).href);
const interpolation = await load(".github/scripts/modules/icons/fonts/interpolate-icon-source.mjs");
const reader = await load(".github/scripts/modules/icons/fonts/read-font-source.mjs");
const fixture = await load("packages/icons/tests/assets/fonts/create-fixtures.helper.mjs");
const temporary: string[] = [];
afterEach(async () => {
  for (const path of temporary.splice(0)) await rm(path, { recursive: true, force: true });
});

/**
 * Creates six actual parsed GLIF maps, then gives their x positions an independently specified offset.
 * @returns Fresh isolated compatible six-master source and paths.
 */
async function input() {
  const directory = await mkdtemp(resolve(tmpdir(), "miaixz-interpolation-"));
  temporary.push(directory);
  const paths = await fixture.createIconFixture({
    directory,
    categories: [{ id: "actions", description: "Actions; excludes navigation" }],
    records: [
      {
        name: "alpha",
        codepoint: 0xf0000,
        category: "actions",
        opticalClass: "regular",
        rtl: "none",
      },
    ],
    design: structuredClone(fixture.fixtureDesign),
  });
  const source = await reader.inspectFontSource({ fontsRoot: paths.fontsRoot });
  for (const [i, map] of source.rawMasters.entries())
    for (const point of map.get("miaixz.alpha").contours[0].points) point.x += i * 10;
  return source;
}
describe("independent source interpolation", () => {
  it("distinguishes a sub-unit counter collapse from a stable integer-grid counter", () => {
    for (const direction of [1, -1]) {
      /**
       * Defines an independent counter on both sides of the font's integer-grid boundary.
       * @param radius - Half-width and half-height in font units.
       * @returns Four original line points around the fixed fixture center.
       */
      const square = (radius: number) => ({
        closed: true,
        points: [
          [480 - radius, 320 - radius],
          [480 + radius, 320 - radius],
          [480 + radius, 320 + radius],
          [480 - radius, 320 + radius],
        ].map(([x, y]) => ({ x: x!, y: y!, type: "line" })),
      });
      const tiny = square(0.2),
        stable = square(2);
      if (direction < 0) {
        tiny.points.reverse();
        stable.points.reverse();
      }
      /**
       * Quantizes fixture line nodes without changing order or winding deliberately.
       * @param contour - Independent original counter, never modified.
       * @returns Integer-grid contour matching the line-node storage constraint.
       */
      const rounded = (contour: typeof tiny) => ({
        ...contour,
        points: contour.points.map((point) => ({
          ...point,
          x: Math.round(point.x),
          y: Math.round(point.y),
        })),
      });
      expect(Math.sign(interpolation.contourSignedArea(tiny))).toBe(direction);
      expect(interpolation.contourSignedArea(rounded(tiny))).toBe(0);
      expect(interpolation.contourSignedArea(rounded(stable))).toBeCloseTo(direction * 16, 12);
    }
  });

  it("rejects a hidden half-turn collapse even when all six master windings agree", async () => {
    const source = await input();
    for (const [index, map] of source.rawMasters.entries()) {
      const contour = map.get("miaixz.alpha").contours[0];
      contour.points.forEach((point: { x: number; y: number }) => {
        point.x -= index * 10;
        if (index % 3 === 0) {
          point.x = 960 - point.x;
          point.y = 640 - point.y;
        }
      });
    }
    expect(() =>
      interpolation.compatibleSourceContours({ source, glyphName: "miaixz.alpha" }),
    ).not.toThrow();
    expect(() =>
      interpolation.interpolateIconSource({
        source,
        glyphName: "miaixz.alpha",
        fill: 0.5,
        opticalSize: 18,
      }),
    ).toThrow(/collapses/u);
  });

  it.each(
    [12, 16, 20, 24, 32, 40].flatMap((size) =>
      [0, 0.25, 0.5, 0.75, 1].map((fill) => ({ size, fill })),
    ),
  )("uses actual tensor-product coordinates at opsz=$size/FILL=$fill", async ({ size, fill }) => {
    const source = await input();
    const result = interpolation.interpolateIconSource({
      source,
      glyphName: "miaixz.alpha",
      fill,
      opticalSize: size,
    });
    const optical = size <= 24 ? ((size - 12) / 12) * 10 : 10 + ((size - 24) / 16) * 10;
    expect(result.contours[0].points[0].x).toBeCloseTo(100 + fill * 30 + optical, 10);
    expect(result.contours[0].points[0].y).toBe(-60);
    expect(result.measurement.width).toBeCloseTo(760, 10);
    expect(result.measurement.height).toBeCloseTo(760, 10);
  });
  it.each([
    [NaN, 24],
    [Infinity, 24],
    [-0.1, 24],
    [1.1, 24],
    [0, NaN],
    [0, 11],
    [0, 41],
  ])("rejects source axes without runtime clamping: %s / %s", (fill, size) => {
    expect(() => interpolation.sourceWeights(fill, size)).toThrow();
  });
  it("converts font coordinates to the unchanged SVG baseline and uses no compiled outlines", async () => {
    const source = await input();
    const result = interpolation.interpolateIconSource({
      source,
      glyphName: "miaixz.alpha",
      fill: 0,
      opticalSize: 12,
    });
    expect(interpolation.sourceSvgPath(result)).toContain("M2.5 21.5");
    expect(interpolation.sourceSvg(result)).toContain('viewBox="0 0 24 24"');
    expect(interpolation.sourceSvg(result)).toContain('fill-rule="nonzero"');
    const behavior = interpolation.measureSourceAxisBehavior(
      interpolation.compatibleSourceContours({
        source,
        glyphName: "miaixz.alpha",
      }),
    );
    expect(behavior).toEqual({ fill: "changes", opticalSize: "changes" });
  });
  it.each(["point name", "point type", "component", "missing master", "orientation"])(
    "rejects incompatible %s instead of repairing or reordering it",
    async (mode) => {
      const source = await input(),
        glyph = source.rawMasters[5].get("miaixz.alpha");
      if (mode === "point name") glyph.contours[0].points[0].name = "different";
      if (mode === "point type") glyph.contours[0].points[0].type = "curve";
      if (mode === "component")
        glyph.components.push({
          outlineIndex: 1,
          base: "missing",
          transform: [1, 0, 0, 1, 0, 0],
        });
      if (mode === "missing master") source.rawMasters.pop();
      if (mode === "orientation") glyph.contours[0].points.reverse();
      expect(() =>
        interpolation.compatibleSourceContours({
          source,
          glyphName: "miaixz.alpha",
        }),
      ).toThrow();
    },
  );
  it("safely expands matching components and preserves true hole orientation", async () => {
    const source = await input();
    for (const map of source.rawMasters) {
      const glyph = map.get("miaixz.alpha");
      const inner = structuredClone(glyph.contours[0]);
      inner.outlineIndex = 1;
      inner.points = inner.points
        .map((p: { x: number; y: number }) => ({
          ...p,
          x: 480 + (p.x - 480) / 2,
          y: 320 + (p.y - 320) / 2,
        }))
        .reverse();
      glyph.contours.push(inner);
      map.set("component-shape", structuredClone(glyph));
      glyph.contours = [];
      glyph.components = [
        {
          outlineIndex: 0,
          base: "component-shape",
          transform: [1, 0, 0, 1, 0, 0],
        },
      ];
    }
    const result = interpolation.interpolateIconSource({
      source,
      glyphName: "miaixz.alpha",
      fill: 0.5,
      opticalSize: 20,
    });
    expect(result.contours).toHaveLength(2);
    expect(Math.sign(interpolation.contourSignedArea(result.contours[0]))).toBe(1);
    expect(Math.sign(interpolation.contourSignedArea(result.contours[1]))).toBe(-1);
  });
});

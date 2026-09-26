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
 * Verifies six-master point-count and contour-direction rejection.
 */

import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { describe, expect, it } from "vitest";

const repositoryRoot = resolve(process.cwd(), "../..");
const moduleUrl = pathToFileURL(
  resolve(repositoryRoot, ".github/scripts/modules/icons/fonts/validate.mjs"),
).href;
const { validateGlyphTopology } = (await import(moduleUrl)) as {
  validateGlyphTopology: (
    glyphName: string,
    sources: readonly { master: string; xml: string }[],
  ) => void;
};

/**
 * Creates one simple closed GLIF from ordered points.
 *
 * @param points - Coordinate pairs.
 * @returns GLIF XML.
 */
function glif(points: readonly (readonly [number, number])[]): string {
  return `<glyph name="miaixz.test" format="2">
  <advance width="960"/>
  <unicode hex="0F0000"/>
  <outline><contour>${points
    .map(([x, y]) => `<point x="${x}" y="${y}" type="line"/>`)
    .join("")}</contour></outline>
</glyph>`;
}

const clockwise = glif([
  [0, 0],
  [0, 100],
  [100, 100],
  [100, 0],
]);

/**
 * Produces the required six-source topology input.
 *
 * @param replacement - Optional XML for the last master.
 * @returns Six named source documents.
 */
function six(replacement = clockwise) {
  return Array.from({ length: 6 }, (_, index) => ({
    master: `master-${index}`,
    xml: index === 5 ? replacement : clockwise,
  }));
}

describe("six-master topology gate", () => {
  it("accepts matching compatible topology", () => {
    expect(() => validateGlyphTopology("miaixz.test", six())).not.toThrow();
  });

  it("rejects a point-count mismatch", () => {
    const threePoints = glif([
      [0, 0],
      [0, 100],
      [100, 0],
    ]);
    expect(() => validateGlyphTopology("miaixz.test", six(threePoints))).toThrow(
      /topology differs/u,
    );
  });

  it("rejects a contour-direction mismatch", () => {
    const counterClockwise = glif([
      [100, 0],
      [100, 100],
      [0, 100],
      [0, 0],
    ]);
    expect(() => validateGlyphTopology("miaixz.test", six(counterClockwise))).toThrow(
      /topology differs/u,
    );
  });
});

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
 * Verifies interpolation rejection for self-intersection, reversal, and
 * disappearing intermediate fragments.
 */

import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { describe, expect, it } from "vitest";

const repositoryRoot = resolve(process.cwd(), "../..");
const moduleUrl = pathToFileURL(
  resolve(repositoryRoot, ".github/scripts/modules/icons/fonts/validate-icon-font.mjs"),
).href;
const { validateInterpolatedGlyphGeometry } = (await import(moduleUrl)) as {
  validateInterpolatedGlyphGeometry: (
    glyphName: string,
    startXml: string,
    endXml: string,
    options?: { samples?: readonly number[] },
  ) => void;
};

/**
 * Creates one closed line-contour GLIF.
 *
 * @param points - Ordered coordinate pairs.
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

const square = glif([
  [100, 100],
  [100, 300],
  [300, 300],
  [300, 100],
]);

describe("intermediate geometry gate", () => {
  it("accepts a bounded non-crossing interpolation", () => {
    const translated = glif([
      [200, 200],
      [200, 400],
      [400, 400],
      [400, 200],
    ]);
    expect(() =>
      validateInterpolatedGlyphGeometry("miaixz.test", square, translated),
    ).not.toThrow();
  });

  it("rejects an injected self-intersection", () => {
    const bowTie = glif([
      [100, 100],
      [300, 300],
      [100, 300],
      [300, 100],
    ]);
    expect(() => validateInterpolatedGlyphGeometry("miaixz.test", bowTie, bowTie)).toThrow(
      /self-intersects/u,
    );
  });

  it("rejects an endpoint direction reversal", () => {
    const reversed = glif([
      [300, 100],
      [300, 300],
      [100, 300],
      [100, 100],
    ]);
    expect(() => validateInterpolatedGlyphGeometry("miaixz.test", square, reversed)).toThrow(
      /topology or direction differs/u,
    );
  });

  it("rejects an invisible intermediate fragment", () => {
    const halfTurn = glif([
      [300, 300],
      [300, 100],
      [100, 100],
      [100, 300],
    ]);
    expect(() =>
      validateInterpolatedGlyphGeometry("miaixz.test", square, halfTurn, {
        samples: [0.5],
      }),
    ).toThrow(/invisible fragment/u);
  });
});

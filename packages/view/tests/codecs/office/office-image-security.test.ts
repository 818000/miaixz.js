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
 * Verifies embedded Office image budgets and SVG script isolation.
 */

import { validateOfficeImage } from "../../../src/codecs/office/ooxml-codec.js";
import { defaultResourceBudget } from "../../../src/runtime/resource-budget.js";

const encoder = new TextEncoder();

/**
 * Creates the bounded PNG header used by image-budget tests.
 *
 * @param width - Encoded image width.
 * @param height - Encoded image height.
 * @returns Minimal PNG header bytes.
 */
function png(width: number, height: number): Uint8Array {
  const bytes = new Uint8Array(24);
  bytes.set([0x89, 0x50, 0x4e, 0x47], 0);
  const view = new DataView(bytes.buffer);
  view.setUint32(16, width);
  view.setUint32(20, height);
  return bytes;
}

describe("Office image security", () => {
  it("accepts bounded PNG, GIF, JPEG, and self-contained SVG images", () => {
    const gif = new Uint8Array(10);
    gif.set(encoder.encode("GIF"));
    new DataView(gif.buffer).setUint16(6, 12, true);
    new DataView(gif.buffer).setUint16(8, 8, true);
    const jpeg = new Uint8Array(21);
    jpeg.set([0xff, 0xd8, 0xff, 0xc0, 0, 17, 8, 0, 10, 0, 20]);
    expect(() => validateOfficeImage(png(16, 9), "image/png", defaultResourceBudget)).not.toThrow();
    expect(() => validateOfficeImage(gif, "image/gif", defaultResourceBudget)).not.toThrow();
    expect(() => validateOfficeImage(jpeg, "image/jpeg", defaultResourceBudget)).not.toThrow();
    expect(() =>
      validateOfficeImage(
        encoder.encode(
          '<svg xmlns="urn:safe"><defs><path id="p" d="M0 0L1 1"/></defs><use href="#p"/></svg>',
        ),
        "image/svg+xml",
        defaultResourceBudget,
      ),
    ).not.toThrow();
  });

  it("rejects malformed and over-budget raster image headers", () => {
    expect(() =>
      validateOfficeImage(new Uint8Array(24), "image/png", defaultResourceBudget),
    ).toThrow("[PARSE_FAILED]");
    expect(() =>
      validateOfficeImage(new Uint8Array([0xff, 0xd8, 0xff]), "image/jpeg", defaultResourceBudget),
    ).toThrow("[PARSE_FAILED]");
    expect(() =>
      validateOfficeImage(png(100, 100), "image/png", {
        ...defaultResourceBudget,
        maxImagePixels: 100,
      }),
    ).toThrow("[RESOURCE_LIMIT_EXCEEDED]");
  });

  it.each([
    "<svg><script>bad()</script></svg>",
    "<svg><foreignObject><div/></foreignObject></svg>",
    '<svg onload="bad()"/>',
    '<svg><image href="https://invalid.example/image.png"/></svg>',
    '<svg><image href="data:image/svg+xml;base64,PHN2Zy8+"/></svg>',
    '<svg><rect style="fill:url(http://invalid.example/fill)"/></svg>',
  ])("blocks active or remotely loaded SVG markup", (source) => {
    expect(() =>
      validateOfficeImage(encoder.encode(source), "image/svg+xml", defaultResourceBudget),
    ).toThrow("[SECURITY_BLOCKED]");
  });

  it("rejects invalid UTF-8 and non-SVG XML roots", () => {
    expect(() =>
      validateOfficeImage(new Uint8Array([0xff]), "image/svg+xml", defaultResourceBudget),
    ).toThrow("[PARSE_FAILED]");
    expect(() =>
      validateOfficeImage(encoder.encode("<root/>"), "image/svg+xml", defaultResourceBudget),
    ).toThrow("[PARSE_FAILED]");
  });
});

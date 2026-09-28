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
 * Verifies EMF+ fallback accounting without requiring a native metafile runtime.
 */

import { decodeEmf } from "../../../src/codecs/office/emf-codec.js";
import { defaultResourceBudget } from "../../../src/runtime/resource-budget.js";

/**
 * Creates a minimal EMF containing one EMF+ header comment.
 *
 * @param dual - Whether the EMF+ header promises a complete standard EMF fallback.
 * @returns Complete minimal EMF byte sequence.
 */
function emfPlusHeader(dual: boolean): Uint8Array {
  const bytes = new Uint8Array(140);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, 1, true);
  view.setUint32(4, 88, true);
  view.setInt32(16, 100, true);
  view.setInt32(20, 100, true);

  view.setUint32(88, 70, true);
  view.setUint32(92, 44, true);
  view.setUint32(96, 32, true);
  view.setUint32(100, 0x2b464d45, true);
  view.setUint16(104, 0x4001, true);
  view.setUint16(106, dual ? 1 : 0, true);
  view.setUint32(108, 28, true);
  view.setUint32(112, 16, true);

  view.setUint32(132, 14, true);
  view.setUint32(136, 8, true);
  return bytes;
}

describe("EMF codec", () => {
  it("accepts EMF+ comments only when the header declares an equivalent dual fallback", () => {
    expect(decodeEmf(emfPlusHeader(true), defaultResourceBudget)).toMatchObject({
      recordCount: 3,
      unsupportedRecords: [],
      visible: false,
    });
    expect(decodeEmf(emfPlusHeader(false), defaultResourceBudget)).toMatchObject({
      recordCount: 3,
      unsupportedRecords: [70],
      visible: false,
    });
  });

  it("reports the exact vector-record budget that rejected the metafile", () => {
    expect(() =>
      decodeEmf(emfPlusHeader(true), { ...defaultResourceBudget, maxVectorRecords: 2 }),
    ).toThrow(
      expect.objectContaining({
        code: "RESOURCE_LIMIT_EXCEEDED",
        resourceLimit: { field: "maxVectorRecords", actual: 3, allowed: 2 },
      }),
    );
  });
});

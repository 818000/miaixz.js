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
 * Provides the bounded byte codec over immutable binary source data.
 */

import { ViewerError } from "../../shared/errors/viewer-error.js";

/**
 * Reads bounded little- or big-endian values without changing the source.
 */
export class ByteReader {
  readonly #bytes: Uint8Array;
  readonly #view: DataView;

  /**
   * Wraps a read-only byte sequence.
   *
   * @param bytes - Source bytes retained by the reader without copying.
   */
  constructor(bytes: Uint8Array) {
    this.#bytes = bytes;
    this.#view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  }

  /**
   * Reports the available byte count.
   *
   * @returns Number of readable bytes.
   */
  get length(): number {
    return this.#bytes.length;
  }

  /**
   * Reads an unsigned 16-bit integer.
   *
   * @param offset - Zero-based byte offset of the integer.
   * @param littleEndian - Whether to decode the integer in little-endian order.
   * @returns Decoded unsigned 16-bit value.
   */
  uint16(offset: number, littleEndian = true): number {
    this.#check(offset, 2);
    return this.#view.getUint16(offset, littleEndian);
  }

  /**
   * Reads an unsigned 32-bit integer.
   *
   * @param offset - Zero-based byte offset of the integer.
   * @param littleEndian - Whether to decode the integer in little-endian order.
   * @returns Decoded unsigned 32-bit value.
   */
  uint32(offset: number, littleEndian = true): number {
    this.#check(offset, 4);
    return this.#view.getUint32(offset, littleEndian);
  }

  /**
   * Returns a bounded read-only slice view.
   *
   * @param offset - Zero-based byte offset at which the slice begins.
   * @param length - Number of bytes included in the slice.
   * @returns Read-only view over the requested byte range.
   */
  slice(offset: number, length: number): Uint8Array {
    this.#check(offset, length);
    return this.#bytes.subarray(offset, offset + length);
  }

  /**
   * Verifies that a requested byte range stays inside the source.
   *
   * @param offset - Zero-based byte offset at which the range begins.
   * @param length - Number of bytes requested from the source.
   */
  #check(offset: number, length: number): void {
    if (
      !Number.isSafeInteger(offset) ||
      !Number.isSafeInteger(length) ||
      offset < 0 ||
      length < 0 ||
      offset + length > this.length
    ) {
      throw new ViewerError("PARSE_FAILED", "parse");
    }
  }
}

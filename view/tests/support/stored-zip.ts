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
 * Creates deterministic uncompressed ZIP fixtures without runtime dependencies.
 */

const encoder = new TextEncoder();

/**
 * Writes a little-endian unsigned integer into a byte array.
 *
 * @param target - Destination byte array.
 * @param offset - Zero-based write position.
 * @param value - Unsigned integer value.
 * @param width - Number of bytes to write.
 */
function writeInteger(target: Uint8Array, offset: number, value: number, width: 2 | 4): void {
  for (let index = 0; index < width; index += 1) {
    target[offset + index] = (value >>> (index * 8)) & 0xff;
  }
}

/**
 * Concatenates byte arrays without retaining input buffers.
 *
 * @param parts - Byte arrays in output order.
 * @returns Combined owned byte array.
 */
function concatenate(parts: readonly Uint8Array[]): Uint8Array {
  const output = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

/**
 * Creates a deterministic stored ZIP archive suitable for codec tests.
 *
 * @param entries - UTF-8 file contents keyed by normalized archive path.
 * @returns Minimal classic ZIP archive.
 */
export function storedZip(entries: Readonly<Record<string, string>>): Uint8Array {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let localOffset = 0;
  for (const [path, source] of Object.entries(entries)) {
    const name = encoder.encode(path);
    const data = encoder.encode(source);
    const local = new Uint8Array(30 + name.length + data.length);
    writeInteger(local, 0, 0x04034b50, 4);
    writeInteger(local, 4, 20, 2);
    writeInteger(local, 18, data.length, 4);
    writeInteger(local, 22, data.length, 4);
    writeInteger(local, 26, name.length, 2);
    local.set(name, 30);
    local.set(data, 30 + name.length);
    localParts.push(local);

    const central = new Uint8Array(46 + name.length);
    writeInteger(central, 0, 0x02014b50, 4);
    writeInteger(central, 4, 20, 2);
    writeInteger(central, 6, 20, 2);
    writeInteger(central, 20, data.length, 4);
    writeInteger(central, 24, data.length, 4);
    writeInteger(central, 28, name.length, 2);
    writeInteger(central, 42, localOffset, 4);
    central.set(name, 46);
    centralParts.push(central);
    localOffset += local.length;
  }
  const central = concatenate(centralParts);
  const end = new Uint8Array(22);
  writeInteger(end, 0, 0x06054b50, 4);
  writeInteger(end, 8, centralParts.length, 2);
  writeInteger(end, 10, centralParts.length, 2);
  writeInteger(end, 12, central.length, 4);
  writeInteger(end, 16, localOffset, 4);
  return concatenate([...localParts, central, end]);
}

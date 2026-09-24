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
 * Provides the bounded ZIP archive codec and entry decompression.
 */

import type { ResourceBudget } from "../../shared/contracts/resource-budget.js";
import { ViewerError } from "../../shared/errors/viewer-error.js";
import { ByteReader } from "../binary/byte-codec.js";

/**
 * Describes one central-directory entry.
 */
export interface ZipEntry {
  readonly path: string;
  readonly compressedSize: number;
  readonly uncompressedSize: number;
  readonly compressionMethod: number;
  readonly localHeaderOffset: number;
  readonly directory: boolean;
  readonly encrypted: boolean;
}

const decoder = new TextDecoder();

/**
 * Locates the classic ZIP end-of-central-directory record.
 *
 * @param bytes - Complete ZIP source bytes.
 * @returns Byte offset of the end-of-central-directory signature.
 */
function findEndOfCentralDirectory(bytes: Uint8Array): number {
  const minimum = Math.max(0, bytes.length - 65_557);
  for (let offset = bytes.length - 22; offset >= minimum; offset -= 1) {
    if (
      bytes[offset] === 0x50 &&
      bytes[offset + 1] === 0x4b &&
      bytes[offset + 2] === 0x05 &&
      bytes[offset + 3] === 0x06
    ) {
      return offset;
    }
  }
  throw new ViewerError("PARSE_FAILED", "parse");
}

/**
 * Expands one raw DEFLATE stream through the browser decompression primitive.
 *
 * @param bytes - Compressed raw DEFLATE bytes.
 * @returns Expanded byte sequence.
 */
async function inflateRaw(bytes: Uint8Array): Promise<Uint8Array> {
  try {
    const stream = new Blob([Uint8Array.from(bytes).buffer])
      .stream()
      .pipeThrough(new DecompressionStream("deflate-raw"));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  } catch {
    throw new ViewerError("PARSE_FAILED", "parse");
  }
}

/**
 * Parses and safely reads a classic ZIP archive without third-party runtime code.
 */
export class ZipArchive {
  readonly entries: readonly ZipEntry[];
  readonly #reader: ByteReader;
  readonly #budget: ResourceBudget;

  /**
   * Parses the central directory and enforces entry-count limits.
   *
   * @param bytes - Complete ZIP source bytes.
   * @param budget - Security limits applied while indexing archive entries.
   */
  constructor(bytes: Uint8Array, budget: ResourceBudget) {
    this.#reader = new ByteReader(bytes);
    this.#budget = budget;
    const end = findEndOfCentralDirectory(bytes);
    const entryCount = this.#reader.uint16(end + 10);
    const directorySize = this.#reader.uint32(end + 12);
    const directoryOffset = this.#reader.uint32(end + 16);
    if (entryCount > budget.maxArchiveEntries || directoryOffset + directorySize > bytes.length) {
      throw new ViewerError("RESOURCE_LIMIT_EXCEEDED", "parse");
    }
    const entries: ZipEntry[] = [];
    let totalExpandedBytes = 0;
    let offset = directoryOffset;
    for (let index = 0; index < entryCount; index += 1) {
      if (this.#reader.uint32(offset) !== 0x02014b50) {
        throw new ViewerError("PARSE_FAILED", "parse");
      }
      const flags = this.#reader.uint16(offset + 8);
      const compressionMethod = this.#reader.uint16(offset + 10);
      const compressedSize = this.#reader.uint32(offset + 20);
      const uncompressedSize = this.#reader.uint32(offset + 24);
      const nameLength = this.#reader.uint16(offset + 28);
      const extraLength = this.#reader.uint16(offset + 30);
      const commentLength = this.#reader.uint16(offset + 32);
      const localHeaderOffset = this.#reader.uint32(offset + 42);
      const path = decoder.decode(this.#reader.slice(offset + 46, nameLength));
      if (path.includes("\0") || path.split("/").includes("..")) {
        throw new ViewerError("PARSE_FAILED", "parse");
      }
      entries.push({
        path,
        compressedSize,
        uncompressedSize,
        compressionMethod,
        localHeaderOffset,
        directory: path.endsWith("/"),
        encrypted: (flags & 1) !== 0,
      });
      totalExpandedBytes += uncompressedSize;
      if (totalExpandedBytes > budget.maxExpandedBytes) {
        throw new ViewerError("RESOURCE_LIMIT_EXCEEDED", "parse");
      }
      if (compressedSize > 0 && uncompressedSize / compressedSize > budget.maxCompressionRatio) {
        throw new ViewerError("RESOURCE_LIMIT_EXCEEDED", "parse");
      }
      offset += 46 + nameLength + extraLength + commentLength;
    }
    this.entries = entries;
  }

  /**
   * Reads and decompresses one entry subject to source and expansion limits.
   *
   * @param path - Exact normalized path of the archive entry.
   * @returns Uncompressed entry bytes.
   */
  async read(path: string): Promise<Uint8Array> {
    const entry = this.entries.find((candidate) => candidate.path === path);
    if (entry === undefined || entry.directory || entry.encrypted) {
      throw new ViewerError("PARSE_FAILED", "parse");
    }
    if (entry.uncompressedSize > this.#budget.maxArchiveEntryBytes) {
      throw new ViewerError("RESOURCE_LIMIT_EXCEEDED", "parse");
    }
    const offset = entry.localHeaderOffset;
    if (this.#reader.uint32(offset) !== 0x04034b50) {
      throw new ViewerError("PARSE_FAILED", "parse");
    }
    const nameLength = this.#reader.uint16(offset + 26);
    const extraLength = this.#reader.uint16(offset + 28);
    const compressed = this.#reader.slice(
      offset + 30 + nameLength + extraLength,
      entry.compressedSize,
    );
    let result: Uint8Array;
    if (entry.compressionMethod === 0) result = compressed.slice();
    else if (entry.compressionMethod === 8) result = await inflateRaw(compressed);
    else throw new ViewerError("PARSE_FAILED", "parse");
    if (
      result.length !== entry.uncompressedSize ||
      result.length > this.#budget.maxArchiveEntryBytes
    ) {
      throw new ViewerError("PARSE_FAILED", "parse");
    }
    return result;
  }

  /**
   * Decodes one UTF-8 XML or text entry.
   *
   * @param path - Exact normalized path of the archive entry.
   * @returns UTF-8 text decoded from the requested entry.
   */
  async text(path: string): Promise<string> {
    return decoder.decode(await this.read(path));
  }
}

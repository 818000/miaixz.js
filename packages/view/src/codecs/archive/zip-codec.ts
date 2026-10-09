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
import { decompressBounded } from "../../runtime/decompress-bounded.js";
import { ResourceBudgetGuard } from "../../runtime/resource-budget-guard.js";
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
const utf8PathDecoder = new TextDecoder("utf-8", { fatal: true });
const legacyPathDecoder = new TextDecoder("windows-1252", { fatal: true });
const encoder = new TextEncoder();

/**
 * Avoids false positives from small, highly repetitive Office metadata while total and per-entry
 * expansion limits continue to bound every archive.
 */
const compressionRatioMinimumBytes = 16 * 1024 * 1024;

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
      const commentLength = (bytes[offset + 20] ?? 0) | ((bytes[offset + 21] ?? 0) << 8);
      if (offset + 22 + commentLength === bytes.length) return offset;
    }
  }
  throw new ViewerError("PARSE_FAILED", "parse");
}

/**
 * Configures one bounded archive instance.
 */
export interface ZipArchiveOptions {
  readonly budget: ResourceBudget;
  readonly depth?: number;
  readonly guard: ResourceBudgetGuard;
  readonly signal: AbortSignal;
}

interface IndexedZipEntry {
  readonly entry: ZipEntry;
  readonly flags: number;
}

/**
 * Decodes a central-directory name as strict UTF-8.
 *
 * @param bytes - Raw name bytes.
 * @param utf8 - Whether the ZIP UTF-8 general-purpose flag is set.
 * @returns Decoded path.
 */
function decodePath(bytes: Uint8Array, utf8: boolean): string {
  try {
    return (utf8 ? utf8PathDecoder : legacyPathDecoder).decode(bytes);
  } catch {
    throw new ViewerError("PARSE_FAILED", "parse");
  }
}

/**
 * Rejects paths which could escape a virtual archive root or exhaust path processing.
 *
 * @param path - Decoded central-directory path.
 */
function assertSafePath(path: string): void {
  const segments = path.split("/");
  if (
    path.length === 0 ||
    path.includes("\0") ||
    path.includes("\\") ||
    path.startsWith("/") ||
    /^[A-Za-z]:/u.test(path) ||
    segments.includes("..") ||
    segments.length > 256 ||
    encoder.encode(path).byteLength > 4096
  ) {
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
  readonly #guard: ResourceBudgetGuard;
  readonly #signal: AbortSignal;
  readonly #indexedEntries = new Map<string, IndexedZipEntry>();

  /**
   * Parses the central directory and enforces entry-count limits.
   *
   * @param bytes - Complete ZIP source bytes.
   * @param options - Security limits and session accounting applied to the archive.
   */
  constructor(bytes: Uint8Array, options: ZipArchiveOptions | ResourceBudget) {
    const resolvedOptions: ZipArchiveOptions =
      "budget" in options
        ? options
        : {
            budget: options,
            guard: new ResourceBudgetGuard(options),
            signal: new AbortController().signal,
          };
    const { budget, guard, signal } = resolvedOptions;
    this.#reader = new ByteReader(bytes);
    this.#budget = budget;
    this.#guard = guard;
    this.#signal = signal;
    guard.assertDepth(resolvedOptions.depth ?? 0, "maxArchiveDepth");
    guard.checkpoint(signal);
    const end = findEndOfCentralDirectory(bytes);
    const disk = this.#reader.uint16(end + 4);
    const directoryDisk = this.#reader.uint16(end + 6);
    const diskEntryCount = this.#reader.uint16(end + 8);
    const entryCount = this.#reader.uint16(end + 10);
    const directorySize = this.#reader.uint32(end + 12);
    const directoryOffset = this.#reader.uint32(end + 16);
    if (
      disk !== 0 ||
      directoryDisk !== 0 ||
      diskEntryCount !== entryCount ||
      entryCount === 0xffff ||
      directorySize === 0xffffffff ||
      directoryOffset === 0xffffffff
    ) {
      throw new ViewerError("PARSE_FAILED", "parse");
    }
    if (entryCount > budget.maxArchiveEntries) {
      throw new ViewerError("RESOURCE_LIMIT_EXCEEDED", "parse");
    }
    if (directoryOffset + directorySize !== end) throw new ViewerError("PARSE_FAILED", "parse");
    const entries: ZipEntry[] = [];
    let totalExpandedBytes = 0;
    let offset = directoryOffset;
    for (let index = 0; index < entryCount; index += 1) {
      if ((index & 0xff) === 0) guard.checkpoint(signal);
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
      const path = decodePath(this.#reader.slice(offset + 46, nameLength), (flags & 0x0800) !== 0);
      assertSafePath(path);
      if (this.#indexedEntries.has(path)) throw new ViewerError("PARSE_FAILED", "parse");
      const entry: ZipEntry = {
        path,
        compressedSize,
        uncompressedSize,
        compressionMethod,
        localHeaderOffset,
        directory: path.endsWith("/"),
        encrypted: (flags & 1) !== 0,
      };
      entries.push(entry);
      this.#indexedEntries.set(path, { entry, flags });
      totalExpandedBytes += uncompressedSize;
      guard.assertLimit("maxExpandedBytes", totalExpandedBytes);
      if (!entry.directory) guard.assertLimit("maxArchiveEntryBytes", uncompressedSize);
      if (
        compressedSize > 0 &&
        uncompressedSize > compressionRatioMinimumBytes &&
        uncompressedSize / compressedSize > budget.maxCompressionRatio
      ) {
        throw new ViewerError("RESOURCE_LIMIT_EXCEEDED", "parse", false, [], {
          field: "maxCompressionRatio",
          actual: Math.ceil(uncompressedSize / compressedSize),
          allowed: budget.maxCompressionRatio,
        });
      }
      offset += 46 + nameLength + extraLength + commentLength;
      if (!Number.isSafeInteger(offset) || offset > directoryOffset + directorySize) {
        throw new ViewerError("PARSE_FAILED", "parse");
      }
    }
    if (offset !== directoryOffset + directorySize) throw new ViewerError("PARSE_FAILED", "parse");
    this.entries = entries;
  }

  /**
   * Reads and decompresses one entry subject to source and expansion limits.
   *
   * @param path - Exact normalized path of the archive entry.
   * @returns Uncompressed entry bytes.
   */
  async read(path: string): Promise<Uint8Array> {
    this.#guard.checkpoint(this.#signal);
    const indexed = this.#indexedEntries.get(path);
    const entry = indexed?.entry;
    if (entry === undefined || indexed === undefined || entry.directory || entry.encrypted) {
      throw new ViewerError("PARSE_FAILED", "parse");
    }
    this.#guard.assertLimit("maxArchiveEntryBytes", entry.uncompressedSize);
    const offset = entry.localHeaderOffset;
    if (this.#reader.uint32(offset) !== 0x04034b50) {
      throw new ViewerError("PARSE_FAILED", "parse");
    }
    const localFlags = this.#reader.uint16(offset + 6);
    const localMethod = this.#reader.uint16(offset + 8);
    const localCompressedSize = this.#reader.uint32(offset + 18);
    const localUncompressedSize = this.#reader.uint32(offset + 22);
    const nameLength = this.#reader.uint16(offset + 26);
    const extraLength = this.#reader.uint16(offset + 28);
    const localPath = decodePath(
      this.#reader.slice(offset + 30, nameLength),
      (indexed.flags & 0x0800) !== 0,
    );
    const usesDataDescriptor = (indexed.flags & 0x08) !== 0;
    if (
      localPath !== entry.path ||
      localMethod !== entry.compressionMethod ||
      (localFlags & 0x0809) !== (indexed.flags & 0x0809) ||
      (!usesDataDescriptor &&
        (localCompressedSize !== entry.compressedSize ||
          localUncompressedSize !== entry.uncompressedSize))
    ) {
      throw new ViewerError("PARSE_FAILED", "parse");
    }
    if (
      (entry.compressionMethod !== 0 && entry.compressionMethod !== 8) ||
      (entry.compressionMethod === 0 && entry.compressedSize !== entry.uncompressedSize)
    ) {
      throw new ViewerError("PARSE_FAILED", "parse");
    }
    const compressed = this.#reader.slice(
      offset + 30 + nameLength + extraLength,
      entry.compressedSize,
    );
    let result: Uint8Array;
    if (entry.compressionMethod === 0) {
      result = compressed.slice();
      this.#guard.consumeExpandedBytes(result.byteLength);
    } else {
      result = await decompressBounded(compressed, {
        budget: this.#budget,
        format: "deflate-raw",
        guard: this.#guard,
        maxOutputBytes: Math.min(this.#budget.maxArchiveEntryBytes, entry.uncompressedSize),
        signal: this.#signal,
      });
    }
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
    let text: string;
    try {
      text = decoder.decode(await this.read(path));
    } catch (error) {
      if (error instanceof ViewerError) throw error;
      throw new ViewerError("PARSE_FAILED", "parse");
    }
    this.#guard.consumeTextCharacters(text.length);
    return text;
  }
}

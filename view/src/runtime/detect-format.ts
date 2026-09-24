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
 * Implements deterministic format detection and support-matrix queries.
 */

import { formatManifest } from "../autogen/formats.manifest.js";
import { formatDescriptors, formatIdByExtension } from "../autogen/format-registry.js";
import type {
  FormatDescriptor,
  FormatDecision,
  FormatDriverId,
  FormatEvidence,
  FormatManifestRecord,
  FormatParityRecord,
} from "../shared/contracts/format.js";

const recordsByExtension = new Map<string, FormatManifestRecord>(
  formatManifest.map((record) => [record.extension, record]),
);
const recordsByMime = new Map<string, FormatManifestRecord[]>();

const localParserExtensions = new Set([
  "zip",
  "docx",
  "docm",
  "dotx",
  "dotm",
  "xlsx",
  "xlsm",
  "xltx",
  "xltm",
  "pptx",
  "pptm",
  "ppsx",
  "ppsm",
  "potx",
  "potm",
  "sldx",
  "sldm",
  "pdf",
  "epub",
  "xps",
  "oxps",
  "ofd",
  "drawio",
  "dio",
  "excalidraw",
  "tldraw",
  "xmind",
  "eml",
  "mbox",
  "geojson",
  "topojson",
  "dxf",
  "obj",
  "wasm",
]);

const browserNativeDrivers = new Set<FormatDriverId>([
  "audio",
  "gif",
  "image",
  "jpeg",
  "mp3",
  "mp4",
  "png",
  "svg",
  "video",
]);

/**
 * Resolves a baseline record to an independently installable format owner when one exists.
 *
 * @param record - Baseline format record selected by detection evidence.
 * @returns Canonical format owner or the baseline compatibility driver.
 */
function driverForRecord(record: FormatManifestRecord): FormatDriverId {
  return formatIdByExtension.get(record.extension) ?? record.driver;
}

for (const record of formatManifest) {
  for (const mimeType of record.mimeTypes) {
    const records = recordsByMime.get(mimeType) ?? [];
    records.push(record);
    recordsByMime.set(mimeType, records);
  }
}

interface SignatureMatch {
  readonly driver: FormatDriverId;
  readonly extension?: string;
  readonly label: string;
}

/**
 * Returns a normalized extension without its leading period.
 *
 * @param name - Optional filename or URL-like source name.
 * @returns Lowercase extension without a leading period, when recognized.
 */
export function extensionFromName(name: string | undefined): string | undefined {
  if (name === undefined) return undefined;
  const cleanName = name.split(/[?#]/u, 1)[0]?.replaceAll("\\", "/").split("/").at(-1) ?? "";
  const period = cleanName.lastIndexOf(".");
  if (period < 0 || period === cleanName.length - 1) {
    const lowerName = cleanName.toLowerCase();
    return recordsByExtension.has(lowerName) ? lowerName : undefined;
  }
  return cleanName.slice(period + 1).toLowerCase();
}

/**
 * Tests whether a byte prefix begins with an exact signature.
 *
 * @param bytes - Bounded source prefix inspected by detection.
 * @param signature - Expected byte signature.
 * @returns True when every signature byte matches the source prefix.
 */
function startsWith(bytes: Uint8Array, signature: readonly number[]): boolean {
  return signature.every((value, index) => bytes[index] === value);
}

/**
 * Decodes a bounded byte range as ASCII for signature comparison.
 *
 * @param bytes - Bounded source prefix inspected by detection.
 * @param start - Zero-based byte offset at which decoding begins.
 * @param length - Number of bytes decoded from the prefix.
 * @returns ASCII string produced from the requested byte range.
 */
function ascii(bytes: Uint8Array, start: number, length: number): string {
  return String.fromCharCode(...bytes.subarray(start, start + length));
}

/**
 * Identifies known binary signatures from a bounded source prefix.
 *
 * @param bytes - Bounded source prefix inspected by detection.
 * @returns Matched signature evidence, or undefined when no signature matches.
 */
function identifySignature(bytes: Uint8Array): SignatureMatch | undefined {
  if (startsWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])) {
    return { driver: "pdf", extension: "pdf", label: "%PDF-" };
  }
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { driver: "image", extension: "png", label: "PNG" };
  }
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) {
    return { driver: "image", extension: "jpg", label: "JPEG" };
  }
  if (ascii(bytes, 0, 6) === "GIF87a" || ascii(bytes, 0, 6) === "GIF89a") {
    return { driver: "image", extension: "gif", label: "GIF" };
  }
  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP") {
    return { driver: "image", extension: "webp", label: "RIFF/WEBP" };
  }
  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WAVE") {
    return { driver: "audio", extension: "wav", label: "RIFF/WAVE" };
  }
  if (ascii(bytes, 0, 4) === "OggS") return { driver: "audio", label: "Ogg" };
  if (ascii(bytes, 0, 4) === "fLaC") {
    return { driver: "audio", extension: "flac", label: "FLAC" };
  }
  if (ascii(bytes, 4, 4) === "ftyp") return { driver: "video", label: "ISO-BMFF" };
  if (startsWith(bytes, [0x50, 0x4b, 0x03, 0x04])) {
    return { driver: "archive", extension: "zip", label: "ZIP" };
  }
  if (startsWith(bytes, [0x1f, 0x8b])) {
    return { driver: "archive", extension: "gz", label: "GZIP" };
  }
  if (startsWith(bytes, [0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c])) {
    return { driver: "archive", extension: "7z", label: "7-Zip" };
  }
  if (startsWith(bytes, [0x52, 0x61, 0x72, 0x21, 0x1a, 0x07])) {
    return { driver: "archive", extension: "rar", label: "RAR" };
  }
  if (startsWith(bytes, [0x00, 0x61, 0x73, 0x6d])) {
    return { driver: "asset", extension: "wasm", label: "WebAssembly" };
  }
  if (ascii(bytes, 0, 16) === "SQLite format 3\0") {
    return { driver: "asset", extension: "sqlite", label: "SQLite" };
  }
  return undefined;
}

/**
 * Detects a format from filename, MIME type, and a bounded byte prefix.
 *
 * @param name - Optional filename or URL-like source name.
 * @param mimeType - Optional declared MIME type supplied by the host.
 * @param prefix - Bounded source bytes used for signature evidence.
 * @param additionalFormats - Registry-owned built-in or application format descriptions.
 * @returns Deterministic format decision with evidence and conflicts.
 */
export function detectFormat(
  name: string | undefined,
  mimeType: string | undefined,
  prefix: Uint8Array,
  additionalFormats: readonly FormatDescriptor[] = [],
): FormatDecision {
  const extensionOwners = new Map(formatIdByExtension);
  const customMimeOwners = new Map<string, Set<FormatDriverId>>();
  for (const descriptor of additionalFormats) {
    for (const ownedExtension of descriptor.extensions) {
      extensionOwners.set(ownedExtension.toLowerCase(), descriptor.id);
    }
    for (const ownedMimeType of descriptor.mimeTypes) {
      const normalizedOwnedMime = ownedMimeType.toLowerCase();
      const owners = customMimeOwners.get(normalizedOwnedMime) ?? new Set<FormatDriverId>();
      owners.add(descriptor.id);
      customMimeOwners.set(normalizedOwnedMime, owners);
    }
  }
  const extension = extensionFromName(name);
  const normalizedMime = mimeType?.split(";", 1)[0]?.trim().toLowerCase() || undefined;
  const evidence: FormatEvidence[] = [];
  const scores = new Map<FormatDriverId, number>();
  const add = (driver: FormatDriverId, item: FormatEvidence): void => {
    evidence.push(item);
    scores.set(driver, (scores.get(driver) ?? 0) + item.score);
  };

  const extensionRecord = extension === undefined ? undefined : recordsByExtension.get(extension);
  const extensionOwner = extension === undefined ? undefined : extensionOwners.get(extension);
  if (extension !== undefined && extensionOwner !== undefined) {
    add(extensionOwner, {
      kind: "extension",
      value: extension,
      score: 30,
    });
  } else if (extensionRecord !== undefined) {
    add(driverForRecord(extensionRecord), {
      kind: "extension",
      value: extensionRecord.extension,
      score: 30,
    });
  }
  if (normalizedMime !== undefined && normalizedMime !== "application/octet-stream") {
    const mimeDrivers = new Set(
      (recordsByMime.get(normalizedMime) ?? []).map((record) => driverForRecord(record)),
    );
    for (const owner of customMimeOwners.get(normalizedMime) ?? []) mimeDrivers.add(owner);
    for (const driver of mimeDrivers) {
      add(driver, { kind: "mime", value: normalizedMime, score: 25 });
    }
  }
  const signature = identifySignature(prefix);
  if (signature !== undefined) {
    let signatureDriver = signature.driver;
    if (
      extensionRecord !== undefined &&
      (signature.driver === extensionRecord.driver || signature.driver === "archive")
    ) {
      signatureDriver = extensionOwner ?? driverForRecord(extensionRecord);
    } else if (signature.extension !== undefined) {
      const signatureRecord = recordsByExtension.get(signature.extension);
      if (signatureRecord !== undefined) signatureDriver = driverForRecord(signatureRecord);
    }
    add(signatureDriver, { kind: "signature", value: signature.label, score: 70 });
  }

  const ranked = [...scores].sort(([driverA, scoreA], [driverB, scoreB]) => {
    return scoreB - scoreA || driverA.localeCompare(driverB);
  });
  const winner = ranked[0];
  const conflicts = ranked
    .slice(1)
    .filter(([, score]) => score === winner?.[1])
    .map(([driver]) => driver);
  const score = winner?.[1] ?? 0;
  return {
    ...(extension === undefined ? {} : { extension }),
    ...(normalizedMime === undefined ? {} : { mimeType: normalizedMime }),
    ...(winner === undefined ? {} : { driver: winner[0] }),
    confidence: Math.min(1, score / 100),
    evidence,
    conflicts,
  };
}

/**
 * Returns the immutable public format matrix.
 *
 * @returns Immutable generated manifest records.
 */
export function getFormatManifest(): readonly FormatManifestRecord[] {
  return formatManifest.map((record) => ({
    ...record,
    driver: driverForRecord(record),
  }));
}

/**
 * Returns descriptions for independently installable built-in format modules.
 *
 * @returns Generated built-in format descriptions.
 */
export function getFormatDescriptors(): readonly FormatDescriptor[] {
  return formatDescriptors;
}

/**
 * Returns a generated 274-record parity view without a hand-maintained second format list.
 *
 * @returns Immutable format parity records derived from the generated manifest.
 */
export function getFormatParityRecords(): readonly FormatParityRecord[] {
  return getFormatManifest().map((record) => {
    const driver = driverForRecord(record);
    const implementation = browserNativeDrivers.has(record.driver)
      ? "browser-native"
      : record.driver === "text" || localParserExtensions.has(record.extension)
        ? "local-parser"
        : "recognized";
    return {
      formatId: record.extension,
      extension: record.extension,
      driver,
      referenceLevel: record.upstreamLevel,
      targetLevel: record.targetLevel,
      currentLevel: implementation === "recognized" ? "R1" : "R2",
      implementation,
      milestone: record.milestone,
    };
  });
}

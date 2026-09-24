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
 * Verifies detection and lazy loading for every independently removable format module.
 */

import {
  formatDescriptors,
  formatIdByExtension,
  formatLoaders,
} from "../../src/autogen/format-registry.js";
import { formatManifest } from "../../src/autogen/formats.manifest.js";
import {
  detectFormat,
  extensionFromName,
  getFormatDescriptors,
  getFormatManifest,
  getFormatParityRecords,
} from "../../src/runtime/detect-format.js";

describe("built-in format matrix", () => {
  it("keeps descriptor identifiers and extension ownership unique", () => {
    const identifiers = formatDescriptors.map((descriptor) => descriptor.id);
    const extensions = formatDescriptors.flatMap((descriptor) => descriptor.extensions);
    expect(new Set(identifiers).size).toBe(identifiers.length);
    expect(new Set(extensions).size).toBe(extensions.length);
    expect(formatLoaders.size).toBe(formatDescriptors.length);
    expect(formatIdByExtension.size).toBe(extensions.length);
  });

  it("detects every extension owned by an installed format module", () => {
    for (const descriptor of formatDescriptors) {
      for (const extension of descriptor.extensions) {
        const decision = detectFormat(
          `fixture.${extension}`,
          undefined,
          new Uint8Array(),
          formatDescriptors,
        );
        expect(decision.driver, extension).toBe(descriptor.id);
        expect(decision.extension, extension).toBe(extension);
        expect(decision.conflicts, extension).toEqual([]);
      }
    }
  });

  it("loads every installed driver through its generated lazy boundary", async () => {
    for (const descriptor of formatDescriptors) {
      const loader = formatLoaders.get(descriptor.id);
      expect(loader, descriptor.id).toBeDefined();
      const driver = await loader?.();
      expect(driver?.id, descriptor.id).toBe(descriptor.id);
      expect(typeof driver?.open, descriptor.id).toBe("function");
    }
  });

  it("keeps the complete reference manifest internally consistent", () => {
    const extensions = formatManifest.map((record) => record.extension);
    expect(formatManifest.length).toBeGreaterThan(250);
    expect(new Set(extensions).size).toBe(extensions.length);
    for (const record of formatManifest) {
      expect(record.extension).toMatch(/^[a-z\d_+-]+$/u);
      expect(record.mimeTypes.length).toBeGreaterThan(0);
      expect(record.milestone).toMatch(/^P\d+$/u);
      expect(record.targetLevel).toMatch(/^R[0-5]$/u);
    }
  });

  it("recognizes binary signatures independently from filename evidence", () => {
    const ascii = (value: string): Uint8Array => new TextEncoder().encode(value);
    const signatures: readonly Uint8Array[] = [
      ascii("%PDF-1.7"),
      new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      new Uint8Array([0xff, 0xd8, 0xff]),
      ascii("GIF87a"),
      ascii("GIF89a"),
      ascii("RIFF0000WEBP"),
      ascii("RIFF0000WAVE"),
      ascii("OggS"),
      ascii("fLaC"),
      new Uint8Array([0, 0, 0, 16, 0x66, 0x74, 0x79, 0x70]),
      new Uint8Array([0x50, 0x4b, 0x03, 0x04]),
      new Uint8Array([0x1f, 0x8b]),
      new Uint8Array([0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c]),
      new Uint8Array([0x52, 0x61, 0x72, 0x21, 0x1a, 0x07]),
      new Uint8Array([0, 0x61, 0x73, 0x6d]),
      ascii("SQLite format 3\0"),
    ];
    for (const prefix of signatures) {
      const decision = detectFormat(undefined, undefined, prefix);
      expect(decision.evidence).toEqual(
        expect.arrayContaining([expect.objectContaining({ kind: "signature", score: 70 })]),
      );
      expect(decision.confidence).toBe(0.7);
    }
  });

  it("normalizes names, MIME parameters, custom owners, and public matrix views", () => {
    expect(extensionFromName(undefined)).toBeUndefined();
    expect(extensionFromName("archive.zip")).toBe("zip");
    expect(extensionFromName("https://example.test/IMAGE.PNG?download=1#value")).toBe("png");
    expect(extensionFromName("folder\\document.pdf")).toBe("pdf");
    expect(extensionFromName("README")).toBeUndefined();
    expect(extensionFromName("file.")).toBeUndefined();
    const custom = {
      schemaVersion: 1 as const,
      id: "custom-detection",
      label: "Custom",
      category: "custom",
      extensions: ["CUSTOM"],
      mimeTypes: ["APPLICATION/X-CUSTOM"],
      implementation: "ready" as const,
    };
    expect(
      detectFormat("value.custom", "application/x-custom; charset=utf-8", new Uint8Array(), [
        custom,
      ]),
    ).toMatchObject({ driver: "custom-detection", confidence: 0.55, conflicts: [] });
    expect(
      detectFormat("value.unknown", "application/octet-stream", new Uint8Array()),
    ).toMatchObject({ confidence: 0, evidence: [], conflicts: [] });
    expect(getFormatDescriptors()).toBe(formatDescriptors);
    expect(getFormatManifest()).toHaveLength(formatManifest.length);
    const parity = getFormatParityRecords();
    expect(parity).toHaveLength(formatManifest.length);
    expect(new Set(parity.map((record) => record.implementation))).toEqual(
      new Set(["browser-native", "local-parser", "recognized"]),
    );
  });
});

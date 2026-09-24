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
 * Provides the WebAssembly inspection codec without executing embedded code.
 */

import type { BinaryDocument } from "../../shared/contracts/document.js";
import type { ViewerDriver } from "../../shared/contracts/driver.js";
import { documentTitle, stableDocumentId } from "../../shared/document/document-identity.js";
import { ViewerError } from "../../shared/errors/viewer-error.js";
import { ByteReader } from "../binary/byte-codec.js";

/**
 * Validates a WebAssembly header and counts encoded sections without executing code.
 *
 * @param bytes - Complete WebAssembly module bytes.
 * @returns Stable label-value summary for the binary document model.
 */
function wasmSummary(
  bytes: Uint8Array,
): readonly { readonly label: string; readonly value: string }[] {
  if (bytes.length < 8 || String.fromCharCode(...bytes.subarray(0, 4)) !== "\0asm") {
    throw new ViewerError("PARSE_FAILED", "parse");
  }
  const sectionCounts = new Map<number, number>();
  let offset = 8;
  while (offset < bytes.length) {
    const section = bytes[offset] ?? 0;
    sectionCounts.set(section, (sectionCounts.get(section) ?? 0) + 1);
    offset += 1;
    let length = 0;
    let shift = 0;
    while (offset < bytes.length) {
      const value = bytes[offset] ?? 0;
      offset += 1;
      length |= (value & 0x7f) << shift;
      if ((value & 0x80) === 0) break;
      shift += 7;
      if (shift > 28) throw new ViewerError("PARSE_FAILED", "parse");
    }
    offset += length;
    if (offset > bytes.length) throw new ViewerError("PARSE_FAILED", "parse");
  }
  return [
    { label: "Version", value: String(new ByteReader(bytes).uint32(4)) },
    {
      label: "Sections",
      value: String([...sectionCounts.values()].reduce((sum, count) => sum + count, 0)),
    },
  ];
}

/**
 * Inspects self-describing assets without executing embedded code.
 */
export const wasmDriver: ViewerDriver<BinaryDocument> = {
  id: "wasm",
  /**
   * Opens self-describing binary assets as non-executable summaries.
   *
   * @param context - Bounded driver context for the selected asset.
   * @returns Complete WebAssembly summary or a partial generic asset summary.
   */
  async open(context) {
    const bytes = await context.resource.readAll(context.signal);
    const extension = context.decision.extension ?? "asset";
    const summary =
      extension === "wasm"
        ? wasmSummary(bytes)
        : [
            { label: "Size", value: String(bytes.length) },
            { label: "Format", value: extension },
          ];
    const model: BinaryDocument = {
      schemaVersion: 1,
      id: stableDocumentId(context.resource.name, bytes),
      kind: "binary",
      title: documentTitle(context.resource.name),
      byteLength: bytes.length,
      format: extension,
      summary,
    };
    if (extension === "wasm") return { status: "complete", model, warnings: [] };
    return {
      status: "partial",
      model,
      warnings: [{ code: "FORMAT_CONTENT_PARTIAL", messageKey: "format.contentPartial" }],
      skipped: [{ code: "FORMAT_RENDERER_PENDING" }],
    };
  },
};

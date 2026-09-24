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
 * Implements the bounded archive format driver.
 */

import { ZipArchive } from "../../codecs/archive/zip-codec.js";
import type { ArchiveDocument } from "../../shared/contracts/document.js";
import type { ViewerDriver } from "../../shared/contracts/driver.js";
import { documentTitle, stableDocumentId } from "../../shared/document/document-identity.js";
import { ViewerError } from "../../shared/errors/viewer-error.js";

/**
 * Lists ZIP entries while rejecting unsupported archive codecs explicitly.
 */
export const formatDriver: ViewerDriver<ArchiveDocument> = {
  id: "zip",
  /**
   * Opens a supported archive and exposes its bounded entry list.
   *
   * @param context - Bounded driver context for the selected archive.
   * @returns Complete ZIP model or an explicit unsupported result.
   */
  async open(context) {
    const bytes = await context.resource.readAll(context.signal);
    if (context.decision.extension !== "zip") {
      return { status: "rejected", error: new ViewerError("FORMAT_UNSUPPORTED", "parse", true) };
    }
    const archive = new ZipArchive(bytes, context.budget);
    return {
      status: "complete",
      warnings: [],
      model: {
        schemaVersion: 1,
        id: stableDocumentId(context.resource.name, bytes),
        kind: "archive",
        title: documentTitle(context.resource.name),
        entries: archive.entries.map((entry) => ({
          path: entry.path,
          compressedSize: entry.compressedSize,
          uncompressedSize: entry.uncompressedSize,
          directory: entry.directory,
        })),
      },
    };
  },
};

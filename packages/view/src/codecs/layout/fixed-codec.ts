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
 * Provides the shared fixed-layout codec for ZIP and XML based page formats.
 */

import type { PagedDocument } from "../../shared/contracts/document.js";
import type { ViewerDriver } from "../../shared/contracts/driver.js";
import { documentTitle, stableDocumentId } from "../../shared/document/document-identity.js";
import { ViewerError } from "../../shared/errors/viewer-error.js";
import { ZipArchive } from "../archive/zip-codec.js";
import {
  elementsByLocalName,
  localAttribute,
  parseXmlDocument,
  textFromElements,
} from "../xml/xml-codec.js";

/**
 * Converts a positive numeric attribute with a deterministic fallback.
 *
 * @param value - Optional numeric attribute value.
 * @param fallback - Positive value returned for invalid input.
 * @returns Parsed positive number or the supplied fallback.
 */
function numeric(value: string | undefined, fallback: number): number {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

/**
 * Creates a local fixed-layout container driver.
 *
 * @param id - Fixed-layout format family handled by the driver.
 * @returns Driver that converts container pages into a paged document.
 */
export function createFixedLayoutDriver(id: "xps" | "ofd"): ViewerDriver<PagedDocument> {
  return {
    id,
    /**
     * Opens one XPS or OFD container and extracts its page text and geometry.
     *
     * @param context - Bounded driver context for the selected source.
     * @returns Complete paged model or an explicit parse rejection.
     */
    async open(context) {
      const bytes = await context.resource.readAll(context.signal);
      const archive = new ZipArchive(bytes, context.budget);
      const paths = archive.entries
        .map((entry) => entry.path)
        .filter((path) =>
          id === "xps" ? /\.fpage$/iu.test(path) : /(?:^|\/)Content\.xml$/u.test(path),
        )
        .sort();
      if (paths.length === 0)
        return { status: "rejected", error: new ViewerError("PARSE_FAILED", "parse") };
      const documentId = stableDocumentId(context.resource.name, bytes);
      const pages = [];
      for (const [index, path] of paths.entries()) {
        const document = parseXmlDocument(await archive.text(path), context.budget.maxXmlNodes);
        const root = document.documentElement;
        const text =
          id === "xps"
            ? elementsByLocalName(document, "Glyphs")
                .map((element) => localAttribute(element, "UnicodeString") ?? "")
                .filter(Boolean)
                .join("\n")
            : textFromElements(document, "TextCode");
        pages.push({
          id: `${documentId}-page-${index + 1}`,
          width: numeric(localAttribute(root, "Width"), 794),
          height: numeric(localAttribute(root, "Height"), 1123),
          text,
        });
      }
      return {
        status: "complete",
        warnings: [],
        model: {
          schemaVersion: 1,
          id: documentId,
          kind: "paged",
          title: documentTitle(context.resource.name),
          pages,
        },
      };
    },
  };
}

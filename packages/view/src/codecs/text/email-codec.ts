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
 * Provides the inert EML and MBOX text codec.
 */

import type { FlowDocument } from "../../shared/contracts/document.js";
import type { ViewerDriver } from "../../shared/contracts/driver.js";
import { documentTitle, stableDocumentId } from "../../shared/document/document-identity.js";
import { ViewerError } from "../../shared/errors/viewer-error.js";

const decoder = new TextDecoder();

/**
 * Parses unfolded RFC-style message headers and separates the message body.
 *
 * @param source - Decoded email message source.
 * @returns Lowercase header map and remaining message body.
 */
function parseHeaders(source: string): {
  readonly headers: Map<string, string>;
  readonly body: string;
} {
  const boundary = source.search(/\r?\n\r?\n/u);
  const rawHeaders = boundary < 0 ? source : source.slice(0, boundary);
  const headers = new Map<string, string>();
  for (const line of rawHeaders.replaceAll(/\r?\n[\t ]+/gu, " ").split(/\r?\n/u)) {
    const separator = line.indexOf(":");
    if (separator > 0)
      headers.set(line.slice(0, separator).toLowerCase(), line.slice(separator + 1).trim());
  }
  return { headers, body: boundary < 0 ? "" : source.slice(boundary).trim() };
}

/**
 * Parses EML and MBOX headers and readable message bodies without executing HTML.
 */
export const emailDriver: ViewerDriver<FlowDocument> = {
  id: "email",
  /**
   * Opens EML or MBOX text without executing message markup.
   *
   * @param context - Bounded driver context for the selected email source.
   * @returns Complete message flow model or an explicit unsupported result.
   */
  async open(context) {
    if (context.decision.extension === "msg") {
      return { status: "rejected", error: new ViewerError("FORMAT_UNSUPPORTED", "parse", true) };
    }
    const bytes = await context.resource.readAll(context.signal);
    const source = decoder.decode(bytes);
    const messages =
      context.decision.extension === "mbox"
        ? source.split(/^From .+$/gmu).filter((item) => item.trim() !== "")
        : [source];
    const id = stableDocumentId(context.resource.name, bytes);
    const sections = messages.map((message, index) => {
      const parsed = parseHeaders(message.trim());
      return {
        id: `${id}-message-${index + 1}`,
        title: parsed.headers.get("subject") ?? `Message ${index + 1}`,
        text: parsed.body.replaceAll(/<[^>]*>/gu, "").trim(),
      };
    });
    return {
      status: "complete",
      warnings: [],
      model: {
        schemaVersion: 1,
        id,
        kind: "flow",
        title: documentTitle(context.resource.name),
        sections,
      },
    };
  },
};

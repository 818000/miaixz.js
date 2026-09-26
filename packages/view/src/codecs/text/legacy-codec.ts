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
 * Provides the bounded legacy and plain-text codec.
 */

import type { TextDocument } from "../../shared/contracts/document.js";
import type { ViewerDriver } from "../../shared/contracts/driver.js";
import { documentTitle, stableDocumentId } from "../../shared/document/document-identity.js";
import { ViewerError } from "../../shared/errors/viewer-error.js";

const decoder = new TextDecoder("utf-8", { fatal: false });

/**
 * Parses bounded UTF-8 text without executing embedded markup or scripts.
 */
export const textDriver: ViewerDriver<TextDocument> = {
  id: "text",
  /**
   * Opens bounded UTF-8 source bytes as a text document.
   *
   * @param context - Bounded driver context for the selected text source.
   * @returns Complete text outcome or a resource-limit rejection.
   */
  async open(context) {
    context.reportProgress({ stage: "parsing", indeterminate: true });
    const bytes = await context.resource.readAll(context.signal);
    const content = decoder.decode(bytes).replace(/^\uFEFF/u, "");
    if (content.length > context.budget.maxTextCharacters) {
      return { status: "rejected", error: new ViewerError("RESOURCE_LIMIT_EXCEEDED", "parse") };
    }
    const model: TextDocument = {
      schemaVersion: 1,
      id: stableDocumentId(context.resource.name, bytes),
      kind: "text",
      title: documentTitle(context.resource.name),
      content,
      lineCount: content === "" ? 0 : content.split(/\r\n|\r|\n/u).length,
      ...(context.decision.extension === undefined ? {} : { language: context.decision.extension }),
    };
    return { status: "complete", model, warnings: [] };
  },
};

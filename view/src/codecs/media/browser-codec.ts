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
 * Provides the browser-native image, audio, and video codec.
 */

import type { MediaDocument } from "../../shared/contracts/document.js";
import type { ViewerDriver } from "../../shared/contracts/driver.js";
import type { FormatDriverId } from "../../shared/contracts/format.js";
import { documentTitle, stableDocumentId } from "../../shared/document/document-identity.js";

/**
 * Creates a browser-native image, audio, or video driver.
 *
 * @param id - Canonical format identifier exposed by the returned driver.
 * @param mediaKind - Browser media element family used to render the source.
 * @returns Driver that opens media through a bounded object URL.
 */
export function createBrowserMediaDriver(
  id: FormatDriverId,
  mediaKind: MediaDocument["mediaKind"],
): ViewerDriver<MediaDocument> {
  return {
    id,
    /**
     * Opens one media resource as a browser-native media document.
     *
     * @param context - Bounded driver context for the selected source.
     * @returns Complete media parse outcome.
     */
    async open(context) {
      const prefix = await context.resource.read(0, context.budget.maxProbeBytes, context.signal);
      const sourceUrl = await context.resource.createObjectUrl();
      const model: MediaDocument = {
        schemaVersion: 1,
        id: stableDocumentId(context.resource.name, prefix),
        kind: "media",
        mediaKind,
        title: documentTitle(context.resource.name),
        sourceUrl,
        ...(context.resource.mimeType === undefined ? {} : { mimeType: context.resource.mimeType }),
      };
      return { status: "complete", model, warnings: [] };
    },
  };
}

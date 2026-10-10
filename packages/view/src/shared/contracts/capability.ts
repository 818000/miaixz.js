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
 * Defines stable viewer capability, event, and command contracts.
 */

import type { ViewerWarning } from "./document.js";
import type { ViewerProgress } from "./driver.js";
import type { RelatedResourceRequest } from "./source.js";

/**
 * Declares content operations supported by the active document.
 */
export interface ViewerCapabilities {
  readonly zoom: boolean;
  readonly rotate: boolean;
  readonly search: boolean;
  readonly pageNavigation: boolean;
  readonly sheetNavigation: boolean;
  readonly outline: boolean;
  readonly thumbnails: boolean;
  readonly diagramGraph: boolean;
  readonly mediaPlayback: boolean;
  readonly sceneNavigation: boolean;
}

/**
 * Events a document session may emit after opening.
 */
export type DocumentEvent =
  | { readonly type: "progress"; readonly progress: ViewerProgress }
  | { readonly type: "warning"; readonly warning: ViewerWarning }
  | { readonly type: "password-required"; readonly attempt: number }
  | { readonly type: "resource-required"; readonly request: RelatedResourceRequest }
  | { readonly type: "invalidated"; readonly reason: "resource" | "source" | "viewport" };

/**
 * Commands accepted by the framework-neutral controller layer.
 */
export type ViewerCommand =
  | { readonly type: "zoom-in" }
  | { readonly type: "zoom-out" }
  | { readonly type: "reset-zoom" }
  | { readonly type: "rotate"; readonly degrees: -90 | 90 }
  | { readonly type: "go-to-page"; readonly page: number }
  | { readonly type: "select-sheet"; readonly sheetId: string }
  | { readonly type: "search"; readonly query: string }
  | { readonly type: "retry" };

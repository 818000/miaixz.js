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

import { createContext } from "react";

/**
 * Connects a composite field's native editor to its owning Field wrapper.
 */
interface MiaixzFieldContextValue {
  /**
   * Identifies the focusable editor rather than its composite root.
   */
  readonly controlId: string;
  /**
   * Identifies the wrapper's visible label.
   */
  readonly labelId: string;
  /**
   * References the wrapper's helper and error descriptions.
   */
  readonly describedBy: string | undefined;
  /**
   * Preserves the wrapper's required-field semantics.
   */
  readonly required: boolean;
}

/**
 * Shares label ownership without changing standalone composite controls.
 */
export const MiaixzFieldContext = createContext<MiaixzFieldContextValue | null>(null);

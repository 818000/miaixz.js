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

import { MiaixzUiError } from "../errors/ui-error.js";

/**
 * Supplies the two mutually exclusive native accessible-name inputs.
 */
interface MiaixzAccessibleNameOptions {
  /**
   * Supplies an explicit accessible label.
   */
  readonly ariaLabel?: string;

  /**
   * Supplies an ID reference to an external label.
   */
  readonly ariaLabelledBy?: string;
}

/**
 * Requires exactly one non-blank accessible-name source.
 *
 * The original string is never normalized before it reaches the DOM. Trimming is used only to
 * validate whether the public input has semantic content.
 *
 * @param options - Mutually exclusive native label inputs.
 * @internal
 */
export function assertMiaixzAccessibleName(options: Readonly<MiaixzAccessibleNameOptions>): void {
  const hasLabel = options.ariaLabel !== undefined;
  const hasLabelledBy = options.ariaLabelledBy !== undefined;
  if (
    hasLabel === hasLabelledBy ||
    (hasLabel && options.ariaLabel?.trim() === "") ||
    (hasLabelledBy && options.ariaLabelledBy?.trim() === "")
  ) {
    throw new MiaixzUiError({ code: "UI_ACCESSIBLE_NAME_INVALID" });
  }
}

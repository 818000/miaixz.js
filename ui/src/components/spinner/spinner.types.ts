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

import type { HTMLAttributes } from "react";

import type { MiaixzComponentSize } from "../shared.types.js";

/**
 * Defines properties owned by the Miaixz Spinner contract.
 *
 * @public
 */
export interface MiaixzSpinnerOwnProps {
  /**
   * Selects the semantic spinner size.
   *
   * @defaultValue `"medium"`
   */
  readonly size?: MiaixzComponentSize;

  /**
   * Supplies the required localized accessible loading label.
   */
  readonly label: string;
}

/**
 * Configures an accessible indeterminate loading indicator.
 *
 * @public
 */
export interface SpinnerProps
  extends
    Omit<HTMLAttributes<HTMLSpanElement>, keyof MiaixzSpinnerOwnProps>,
    MiaixzSpinnerOwnProps {}

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

import type { HTMLAttributes, RefAttributes } from "react";

export type ViewSelectorValue = "list" | "grid";

export interface ViewSelectorOwnerState {
  readonly value: ViewSelectorValue;
  readonly disabled: boolean;
}

export type ViewSelectorRootAttributes = HTMLAttributes<HTMLDivElement> &
  RefAttributes<HTMLDivElement> & {
    readonly "data-value"?: ViewSelectorValue;
  };

/**
 * Configures the canonical list/grid view switch.
 *
 * The option order is intentionally fixed to list first and grid second so every product view
 * presents the same spatial contract.
 *
 * @public
 */
export interface ViewSelectorProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "aria-label" | "children" | "onChange"
> {
  readonly "aria-label": string;
  readonly value: ViewSelectorValue;
  readonly onValueChange: (value: ViewSelectorValue) => void;
  readonly listLabel: string;
  readonly gridLabel: string;
  readonly disabled?: boolean;
}

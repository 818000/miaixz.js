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

import type { MiaixzSlotProps } from "../../shared/slots.js";

export type MasonryColumns = 1 | 2 | 3 | 4;
export type MasonryGap = "none" | "tight" | "compact" | "default";

export interface MasonryOwnerState {
  readonly columns: MasonryColumns;
  readonly gap: MasonryGap;
}

export interface MasonryRootAttributes
  extends HTMLAttributes<HTMLDivElement>, RefAttributes<HTMLDivElement> {
  readonly "data-ui"?: "masonry";
  readonly "data-columns"?: MasonryColumns;
  readonly "data-gap"?: MasonryGap;
}

export interface MasonrySlotProps {
  readonly root?: MiaixzSlotProps<MasonryOwnerState, MasonryRootAttributes>;
}

export interface MasonryProps extends HTMLAttributes<HTMLDivElement> {
  readonly columns?: MasonryColumns;
  readonly gap?: MasonryGap;
  readonly slotProps?: MasonrySlotProps;
}

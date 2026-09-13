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

/* eslint-disable jsdoc/require-jsdoc -- Closed progress slots are self-describing.
 */
import type { HTMLAttributes, RefAttributes } from "react";
import type { MiaixzSlotProps } from "../../shared/slots.js";
import type { MiaixzVisualTone } from "../shared.types.js";

export type ProgressSize = "small" | "medium";
export type ProgressSlot = "root" | "track" | "indicator" | "value";
export interface ProgressOwnerState {
  readonly size: ProgressSize;
  readonly tone: MiaixzVisualTone;
  readonly determinate: boolean;
  readonly showValue: boolean;
}
export type ProgressRootAttributes = HTMLAttributes<HTMLDivElement> &
  RefAttributes<HTMLDivElement> & {
    readonly "data-state"?: "determinate" | "indeterminate";
    readonly "data-tone"?: MiaixzVisualTone;
    readonly "data-size"?: ProgressSize;
  };
export interface ProgressSlotProps {
  readonly root?: MiaixzSlotProps<ProgressOwnerState, ProgressRootAttributes>;
  readonly track?: MiaixzSlotProps<ProgressOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly indicator?: MiaixzSlotProps<ProgressOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly value?: MiaixzSlotProps<ProgressOwnerState, HTMLAttributes<HTMLSpanElement>>;
}
export interface MiaixzProgressOwnProps {
  readonly value?: number;
  readonly max?: number;
  readonly label: string;
  readonly showValue?: boolean;
  readonly valueFormatter?: (value: number, max: number) => string;
  readonly tone?: MiaixzVisualTone;
  readonly size?: ProgressSize;
  readonly slotProps?: ProgressSlotProps;
}
export type ProgressProps = MiaixzProgressOwnProps &
  Omit<
    HTMLAttributes<HTMLDivElement>,
    | keyof MiaixzProgressOwnProps
    | "children"
    | "role"
    | "aria-label"
    | "aria-labelledby"
    | "aria-valuemin"
    | "aria-valuemax"
    | "aria-valuenow"
    | "aria-valuetext"
  >;
/* eslint-enable jsdoc/require-jsdoc
 */

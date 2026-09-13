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

/* eslint-disable jsdoc/require-jsdoc -- Closed status slots are self-describing.
 */
import type { HTMLAttributes, ReactNode, RefAttributes } from "react";
import type { MiaixzSlotProps } from "../../shared/slots.js";
import type { MiaixzFeedbackTone } from "../shared.types.js";

export type StatusSize = "small" | "medium";
export type StatusLayout = "inline" | "stacked";
export type StatusSlot = "root" | "marker" | "content" | "label";
export interface StatusOwnerState {
  readonly tone: MiaixzFeedbackTone | "brand";
  readonly size: StatusSize;
  readonly layout: StatusLayout;
}
export type StatusRootAttributes = HTMLAttributes<HTMLSpanElement> &
  RefAttributes<HTMLSpanElement> & {
    readonly "data-tone"?: MiaixzFeedbackTone | "brand";
    readonly "data-size"?: StatusSize;
    readonly "data-layout"?: StatusLayout;
  };
export interface StatusSlotProps {
  readonly root?: MiaixzSlotProps<StatusOwnerState, StatusRootAttributes>;
  readonly marker?: MiaixzSlotProps<StatusOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly content?: MiaixzSlotProps<StatusOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly label?: MiaixzSlotProps<StatusOwnerState, HTMLAttributes<HTMLSpanElement>>;
}
export interface MiaixzStatusOwnProps {
  readonly tone: MiaixzFeedbackTone | "brand";
  readonly label: ReactNode;
  readonly children?: ReactNode;
  readonly size?: StatusSize;
  readonly layout?: StatusLayout;
  readonly slotProps?: StatusSlotProps;
}
export type StatusProps = MiaixzStatusOwnProps &
  Omit<HTMLAttributes<HTMLSpanElement>, keyof MiaixzStatusOwnProps | "children">;
/* eslint-enable jsdoc/require-jsdoc
 */

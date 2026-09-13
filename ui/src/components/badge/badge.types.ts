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

/* eslint-disable jsdoc/require-jsdoc -- Closed badge slots are self-describing.
 */
import type { HTMLAttributes, ReactNode, RefAttributes } from "react";
import type { MiaixzSlotProps } from "../../shared/slots.js";

export type BadgeTone = "neutral" | "brand" | "success" | "warning" | "danger" | "info";
export type BadgeVariant = "filled" | "outlined";
export type BadgeSlot = "root" | "marker" | "icon" | "label";
export interface BadgeOwnerState {
  readonly tone: BadgeTone;
  readonly variant: BadgeVariant;
  readonly marker: boolean;
}
export type BadgeRootAttributes = HTMLAttributes<HTMLSpanElement> &
  RefAttributes<HTMLSpanElement> & {
    readonly "data-tone"?: BadgeTone;
    readonly "data-variant"?: BadgeVariant;
  };
export interface BadgeSlotProps {
  readonly root?: MiaixzSlotProps<BadgeOwnerState, BadgeRootAttributes>;
  readonly marker?: MiaixzSlotProps<BadgeOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly icon?: MiaixzSlotProps<BadgeOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly label?: MiaixzSlotProps<BadgeOwnerState, HTMLAttributes<HTMLSpanElement>>;
}
export interface MiaixzBadgeOwnProps {
  readonly children: ReactNode;
  readonly tone?: BadgeTone;
  readonly variant?: BadgeVariant;
  readonly marker?: boolean;
  readonly icon?: ReactNode;
  readonly slotProps?: BadgeSlotProps;
}
export type BadgeProps = MiaixzBadgeOwnProps &
  Omit<HTMLAttributes<HTMLSpanElement>, keyof MiaixzBadgeOwnProps | "children">;
/* eslint-enable jsdoc/require-jsdoc
 */

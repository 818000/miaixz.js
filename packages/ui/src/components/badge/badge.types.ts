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
 * Defines the badge public type contracts.
 */

import type { HTMLAttributes, ReactNode, RefAttributes } from "react";
import type { MiaixzSlotProps } from "../../shared/slots.js";

/**
 * Badge semantic color tones permitted by the component contract.
 */
export type BadgeTone = "neutral" | "brand" | "success" | "warning" | "danger" | "info";
/**
 * Badge visual variants permitted by the component contract.
 */
export type BadgeVariant = "filled" | "outlined";
/**
 * Named Badge parts available for slot and style customization.
 */
export type BadgeSlot = "root" | "marker" | "icon" | "label";
/**
 * Resolved Badge state exposed to theme and slot overrides.
 */
export interface BadgeOwnerState {
  readonly tone: BadgeTone;
  readonly variant: BadgeVariant;
  readonly marker: boolean;
}
/**
 * Attributes accepted by the Badge Root slot.
 */
export type BadgeRootAttributes = HTMLAttributes<HTMLSpanElement> &
  RefAttributes<HTMLSpanElement> & {
    readonly "data-tone"?: BadgeTone;
    readonly "data-variant"?: BadgeVariant;
  };
/**
 * Per-slot attributes and state-dependent override callbacks for Badge.
 */
export interface BadgeSlotProps {
  readonly root?: MiaixzSlotProps<BadgeOwnerState, BadgeRootAttributes>;
  readonly marker?: MiaixzSlotProps<BadgeOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly icon?: MiaixzSlotProps<BadgeOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly label?: MiaixzSlotProps<BadgeOwnerState, HTMLAttributes<HTMLSpanElement>>;
}
/**
 * Component-specific Badge properties composed with the permitted native attributes.
 */
export interface MiaixzBadgeOwnProps {
  readonly children: ReactNode;
  readonly tone?: BadgeTone;
  readonly variant?: BadgeVariant;
  readonly marker?: boolean;
  readonly icon?: ReactNode;
  readonly slotProps?: BadgeSlotProps;
}
/**
 * Properties accepted by the Badge renderer.
 */
export type BadgeProps = MiaixzBadgeOwnProps &
  Omit<HTMLAttributes<HTMLSpanElement>, keyof MiaixzBadgeOwnProps | "children">;

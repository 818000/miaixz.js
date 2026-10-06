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
 * Defines the skeleton public type contracts.
 */

import type { HTMLAttributes, RefAttributes } from "react";
import type { MiaixzSlotProps } from "../../shared/slots.js";

/**
 * Skeleton visual variants permitted by the component contract.
 */
export type SkeletonVariant = "text" | "circular" | "rectangular" | "rounded" | "custom";
/**
 * Named Skeleton parts available for slot and style customization.
 */
export type SkeletonSlot = "root";
/**
 * Resolved Skeleton state exposed to theme and slot overrides.
 */
export interface SkeletonOwnerState {
  readonly variant: SkeletonVariant;
}
/**
 * Attributes accepted by the Skeleton Root slot.
 */
export type SkeletonRootAttributes = HTMLAttributes<HTMLSpanElement> &
  RefAttributes<HTMLSpanElement> & { readonly "data-variant"?: SkeletonVariant };
/**
 * Per-slot attributes and state-dependent override callbacks for Skeleton.
 */
export interface SkeletonSlotProps {
  readonly root?: MiaixzSlotProps<SkeletonOwnerState, SkeletonRootAttributes>;
}
/**
 * Component-specific Skeleton properties composed with the permitted native attributes.
 */
export interface MiaixzSkeletonOwnProps {
  readonly variant?: SkeletonVariant;
  readonly width?: number | string;
  readonly height?: number | string;
  readonly slotProps?: SkeletonSlotProps;
}
/**
 * Properties accepted by the Skeleton renderer.
 */
export type SkeletonProps = MiaixzSkeletonOwnProps &
  Omit<HTMLAttributes<HTMLSpanElement>, keyof MiaixzSkeletonOwnProps | "children" | "aria-hidden">;

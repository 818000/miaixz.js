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
 * Defines the brand public type contracts.
 */

import type { HTMLAttributes, ReactNode, RefAttributes } from "react";
import type { MiaixzSlotProps } from "../../shared/slots.js";

/**
 * Named Brand parts available for slot and style customization.
 */
export type BrandSlot = "root" | "logo" | "name";
/**
 * Resolved Brand state exposed to theme and slot overrides.
 */
export type BrandOwnerState = Record<never, never>;
/**
 * Attributes accepted by the Brand Root slot.
 */
export type BrandRootAttributes = HTMLAttributes<HTMLSpanElement> & RefAttributes<HTMLSpanElement>;
/**
 * Per-slot attributes and state-dependent override callbacks for Brand.
 */
export interface BrandSlotProps {
  readonly root?: MiaixzSlotProps<BrandOwnerState, BrandRootAttributes>;
  readonly logo?: MiaixzSlotProps<BrandOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly name?: MiaixzSlotProps<BrandOwnerState, HTMLAttributes<HTMLSpanElement>>;
}
/**
 * Component-specific Brand properties composed with the permitted native attributes.
 */
export interface MiaixzBrandOwnProps {
  readonly name: string;
  readonly logo?: ReactNode;
  readonly slotProps?: BrandSlotProps;
}
/**
 * Configures a non-interactive platform identity. @public
 */
export type BrandProps = MiaixzBrandOwnProps &
  Omit<HTMLAttributes<HTMLSpanElement>, keyof MiaixzBrandOwnProps | "children">;

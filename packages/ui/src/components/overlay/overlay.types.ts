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
 * Defines the overlay public type contracts.
 */

import type { HTMLAttributes, ReactNode, RefAttributes } from "react";
import type { MiaixzSlotProps } from "../../shared/slots.js";

/**
 * Named Overlay parts available for slot and style customization.
 */
export type OverlaySlot = "root" | "content" | "surface" | "indicator";
/**
 * Resolved Overlay state exposed to theme and slot overrides.
 */
export interface OverlayOwnerState {
  readonly active: boolean;
  readonly blocking: boolean;
}
/**
 * Per-slot attributes and state-dependent override callbacks for Overlay.
 */
export interface OverlaySlotProps {
  readonly root?: MiaixzSlotProps<
    OverlayOwnerState,
    HTMLAttributes<HTMLDivElement> &
      RefAttributes<HTMLDivElement> & { readonly "data-blocking"?: boolean }
  >;
  readonly content?: MiaixzSlotProps<OverlayOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly surface?: MiaixzSlotProps<OverlayOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly indicator?: MiaixzSlotProps<OverlayOwnerState, HTMLAttributes<HTMLSpanElement>>;
}
/**
 * Component-specific Overlay properties composed with the permitted native attributes.
 */
export interface MiaixzOverlayOwnProps {
  readonly active: boolean;
  readonly blocking?: boolean;
  readonly label: string;
  readonly children: ReactNode;
  readonly slotProps?: OverlaySlotProps;
}
/**
 * Properties accepted by the Overlay renderer.
 */
export type OverlayProps = MiaixzOverlayOwnProps &
  Omit<HTMLAttributes<HTMLDivElement>, keyof MiaixzOverlayOwnProps | "aria-busy">;

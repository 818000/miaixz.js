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
 * Defines the empty public type contracts.
 */

import type { HTMLAttributes, ReactNode, RefAttributes } from "react";
import type { MiaixzSlotComponent, MiaixzSlotProps } from "../../shared/slots.js";

/**
 * Empty visual variants permitted by the component contract.
 */
export type EmptyVariant = "framed" | "plain";
/**
 * Named Empty parts available for slot and style customization.
 */
export type EmptySlot = "root" | "content" | "icon" | "title" | "description" | "actions";
/**
 * Resolved Empty state exposed to theme and slot overrides.
 */
export interface EmptyOwnerState {
  readonly variant: EmptyVariant;
  readonly compact: boolean;
}
/**
 * Replaceable slot components accepted by Empty.
 */
export interface EmptySlots {
  readonly description?: MiaixzSlotComponent<HTMLAttributes<HTMLDivElement>>;
}
/**
 * Attributes accepted by the Empty Root slot.
 */
export type EmptyRootAttributes = HTMLAttributes<HTMLDivElement> &
  RefAttributes<HTMLDivElement> & {
    readonly "data-variant"?: EmptyVariant;
    readonly "data-compact"?: boolean;
  };
/**
 * Per-slot attributes and state-dependent override callbacks for Empty.
 */
export interface EmptySlotProps {
  readonly root?: MiaixzSlotProps<EmptyOwnerState, EmptyRootAttributes>;
  readonly content?: MiaixzSlotProps<EmptyOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly icon?: MiaixzSlotProps<EmptyOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly title?: MiaixzSlotProps<EmptyOwnerState, HTMLAttributes<HTMLHeadingElement>>;
  readonly description?: MiaixzSlotProps<EmptyOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly actions?: MiaixzSlotProps<EmptyOwnerState, HTMLAttributes<HTMLDivElement>>;
}
/**
 * Component-specific Empty properties composed with the permitted native attributes.
 */
export interface MiaixzEmptyOwnProps {
  readonly variant?: EmptyVariant;
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly icon?: ReactNode;
  readonly actions?: ReactNode;
  readonly compact?: boolean;
  readonly headingLevel?: 2 | 3 | 4 | 5 | 6;
  readonly slots?: EmptySlots;
  readonly slotProps?: EmptySlotProps;
}
/**
 * Properties accepted by the Empty renderer.
 */
export type EmptyProps = MiaixzEmptyOwnProps &
  Omit<HTMLAttributes<HTMLDivElement>, keyof MiaixzEmptyOwnProps | "children">;

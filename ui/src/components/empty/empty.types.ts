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

/* eslint-disable jsdoc/require-jsdoc -- Closed empty-state slots are self-describing.
 */
import type { HTMLAttributes, ReactNode, RefAttributes } from "react";
import type { MiaixzSlotComponent, MiaixzSlotProps } from "../../shared/slots.js";

export type EmptyVariant = "framed" | "plain";
export type EmptySlot = "root" | "content" | "icon" | "title" | "description" | "actions";
export interface EmptyOwnerState {
  readonly variant: EmptyVariant;
  readonly compact: boolean;
}
export interface EmptySlots {
  readonly description?: MiaixzSlotComponent<HTMLAttributes<HTMLDivElement>>;
}
export type EmptyRootAttributes = HTMLAttributes<HTMLDivElement> &
  RefAttributes<HTMLDivElement> & {
    readonly "data-variant"?: EmptyVariant;
    readonly "data-compact"?: boolean;
  };
export interface EmptySlotProps {
  readonly root?: MiaixzSlotProps<EmptyOwnerState, EmptyRootAttributes>;
  readonly content?: MiaixzSlotProps<EmptyOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly icon?: MiaixzSlotProps<EmptyOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly title?: MiaixzSlotProps<EmptyOwnerState, HTMLAttributes<HTMLHeadingElement>>;
  readonly description?: MiaixzSlotProps<EmptyOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly actions?: MiaixzSlotProps<EmptyOwnerState, HTMLAttributes<HTMLDivElement>>;
}
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
export type EmptyProps = MiaixzEmptyOwnProps &
  Omit<HTMLAttributes<HTMLDivElement>, keyof MiaixzEmptyOwnProps | "children">;
/* eslint-enable jsdoc/require-jsdoc
 */

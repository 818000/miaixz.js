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

/* eslint-disable jsdoc/require-jsdoc -- Closed header slots are self-describing.
 */
import type { HTMLAttributes, ReactNode, RefAttributes } from "react";
import type { MiaixzSlotComponent, MiaixzSlotProps } from "../../shared/slots.js";

export type HeaderDensity = "compact" | "standard" | "comfortable";
export type HeaderSlot = "root" | "content" | "eyebrow" | "title" | "description" | "actions";
export interface HeaderOwnerState {
  readonly density: HeaderDensity;
  readonly spacing: "default" | "none";
}
export interface HeaderSlots {
  readonly description?: MiaixzSlotComponent<HTMLAttributes<HTMLDivElement>>;
}
export type HeaderRootAttributes = HTMLAttributes<HTMLElement> &
  RefAttributes<HTMLElement> & {
    readonly "data-density"?: HeaderDensity;
    readonly "data-spacing"?: "default" | "none";
  };
export interface HeaderSlotProps {
  readonly root?: MiaixzSlotProps<HeaderOwnerState, HeaderRootAttributes>;
  readonly content?: MiaixzSlotProps<HeaderOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly eyebrow?: MiaixzSlotProps<HeaderOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly title?: MiaixzSlotProps<HeaderOwnerState, HTMLAttributes<HTMLHeadingElement>>;
  readonly description?: MiaixzSlotProps<HeaderOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly actions?: MiaixzSlotProps<HeaderOwnerState, HTMLAttributes<HTMLDivElement>>;
}
export interface MiaixzHeaderOwnProps {
  readonly density?: HeaderDensity;
  readonly spacing?: "default" | "none";
  readonly title: ReactNode;
  readonly eyebrow?: ReactNode;
  readonly description?: ReactNode;
  readonly actions?: ReactNode;
  readonly headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  readonly slots?: HeaderSlots;
  readonly slotProps?: HeaderSlotProps;
}
/*
 * Configures a page title and action region. @public
 */
export type HeaderProps = MiaixzHeaderOwnProps &
  Omit<HTMLAttributes<HTMLElement>, keyof MiaixzHeaderOwnProps | "title">;

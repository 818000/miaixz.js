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

/* eslint-disable jsdoc/require-jsdoc -- Closed sidebar slots are self-describing.
 */
import type { HTMLAttributes, ReactNode, RefAttributes } from "react";
import type { MiaixzSlotProps } from "../../shared/slots.js";

export type SidebarSize = "default" | "wide";
export type SidebarSlot = "root" | "sidebar" | "content" | "footer";
export interface SidebarOwnerState {
  readonly size: SidebarSize;
  readonly stickySidebar: boolean;
}
export type SidebarRootAttributes = HTMLAttributes<HTMLDivElement> &
  RefAttributes<HTMLDivElement> & { readonly "data-size"?: SidebarSize };
export type SidebarAsideAttributes = HTMLAttributes<HTMLElement> & {
  readonly "data-sticky"?: boolean;
};
export interface SidebarSlotProps {
  readonly root?: MiaixzSlotProps<SidebarOwnerState, SidebarRootAttributes>;
  readonly sidebar?: MiaixzSlotProps<SidebarOwnerState, SidebarAsideAttributes>;
  readonly content?: MiaixzSlotProps<SidebarOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly footer?: MiaixzSlotProps<SidebarOwnerState, HTMLAttributes<HTMLElement>>;
}
export interface MiaixzSidebarOwnProps {
  readonly sidebar: ReactNode;
  readonly sidebarLabel?: string;
  readonly stickySidebar?: boolean;
  readonly size?: SidebarSize;
  readonly footer?: ReactNode;
  readonly slotProps?: SidebarSlotProps;
}
/*
 * Configures a local sidebar and content layout. @public
 */
export type SidebarProps = MiaixzSidebarOwnProps &
  Omit<HTMLAttributes<HTMLDivElement>, keyof MiaixzSidebarOwnProps>;

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

/* eslint-disable jsdoc/require-jsdoc -- Closed shell navigation and slots are self-describing.
 */
import type { HTMLAttributes, ReactNode, Ref, RefAttributes } from "react";
import type { MiaixzSlotProps } from "../../shared/slots.js";

export type ShellSidebarOverflow = "auto" | "contained";
export type ShellDesktopNavigation =
  { readonly mode: "sidebar" } | { readonly mode: "rail"; readonly expanded: boolean };
export type ShellMobileNavigation =
  | { readonly mode: "none" }
  | { readonly mode: "bottom"; readonly content: ReactNode }
  | {
      readonly mode: "drawer";
      readonly open: boolean;
      readonly dismissLabel: string;
      readonly onOpenChange: (open: boolean) => void;
    };
export type ShellSlot = "root" | "header" | "sidebar" | "main" | "mobileNavigation";
export interface ShellOwnerState {
  readonly desktopNavigation: ShellDesktopNavigation;
  readonly mobileNavigation: ShellMobileNavigation;
  readonly headerBehavior: "fixed" | "scroll";
  readonly sidebarOverflow: ShellSidebarOverflow;
}
export type ShellRootAttributes = HTMLAttributes<HTMLDivElement> &
  RefAttributes<HTMLDivElement> & {
    readonly "data-desktop-navigation"?: "sidebar" | "rail";
    readonly "data-navigation-expanded"?: boolean;
    readonly "data-header-behavior"?: "fixed" | "scroll";
  };
export type ShellSidebarAttributes = HTMLAttributes<HTMLElement> & {
  readonly "data-overflow"?: ShellSidebarOverflow;
};
export interface ShellSlotProps {
  readonly root?: MiaixzSlotProps<ShellOwnerState, ShellRootAttributes>;
  readonly header?: MiaixzSlotProps<ShellOwnerState, HTMLAttributes<HTMLElement>>;
  readonly sidebar?: MiaixzSlotProps<ShellOwnerState, ShellSidebarAttributes>;
  readonly main?: MiaixzSlotProps<ShellOwnerState, HTMLAttributes<HTMLElement>>;
  readonly mobileNavigation?: MiaixzSlotProps<ShellOwnerState, HTMLAttributes<HTMLDivElement>>;
}
export interface MiaixzShellOwnProps {
  readonly mainRef?: Ref<HTMLElement>;
  readonly header: ReactNode;
  readonly sidebar: ReactNode;
  readonly children: ReactNode;
  readonly sidebarOverflow?: ShellSidebarOverflow;
  readonly headerBehavior?: "fixed" | "scroll";
  readonly desktopNavigation?: ShellDesktopNavigation;
  readonly mobileNavigation?: ShellMobileNavigation;
  readonly slotProps?: ShellSlotProps;
}
/*
 * Configures the root application shell. @public
 */
export type ShellProps = MiaixzShellOwnProps &
  Omit<HTMLAttributes<HTMLDivElement>, keyof MiaixzShellOwnProps>;

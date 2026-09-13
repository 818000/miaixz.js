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

/* eslint-disable jsdoc/require-jsdoc -- Closed tab state and slots are self-describing.
 */
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode, RefAttributes } from "react";
import type { MiaixzSlotProps } from "../../shared/slots.js";

export type TabsOrientation = "horizontal" | "vertical";
export type TabsActivationMode = "manual" | "automatic";
export interface TabsEntry {
  readonly value: string;
  readonly label: ReactNode;
  readonly content: ReactNode;
  readonly count?: ReactNode;
  readonly disabled?: boolean;
  readonly panelTabIndex?: 0 | -1;
}
export type TabsValueState =
  | {
      readonly value: string;
      readonly defaultValue?: never;
      readonly onValueChange?: (value: string) => void;
    }
  | {
      readonly value?: never;
      readonly defaultValue?: string;
      readonly onValueChange?: (value: string) => void;
    };
export type TabsSlot = "root" | "list" | "tab" | "label" | "count" | "panel";
export interface TabsOwnerState {
  readonly orientation: TabsOrientation;
  readonly activationMode: TabsActivationMode;
  readonly selected: boolean;
  readonly disabled: boolean;
  readonly value: string | undefined;
}
export type TabsRootAttributes = HTMLAttributes<HTMLDivElement> &
  RefAttributes<HTMLDivElement> & { readonly "data-orientation"?: TabsOrientation };
export interface TabsSlotProps {
  readonly root?: MiaixzSlotProps<TabsOwnerState, TabsRootAttributes>;
  readonly list?: MiaixzSlotProps<TabsOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly tab?: MiaixzSlotProps<TabsOwnerState, ButtonHTMLAttributes<HTMLButtonElement>>;
  readonly label?: MiaixzSlotProps<TabsOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly count?: MiaixzSlotProps<TabsOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly panel?: MiaixzSlotProps<TabsOwnerState, HTMLAttributes<HTMLDivElement>>;
}
export interface MiaixzTabsOwnProps {
  readonly items: readonly TabsEntry[];
  readonly label: string;
  readonly orientation?: TabsOrientation;
  readonly activationMode?: TabsActivationMode;
  readonly slotProps?: TabsSlotProps;
}
/*
 * Configures a declarative controlled or uncontrolled tabs collection. @public
 */
export type TabsProps = TabsValueState &
  MiaixzTabsOwnProps &
  Omit<
    HTMLAttributes<HTMLDivElement>,
    keyof MiaixzTabsOwnProps | keyof TabsValueState | "children"
  >;

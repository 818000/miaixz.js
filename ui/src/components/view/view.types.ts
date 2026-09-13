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

/* eslint-disable jsdoc/require-jsdoc -- Closed view modes and slots are self-describing.
 */
import type { HTMLAttributes, ReactNode, RefAttributes } from "react";
import type { MiaixzSlotProps } from "../../shared/slots.js";
import type { NavigationEntry } from "../navigation/navigation.types.js";
import type { TabsEntry, TabsValueState } from "../tabs/tabs.types.js";

export type ViewSurface = "plain" | "framed";
export type ViewDensity = "compact" | "standard" | "comfortable";
export type ViewMode = "content" | "navigation" | "tabs";
export type ViewSlot = "root" | "header" | "navigation" | "content" | "actions";
export interface ViewOwnerState {
  readonly mode: ViewMode;
  readonly surface: ViewSurface;
  readonly density: ViewDensity;
}
export type ViewRootAttributes = HTMLAttributes<HTMLElement> &
  RefAttributes<HTMLElement> & {
    readonly "data-mode"?: ViewMode;
    readonly "data-surface"?: ViewSurface;
    readonly "data-density"?: ViewDensity;
  };
export interface ViewSlotProps {
  readonly root?: MiaixzSlotProps<ViewOwnerState, ViewRootAttributes>;
  readonly header?: MiaixzSlotProps<ViewOwnerState, HTMLAttributes<HTMLElement>>;
  readonly navigation?: MiaixzSlotProps<ViewOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly content?: MiaixzSlotProps<ViewOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly actions?: MiaixzSlotProps<ViewOwnerState, HTMLAttributes<HTMLDivElement>>;
}
interface ViewBaseProps {
  readonly "aria-label": string;
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly actions?: ReactNode;
  readonly surface?: ViewSurface;
  readonly density?: ViewDensity;
  readonly headingLevel?: 1 | 2 | 3;
  readonly slotProps?: ViewSlotProps;
}
type ViewContentMode = {
  readonly mode?: "content";
  readonly children: ReactNode;
  readonly navigationLabel?: never;
  readonly items?: never;
  readonly value?: never;
  readonly defaultValue?: never;
  readonly onValueChange?: never;
};
type ViewNavigationMode = {
  readonly mode: "navigation";
  readonly navigationLabel: string;
  readonly items: readonly NavigationEntry[];
  readonly children: ReactNode;
  readonly value?: never;
  readonly defaultValue?: never;
  readonly onValueChange?: never;
};
type ViewTabsMode = {
  readonly mode: "tabs";
  readonly navigationLabel: string;
  readonly items: readonly TabsEntry[];
  readonly children?: never;
} & TabsValueState;
export type ViewModeProps = ViewContentMode | ViewNavigationMode | ViewTabsMode;
/*
 * Configures a structured route-level view. @public
 */
export type ViewProps = ViewBaseProps &
  ViewModeProps &
  Omit<
    HTMLAttributes<HTMLElement>,
    keyof ViewBaseProps | keyof ViewModeProps | "children" | "title"
  >;

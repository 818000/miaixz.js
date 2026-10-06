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
 * Defines the view public type contracts.
 */

import type { HTMLAttributes, ReactNode, RefAttributes } from "react";
import type { MiaixzSlotProps } from "../../shared/slots.js";
import type { NavigationEntry } from "../navigation/navigation.types.js";
import type { TabsEntry, TabsValueState } from "../tabs/tabs.types.js";

/**
 * View surface treatments permitted by the component contract.
 */
export type ViewSurface = "plain" | "framed";
/**
 * View spacing densities permitted by the component contract.
 */
export type ViewDensity = "compact" | "standard" | "comfortable";
/**
 * View presentation modes permitted by the component contract.
 */
export type ViewMode = "content" | "navigation" | "tabs";
/**
 * Named View parts available for slot and style customization.
 */
export type ViewSlot = "root" | "header" | "navigation" | "content" | "actions";
/**
 * Resolved View state exposed to theme and slot overrides.
 */
export interface ViewOwnerState {
  readonly mode: ViewMode;
  readonly surface: ViewSurface;
  readonly density: ViewDensity;
}
/**
 * Attributes accepted by the View Root slot.
 */
export type ViewRootAttributes = HTMLAttributes<HTMLElement> &
  RefAttributes<HTMLElement> & {
    readonly "data-mode"?: ViewMode;
    readonly "data-surface"?: ViewSurface;
    readonly "data-density"?: ViewDensity;
  };
/**
 * Per-slot attributes and state-dependent override callbacks for View.
 */
export interface ViewSlotProps {
  readonly root?: MiaixzSlotProps<ViewOwnerState, ViewRootAttributes>;
  readonly header?: MiaixzSlotProps<ViewOwnerState, HTMLAttributes<HTMLElement>>;
  readonly navigation?: MiaixzSlotProps<ViewOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly content?: MiaixzSlotProps<ViewOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly actions?: MiaixzSlotProps<ViewOwnerState, HTMLAttributes<HTMLDivElement>>;
}
/**
 * Component-specific View properties composed with the permitted native attributes.
 */
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
/**
 * View variant displaying static content without navigation selection.
 */
type ViewContentMode = {
  readonly mode?: "content";
  readonly children: ReactNode;
  readonly navigationLabel?: never;
  readonly items?: never;
  readonly value?: never;
  readonly defaultValue?: never;
  readonly onValueChange?: never;
};
/**
 * View variant exposing link-based navigation alongside content.
 */
type ViewNavigationMode = {
  readonly mode: "navigation";
  readonly navigationLabel: string;
  readonly items: readonly NavigationEntry[];
  readonly children: ReactNode;
  readonly value?: never;
  readonly defaultValue?: never;
  readonly onValueChange?: never;
};
/**
 * View variant coordinating tab selection and associated panels.
 */
type ViewTabsMode = {
  readonly mode: "tabs";
  readonly navigationLabel: string;
  readonly items: readonly TabsEntry[];
  readonly children?: never;
} & TabsValueState;
/**
 * Discriminated content, navigation, or tabs configuration accepted by View.
 */
export type ViewModeProps = ViewContentMode | ViewNavigationMode | ViewTabsMode;
/**
 * Configures a structured route-level view. @public
 */
export type ViewProps = ViewBaseProps &
  ViewModeProps &
  Omit<
    HTMLAttributes<HTMLElement>,
    keyof ViewBaseProps | keyof ViewModeProps | "children" | "title"
  >;

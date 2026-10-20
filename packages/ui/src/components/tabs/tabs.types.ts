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
 * Defines the tabs public type contracts.
 */

import type { LinkRefreshMode } from "../../shared/anchor.js";

import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode, RefAttributes } from "react";
import type { MiaixzSlotProps } from "../../shared/slots.js";

/**
 * Tabs layout orientations permitted by the component contract.
 */
export type TabsOrientation = "horizontal" | "vertical";
/**
 * Tabs keyboard tab-activation modes permitted by the component contract.
 */
export type TabsActivationMode = "manual" | "automatic";
/**
 * Tab identifier, visible heading, and associated panel content.
 */
export interface TabsEntry {
  readonly value: string;
  readonly label: ReactNode;
  readonly content: ReactNode;
  readonly count?: ReactNode;
  readonly disabled?: boolean;
  readonly panelTabIndex?: 0 | -1;
}
/**
 * Mutually exclusive controlled or uncontrolled active-tab settings.
 */
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
/**
 * Named Tabs parts available for slot and style customization.
 */
export type TabsSlot = "root" | "header" | "list" | "actions" | "tab" | "label" | "count" | "panel";
/**
 * Resolved Tabs state exposed to theme and slot overrides.
 */
export interface TabsOwnerState {
  readonly orientation: TabsOrientation;
  readonly activationMode: TabsActivationMode;
  readonly selected: boolean;
  readonly disabled: boolean;
  readonly value: string | undefined;
}
/**
 * Attributes accepted by the Tabs Root slot.
 */
export type TabsRootAttributes = HTMLAttributes<HTMLDivElement> &
  RefAttributes<HTMLDivElement> & {
    readonly "data-orientation"?: TabsOrientation;
    readonly "data-variant"?: "default" | "navigation" | "editor";
    readonly "data-panel-padding"?: "default" | "none";
  };
/**
 * Attributes accepted by the Tabs Header slot.
 */
export type TabsHeaderAttributes = HTMLAttributes<HTMLDivElement> & {
  readonly "data-actions-placement"?: "end" | "adjacent";
  readonly "data-inset"?: boolean;
};
/**
 * Per-slot attributes and state-dependent override callbacks for Tabs.
 */
export interface TabsSlotProps {
  readonly root?: MiaixzSlotProps<TabsOwnerState, TabsRootAttributes>;
  readonly header?: MiaixzSlotProps<TabsOwnerState, TabsHeaderAttributes>;
  readonly list?: MiaixzSlotProps<TabsOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly actions?: MiaixzSlotProps<TabsOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly tab?: MiaixzSlotProps<TabsOwnerState, ButtonHTMLAttributes<HTMLButtonElement>>;
  readonly label?: MiaixzSlotProps<TabsOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly count?: MiaixzSlotProps<TabsOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly panel?: MiaixzSlotProps<TabsOwnerState, HTMLAttributes<HTMLDivElement>>;
}
/**
 * Component-specific Tabs properties composed with the permitted native attributes.
 */
export interface MiaixzTabsOwnProps {
  /**
   * Selects in-place updates or a browser reload that restores the selected tab.
   */
  readonly refreshMode?: LinkRefreshMode;
  /**
   * Distinguishes reload restoration for multiple tab collections on the same route.
   */
  readonly persistenceKey?: string;
  readonly items: readonly TabsEntry[];
  readonly label: string;
  readonly orientation?: TabsOrientation;
  readonly activationMode?: TabsActivationMode;
  readonly actions?: ReactNode;
  readonly actionsPlacement?: "end" | "adjacent";
  readonly headerInset?: boolean;
  readonly headerVariant?: "default" | "toolbar";
  readonly panelPadding?: "default" | "none";
  readonly variant?: "default" | "navigation" | "editor";
  readonly slotProps?: TabsSlotProps;
}
/**
 * Configures a declarative controlled or uncontrolled tabs collection. @public
 */
export type TabsProps = TabsValueState &
  MiaixzTabsOwnProps &
  Omit<
    HTMLAttributes<HTMLDivElement>,
    keyof MiaixzTabsOwnProps | keyof TabsValueState | "children"
  >;

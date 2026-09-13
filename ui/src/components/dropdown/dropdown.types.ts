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

/* eslint-disable jsdoc/require-jsdoc -- The public menu union mirrors its WAI-ARIA item kinds.
 */

import type { AnchorHTMLAttributes, ButtonHTMLAttributes, MouseEvent, ReactNode } from "react";

import type { PopoverChangeReason, PopoverProps } from "../popover/popover.types.js";

export type DropdownTone = "neutral" | "danger";

export type DropdownButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "aria-checked" | "children" | "disabled" | "id" | "onClick" | "role" | "tabIndex" | "type"
>;

export type DropdownAnchorProps = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "aria-checked" | "children" | "href" | "id" | "role" | "tabIndex"
>;

export interface DropdownPresentation {
  readonly id: string;
  readonly label: ReactNode;
  readonly textValue: string;
  readonly icon?: ReactNode;
  readonly description?: ReactNode;
  readonly tone?: DropdownTone;
}

export interface DropdownActionEntry extends DropdownPresentation {
  readonly kind: "action";
  readonly onAction: (event: MouseEvent<HTMLButtonElement>) => void;
  readonly disabled?: boolean;
  readonly buttonProps?: DropdownButtonProps;
  readonly href?: never;
  readonly checked?: never;
  readonly items?: never;
}

export interface DropdownLinkEntry extends DropdownPresentation {
  readonly kind: "link";
  readonly href: string;
  readonly anchorProps?: DropdownAnchorProps;
  readonly onAction?: never;
  readonly disabled?: never;
  readonly checked?: never;
  readonly items?: never;
}

export interface DropdownCheckboxEntry extends DropdownPresentation {
  readonly kind: "checkbox";
  readonly checked: boolean;
  readonly onCheckedChange: (checked: boolean, event: MouseEvent<HTMLButtonElement>) => void;
  readonly disabled?: boolean;
  readonly buttonProps?: DropdownButtonProps;
  readonly href?: never;
  readonly onAction?: never;
  readonly items?: never;
}

export interface DropdownRadioOption {
  readonly id: string;
  readonly value: string;
  readonly label: ReactNode;
  readonly textValue: string;
  readonly disabled?: boolean;
}

export interface DropdownRadioGroupEntry {
  readonly kind: "radioGroup";
  readonly id: string;
  readonly label: ReactNode;
  readonly value: string;
  readonly options: readonly DropdownRadioOption[];
  readonly onValueChange: (value: string, event: MouseEvent<HTMLButtonElement>) => void;
}

export interface DropdownLabelEntry {
  readonly kind: "label";
  readonly id: string;
  readonly label: ReactNode;
}

export interface DropdownDividerEntry {
  readonly kind: "divider";
  readonly id: string;
}

export type DropdownSubmenuItem =
  | DropdownActionEntry
  | DropdownLinkEntry
  | DropdownCheckboxEntry
  | DropdownRadioGroupEntry
  | DropdownLabelEntry
  | DropdownDividerEntry;

export interface DropdownSubmenuEntry extends DropdownPresentation {
  readonly kind: "submenu";
  readonly items: readonly DropdownSubmenuItem[];
  readonly disabled?: boolean;
  readonly href?: never;
  readonly onAction?: never;
  readonly checked?: never;
}

export type DropdownEntry = DropdownSubmenuItem | DropdownSubmenuEntry;

export type DropdownChangeReason = PopoverChangeReason | "selection";

export type DropdownOpenState =
  | {
      readonly open: boolean;
      readonly defaultOpen?: never;
      readonly onOpenChange: (open: boolean, reason: DropdownChangeReason) => void;
    }
  | {
      readonly open?: never;
      readonly defaultOpen?: boolean;
      readonly onOpenChange?: (open: boolean, reason: DropdownChangeReason) => void;
    };

/**
 * Configures a disclosure-based menu generated only from stable entry data.
 *
 * @public
 */
export type DropdownProps = DropdownOpenState &
  Omit<PopoverProps, "children" | "onOpenChange" | "open" | "defaultOpen" | "popupRole"> & {
    readonly items: readonly DropdownEntry[];
    readonly label?: string;
    readonly surface?: "framed" | "plain";
    readonly density?: "compact" | "standard" | "comfortable";
  };

/* eslint-enable jsdoc/require-jsdoc
 */

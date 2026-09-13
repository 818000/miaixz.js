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

/* eslint-disable jsdoc/require-jsdoc -- Exported action contracts are concise discriminated unions.
 */

import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  HTMLAttributes,
  MouseEvent,
  RefAttributes,
} from "react";

import type { MiaixzIconName } from "../../icons/icon-name.generated.js";
import type { MiaixzSlotProps } from "../../shared/slots.js";
import type { ButtonLinkSlotProps, ButtonSlotProps, ButtonTone } from "../button/button.types.js";

export interface ActionBase {
  readonly id: string;
  readonly label: string;
  readonly icon?: MiaixzIconName;
  readonly tone?: "neutral" | "brand" | "danger";
  readonly size?: "small" | "medium" | "large";
  readonly description?: string;
}

export interface CommandAction extends ActionBase {
  readonly kind: "command";
  readonly onAction: (event: MouseEvent<HTMLButtonElement>) => void;
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly buttonProps?: Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    "aria-busy" | "children" | "disabled" | "onClick" | "type"
  >;
  readonly href?: never;
}

export interface NavigationAction extends ActionBase {
  readonly kind: "navigation";
  readonly href: string;
  readonly anchorProps?: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children" | "href">;
  readonly onAction?: never;
  readonly disabled?: never;
  readonly loading?: never;
}

export type ActionDescriptor = CommandAction | NavigationAction;

export interface ActionTextSlotProps {
  readonly root?: ButtonSlotProps["root"] | ButtonLinkSlotProps["root"];
  readonly label?: ButtonSlotProps["label"];
  readonly startIcon?: ButtonSlotProps["startIcon"];
}

export interface ActionTextProps {
  readonly action: ActionDescriptor;
  readonly slotProps?: ActionTextSlotProps;
}

export interface IconButtonOwnerState {
  readonly tone: ButtonTone;
  readonly size: "small" | "medium" | "large";
  readonly loading: boolean;
  readonly disabled: boolean;
  readonly pressed?: boolean;
}

export interface IconButtonSlotProps {
  readonly root?: MiaixzSlotProps<IconButtonOwnerState, IconButtonRootAttributes>;
  readonly icon?: MiaixzSlotProps<IconButtonOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly loadingIndicator?: MiaixzSlotProps<
    IconButtonOwnerState,
    HTMLAttributes<HTMLSpanElement>
  >;
}

export interface IconButtonRootAttributes
  extends ButtonHTMLAttributes<HTMLButtonElement>, RefAttributes<HTMLButtonElement> {
  readonly "data-loading"?: boolean;
  readonly "data-miaixz-ripple"?: string;
  readonly "data-size"?: "small" | "medium" | "large";
  readonly "data-tone"?: "neutral" | "brand" | "danger";
  readonly "data-variant"?: "plain";
}

export interface IconButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "aria-label" | "children"
> {
  readonly label: string;
  readonly icon: MiaixzIconName;
  readonly tone?: "neutral" | "brand" | "danger";
  readonly size?: "small" | "medium" | "large";
  readonly loading?: boolean;
  readonly tooltip?: boolean;
  readonly pressed?: boolean;
  readonly slotProps?: IconButtonSlotProps;
}

export interface MoreActionsProps {
  readonly actions: readonly ActionDescriptor[];
}

export interface RowActionsOwnerState {
  readonly overflow: boolean;
}

export interface RowActionsSlotProps {
  readonly root?: MiaixzSlotProps<RowActionsOwnerState, HTMLAttributes<HTMLDivElement>>;
}

export interface RowActionsProps {
  readonly actions: readonly ActionDescriptor[];
  readonly overflowLabel?: string;
  readonly slotProps?: RowActionsSlotProps;
}

export interface ActionBarOwnerState {
  readonly hasPrimary: boolean;
  readonly overflow: boolean;
}

export interface ActionBarSlotProps {
  readonly root?: MiaixzSlotProps<ActionBarOwnerState, HTMLAttributes<HTMLDivElement>>;
}

export interface ActionBarProps {
  readonly primary?: ActionDescriptor;
  readonly actions: readonly ActionDescriptor[];
  readonly slotProps?: ActionBarSlotProps;
}

export interface FormCancelAction {
  readonly id: string;
  readonly label: string;
  readonly icon?: MiaixzIconName;
  readonly disabled?: boolean;
  readonly onAction: (event: MouseEvent<HTMLButtonElement>) => void;
  readonly buttonProps?: Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    "children" | "disabled" | "onClick" | "type"
  >;
}

export interface FormSubmitAction {
  readonly id: string;
  readonly label: string;
  readonly icon?: MiaixzIconName;
  readonly tone?: "brand" | "danger";
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly buttonProps?: Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    "aria-busy" | "children" | "disabled" | "onClick" | "type"
  >;
}

export interface FormActionsOwnerState {
  readonly fixed: boolean;
  readonly loading: boolean;
}

export interface FormActionsSlotProps {
  readonly root?: MiaixzSlotProps<FormActionsOwnerState, FormActionsRootAttributes>;
  readonly cancel?: ButtonSlotProps;
  readonly submit?: ButtonSlotProps;
}

export interface FormActionsRootAttributes extends HTMLAttributes<HTMLDivElement> {
  readonly "data-fixed"?: string;
}

export interface FormActionsProps {
  readonly cancel?: FormCancelAction;
  readonly submit: FormSubmitAction;
  readonly fixed?: boolean;
  readonly slotProps?: FormActionsSlotProps;
}

/* eslint-enable jsdoc/require-jsdoc
 */

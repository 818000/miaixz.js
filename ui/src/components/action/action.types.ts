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

/* eslint-disable jsdoc/require-jsdoc -- The frozen public contract is documented by its exported component interfaces.
 */

import type { HTMLAttributeAnchorTarget, MouseEvent } from "react";

import type { MiaixzIconName } from "../../icons/index.js";
import type { ActionIntent } from "./action-intent.js";

export type ActionTone = "neutral" | "brand" | "danger";
export type ActionSize = "compact" | "default";
export type ActionConfirm = "none" | "normal" | "danger";
export type ActionPlacement = "visible" | "overflow" | "form-primary" | "form-secondary" | "icon";

export interface ActionCommandTarget {
  readonly href?: never;
  readonly onAction: (event: MouseEvent<HTMLButtonElement>) => void;
  readonly disabled?: boolean;
  readonly loading?: boolean;
}

export interface ActionNavigationTarget {
  readonly href: string;
  readonly onAction?: never;
  readonly disabled?: never;
  readonly loading?: never;
  readonly target?: HTMLAttributeAnchorTarget;
  readonly rel?: string;
}

export interface ActionPresentation {
  readonly id: string;
  readonly intent: ActionIntent;
  readonly label: string;
  readonly icon: MiaixzIconName;
  readonly tone: ActionTone;
  readonly size?: ActionSize;
  readonly confirm: ActionConfirm;
  readonly placement: ActionPlacement;
  readonly description?: string;
  readonly selected?: boolean;
  readonly "aria-label"?: string;
  readonly "aria-controls"?: string;
  readonly "aria-expanded"?: boolean;
  readonly "aria-haspopup"?: "menu" | "dialog" | "listbox" | "tree" | "grid" | true | false;
  readonly "aria-current"?: "page" | "step" | "location" | "date" | "time" | true | false;
  readonly "data-testid"?: string;
}

export type ActionDescriptor = ActionPresentation & (ActionCommandTarget | ActionNavigationTarget);

export type PrimaryActionIntent = "create" | "save" | "submit" | "publish";

export type PrimaryActionDescriptor = ActionDescriptor & {
  readonly intent: PrimaryActionIntent;
  readonly tone: "brand";
};

export interface ActionTextProps {
  readonly action: ActionDescriptor;
  readonly collapseLabelAt?: "compact";
  readonly id?: string;
  readonly "aria-controls"?: string;
  readonly "aria-expanded"?: boolean;
  readonly "aria-haspopup"?: "menu" | "dialog" | "listbox" | "tree" | "grid" | true | false;
}

export interface IconButtonProps {
  readonly action: ActionDescriptor;
  readonly pressed?: boolean;
  readonly id?: string;
  readonly "aria-controls"?: string;
  readonly "aria-expanded"?: boolean;
  readonly "aria-haspopup"?: "menu" | "dialog" | "listbox" | "tree" | "grid" | true | false;
}

export interface MoreActionsProps {
  readonly actions: readonly ActionDescriptor[];
}

export interface RowActionsProps {
  readonly actions: readonly ActionDescriptor[];
}

export interface ActionBarProps {
  readonly primary?: PrimaryActionDescriptor;
  readonly actions: readonly ActionDescriptor[];
}

export interface FormActionsProps {
  readonly cancel: ActionDescriptor;
  readonly submit: PrimaryActionDescriptor;
  readonly dirty?: boolean;
  readonly fixed?: boolean;
  readonly danger?: boolean;
}

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

/* eslint-disable jsdoc/require-jsdoc -- Closed list item branches and slots are self-describing.
 */
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  HTMLAttributes,
  MouseEvent,
  ReactNode,
  RefAttributes,
} from "react";
import type { MiaixzSlotProps } from "../../shared/slots.js";
import type { MiaixzVisualTone } from "../shared.types.js";

type WithoutInteractionHandlers<Props> = {
  readonly [Key in keyof Props as Key extends `on${string}` ? never : Key]: Props[Key];
};
export type ListItemRootAttributes = Omit<
  WithoutInteractionHandlers<HTMLAttributes<HTMLLIElement>>,
  "aria-current" | "aria-disabled" | "children" | "id" | "role" | "tabIndex"
>;
export type StaticListControlAttributes = Omit<
  WithoutInteractionHandlers<HTMLAttributes<HTMLDivElement>>,
  "aria-current" | "aria-disabled" | "children" | "role" | "tabIndex"
>;
export type ListItemContent =
  | { readonly content: ReactNode; readonly title?: never; readonly description?: never }
  | { readonly content?: never; readonly title: ReactNode; readonly description?: ReactNode };
interface ListItemPresentation extends ListItemRootAttributes {
  readonly id: string;
  readonly icon?: ReactNode;
  readonly meta?: ReactNode;
  readonly actions?: ReactNode;
  readonly tone?: MiaixzVisualTone;
}
type StaticListItem = {
  readonly kind: "static";
  readonly divProps?: StaticListControlAttributes;
  readonly href?: never;
  readonly onAction?: never;
  readonly disabled?: never;
  readonly anchorProps?: never;
  readonly buttonProps?: never;
};
type NavigationListItem = {
  readonly kind: "navigation";
  readonly href: string;
  readonly anchorProps?: Omit<
    AnchorHTMLAttributes<HTMLAnchorElement>,
    "aria-disabled" | "children" | "href"
  >;
  readonly onAction?: never;
  readonly disabled?: never;
  readonly divProps?: never;
  readonly buttonProps?: never;
};
type CommandListItem = {
  readonly kind: "command";
  readonly onAction: (event: MouseEvent<HTMLButtonElement>) => void;
  readonly disabled?: boolean;
  readonly buttonProps?: Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    "aria-disabled" | "children" | "disabled" | "onClick" | "type"
  >;
  readonly href?: never;
  readonly divProps?: never;
  readonly anchorProps?: never;
};
export type ListItemProps = ListItemContent &
  ListItemPresentation &
  (StaticListItem | NavigationListItem | CommandListItem) & {
    readonly slotProps?: ListItemSlotProps;
  };

export type ListLayout = "list" | "grid";
export type ListDensity = "compact" | "standard" | "comfortable";
export type ListSurface = "plain" | "panel";
export type ListSlot = "root";
export interface ListOwnerState {
  readonly layout: ListLayout;
  readonly density: ListDensity;
  readonly surface: ListSurface;
  readonly dividers: boolean;
  readonly bordered: boolean;
}
export type ListRootAttributes = HTMLAttributes<HTMLUListElement> &
  RefAttributes<HTMLUListElement> & {
    readonly "data-layout"?: ListLayout;
    readonly "data-density"?: ListDensity;
    readonly "data-surface"?: ListSurface;
    readonly "data-dividers"?: boolean;
    readonly "data-bordered"?: boolean;
  };
export interface ListProps extends Omit<HTMLAttributes<HTMLUListElement>, "children"> {
  readonly items: readonly ListItemProps[];
  readonly layout?: ListLayout;
  readonly density?: ListDensity;
  readonly surface?: ListSurface;
  readonly dividers?: boolean;
  readonly bordered?: boolean;
  readonly slotProps?: { readonly root?: MiaixzSlotProps<ListOwnerState, ListRootAttributes> };
}

export type ListItemSlot = "root" | "primary" | "icon" | "content" | "meta" | "actions";
export interface ListItemOwnerState {
  readonly kind: "static" | "navigation" | "command";
  readonly tone: MiaixzVisualTone;
  readonly density: ListDensity;
  readonly surface: ListSurface;
}
export type ListItemSlotProps = {
  readonly root?: MiaixzSlotProps<ListItemOwnerState, ListItemRootAttributes>;
  readonly primary?: MiaixzSlotProps<ListItemOwnerState, HTMLAttributes<HTMLElement>>;
  readonly icon?: MiaixzSlotProps<ListItemOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly content?: MiaixzSlotProps<ListItemOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly meta?: MiaixzSlotProps<ListItemOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly actions?: MiaixzSlotProps<ListItemOwnerState, HTMLAttributes<HTMLSpanElement>>;
};

export interface ListMarkerProps extends HTMLAttributes<HTMLSpanElement> {
  readonly variant?: "default" | "step" | "dot";
}
export interface ListCounterProps extends HTMLAttributes<HTMLSpanElement> {
  readonly variant?: "default" | "alert";
}

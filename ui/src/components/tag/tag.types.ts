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

import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  HTMLAttributes,
  ReactElement,
  ReactNode,
  RefAttributes,
} from "react";

import type { MiaixzSlotProps } from "../../shared/slots.js";
import type { MiaixzVisualTone } from "../shared.types.js";

export type TagVariant = "filled" | "outlined";
export type TagSlot = "root" | "action" | "icon" | "avatar" | "label" | "remove";

export interface TagOwnerState {
  readonly tone: MiaixzVisualTone;
  readonly variant: TagVariant;
  readonly disabled: boolean;
  readonly selected: boolean;
  readonly actionable: boolean;
  readonly removable: boolean;
}

export interface TagRootAttributes
  extends HTMLAttributes<HTMLSpanElement>, RefAttributes<HTMLSpanElement> {
  readonly "data-ui"?: "tag";
  readonly "data-tone"?: MiaixzVisualTone;
  readonly "data-variant"?: TagVariant;
  readonly "data-disabled"?: boolean;
  readonly "data-selected"?: boolean;
}

export interface TagSlotProps {
  readonly root?: MiaixzSlotProps<TagOwnerState, TagRootAttributes>;
  readonly action?: MiaixzSlotProps<
    TagOwnerState,
    ButtonHTMLAttributes<HTMLButtonElement> & AnchorHTMLAttributes<HTMLAnchorElement>
  >;
  readonly icon?: MiaixzSlotProps<TagOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly avatar?: MiaixzSlotProps<TagOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly label?: MiaixzSlotProps<TagOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly remove?: MiaixzSlotProps<TagOwnerState, ButtonHTMLAttributes<HTMLButtonElement>>;
}

interface TagBaseProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  readonly children: ReactNode;
  readonly tone?: MiaixzVisualTone;
  readonly variant?: TagVariant;
  readonly disabled?: boolean;
  readonly onRemove?: () => void;
  readonly removeLabel?: string;
  readonly slotProps?: TagSlotProps;
}

type TagGraphic =
  | { readonly icon?: ReactElement; readonly avatar?: never }
  | { readonly icon?: never; readonly avatar?: ReactElement };

type TagInteraction =
  | { readonly href?: never; readonly onAction?: never; readonly selected?: never }
  | { readonly href?: never; readonly onAction: () => void; readonly selected?: boolean }
  | { readonly href: string; readonly onAction?: never; readonly selected?: never };

export type TagProps = TagBaseProps & TagGraphic & TagInteraction;

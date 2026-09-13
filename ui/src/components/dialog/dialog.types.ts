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

/* eslint-disable jsdoc/require-jsdoc -- Closed dialog slots and state are self-describing.
 */

import type {
  ButtonHTMLAttributes,
  DialogHTMLAttributes,
  HTMLAttributes,
  ReactNode,
  RefAttributes,
  RefObject,
} from "react";

import type { MiaixzSlotComponent, MiaixzSlotProps } from "../../shared/slots.js";

export type DialogSize = "small" | "medium" | "large";
export type DialogScroll = "paper" | "body";
export type DialogCloseReason = "escape" | "backdrop" | "closeButton" | "nativeClose";
export type DialogSlot =
  "root" | "paper" | "header" | "title" | "description" | "content" | "actions" | "closeButton";

export interface DialogOwnerState {
  readonly size: DialogSize;
  readonly scroll: DialogScroll;
  readonly open: boolean;
  readonly showClose: boolean;
}

export interface DialogSlots {
  readonly description?: MiaixzSlotComponent<HTMLAttributes<HTMLDivElement>>;
}

export type DialogRootAttributes = DialogHTMLAttributes<HTMLDialogElement> &
  RefAttributes<HTMLDialogElement> & {
    readonly "data-size"?: DialogSize;
    readonly "data-scroll"?: DialogScroll;
  };

export interface DialogSlotProps {
  readonly root?: MiaixzSlotProps<DialogOwnerState, DialogRootAttributes>;
  readonly paper?: MiaixzSlotProps<
    DialogOwnerState,
    HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>
  >;
  readonly header?: MiaixzSlotProps<DialogOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly title?: MiaixzSlotProps<DialogOwnerState, HTMLAttributes<HTMLHeadingElement>>;
  readonly description?: MiaixzSlotProps<DialogOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly content?: MiaixzSlotProps<DialogOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly actions?: MiaixzSlotProps<DialogOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly closeButton?: MiaixzSlotProps<
    DialogOwnerState,
    ButtonHTMLAttributes<HTMLButtonElement> & RefAttributes<HTMLButtonElement>
  >;
}

export interface MiaixzDialogOwnProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean, reason: DialogCloseReason) => void;
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly children: ReactNode;
  readonly footer?: ReactNode;
  readonly headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  readonly size?: DialogSize;
  readonly scroll?: DialogScroll;
  readonly showClose?: boolean;
  readonly closeOnBackdrop?: boolean;
  readonly closeLabel?: string;
  readonly initialFocusRef?: RefObject<HTMLElement | null>;
  readonly slots?: DialogSlots;
  readonly slotProps?: DialogSlotProps;
}

export type DialogProps = MiaixzDialogOwnProps &
  Omit<DialogHTMLAttributes<HTMLDialogElement>, keyof MiaixzDialogOwnProps | "role">;

/* eslint-enable jsdoc/require-jsdoc
 */

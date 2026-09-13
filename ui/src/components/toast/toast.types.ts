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

/* eslint-disable jsdoc/require-jsdoc -- Closed toast slots are self-describing.
 */
import type { HTMLAttributes, MouseEvent, ReactNode, RefAttributes } from "react";
import type { MiaixzSlotComponent, MiaixzSlotProps } from "../../shared/slots.js";
import type { ButtonProps } from "../button/button.types.js";
import type { IconButtonProps } from "../action/action.types.js";

export type ToastTone = "neutral" | "success" | "warning" | "danger" | "info";
export type ToastCloseReason = "dismiss" | "timeout" | "action" | "programmatic";
export interface ToastAction {
  readonly label: string;
  readonly onAction: (event: MouseEvent<HTMLButtonElement>) => void;
}
export type ToastSlot =
  "root" | "icon" | "content" | "title" | "message" | "actions" | "action" | "dismiss";
export interface ToastOwnerState {
  readonly tone: ToastTone;
  readonly actionable: boolean;
  readonly dismissible: boolean;
}
export interface ToastSlots {
  readonly title?: MiaixzSlotComponent<HTMLAttributes<HTMLDivElement>>;
  readonly message?: MiaixzSlotComponent<HTMLAttributes<HTMLDivElement>>;
}
export type ToastRootAttributes = HTMLAttributes<HTMLDivElement> &
  RefAttributes<HTMLDivElement> & { readonly "data-tone"?: ToastTone };
export interface ToastSlotProps {
  readonly root?: MiaixzSlotProps<ToastOwnerState, ToastRootAttributes>;
  readonly icon?: MiaixzSlotProps<ToastOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly content?: MiaixzSlotProps<ToastOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly title?: MiaixzSlotProps<ToastOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly message?: MiaixzSlotProps<ToastOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly actions?: MiaixzSlotProps<ToastOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly action?: MiaixzSlotProps<ToastOwnerState, Omit<ButtonProps, "children">>;
  readonly dismiss?: MiaixzSlotProps<ToastOwnerState, IconButtonProps>;
}
export interface MiaixzToastOwnProps {
  readonly id: string;
  readonly title: ReactNode;
  readonly message?: ReactNode;
  readonly action?: ToastAction;
  readonly tone?: ToastTone;
  readonly dismissLabel?: string;
  readonly onClose?: (id: string, reason: ToastCloseReason) => void;
  readonly slots?: ToastSlots;
  readonly slotProps?: ToastSlotProps;
}
export type ToastProps = MiaixzToastOwnProps &
  Omit<
    HTMLAttributes<HTMLDivElement>,
    keyof MiaixzToastOwnProps | "children" | "role" | "aria-live" | "aria-atomic"
  >;
/* eslint-enable jsdoc/require-jsdoc
 */

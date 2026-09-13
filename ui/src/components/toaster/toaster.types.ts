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

/* eslint-disable jsdoc/require-jsdoc -- Closed toaster slots are self-describing.
 */
import type { HTMLAttributes, ReactNode, RefAttributes } from "react";
import type { MiaixzSlotProps } from "../../shared/slots.js";
import type { ToastAction, ToastCloseReason, ToastTone } from "../toast/toast.types.js";

export interface ToastOptions {
  readonly id?: string;
  readonly title: ReactNode;
  readonly message?: ReactNode;
  readonly action?: ToastAction;
  readonly tone?: ToastTone;
  readonly duration?: number;
  readonly dismissLabel?: string;
}
export interface ToastRecord extends ToastOptions {
  readonly id: string;
}
export type ToasterSlot = "root" | "politeRegion" | "assertiveRegion";
export interface ToasterOwnerState {
  readonly visibleCount: number;
  readonly queuedCount: number;
  readonly maxVisible: number;
}
export interface ToasterSlotProps {
  readonly root?: MiaixzSlotProps<
    ToasterOwnerState,
    HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>
  >;
  readonly politeRegion?: MiaixzSlotProps<ToasterOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly assertiveRegion?: MiaixzSlotProps<ToasterOwnerState, HTMLAttributes<HTMLDivElement>>;
}
export interface ToasterProps {
  readonly children: ReactNode;
  readonly defaultDuration?: number;
  readonly maxVisible?: number;
  readonly onClose?: (id: string, reason: ToastCloseReason) => void;
  readonly slotProps?: ToasterSlotProps;
}
export interface ToastContextValue {
  readonly notify: (options: ToastOptions) => string;
  readonly dismiss: (id: string) => void;
  readonly dismissAll: () => void;
}
/* eslint-enable jsdoc/require-jsdoc
 */

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
 * Defines the toaster public type contracts.
 */

import type { HTMLAttributes, ReactNode, RefAttributes } from "react";
import type { MiaixzSlotProps } from "../../shared/slots.js";
import type { ToastAction, ToastCloseReason, ToastTone } from "../toast/toast.types.js";

/**
 * Content, tone, actions, and lifetime accepted when creating or updating a managed toast.
 */
export interface ToastOptions {
  readonly id?: string;
  readonly title: ReactNode;
  readonly message?: ReactNode;
  readonly action?: ToastAction;
  readonly tone?: ToastTone;
  readonly duration?: number;
  readonly dismissLabel?: string;
}
/**
 * Toast identity and options retained by the toaster manager.
 */
export interface ToastRecord extends ToastOptions {
  readonly id: string;
}
/**
 * Named Toaster parts available for slot and style customization.
 */
export type ToasterSlot = "root" | "politeRegion" | "assertiveRegion";
/**
 * Resolved Toaster state exposed to theme and slot overrides.
 */
export interface ToasterOwnerState {
  readonly visibleCount: number;
  readonly queuedCount: number;
  readonly maxVisible: number;
  readonly presentation: "default" | "silent";
}
/**
 * Per-slot attributes and state-dependent override callbacks for Toaster.
 */
export interface ToasterSlotProps {
  readonly root?: MiaixzSlotProps<
    ToasterOwnerState,
    HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>
  >;
  readonly politeRegion?: MiaixzSlotProps<ToasterOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly assertiveRegion?: MiaixzSlotProps<ToasterOwnerState, HTMLAttributes<HTMLDivElement>>;
}
/**
 * Properties accepted by the Toaster renderer.
 */
export interface ToasterProps {
  readonly children: ReactNode;
  readonly defaultDuration?: number;
  readonly maxVisible?: number;
  readonly onClose?: (id: string, reason: ToastCloseReason) => void;
  /**
   * Keeps the queue provider active without mounting visual or live-region output.
   */
  readonly presentation?: "default" | "silent";
  readonly slotProps?: ToasterSlotProps;
}
/**
 * Values shared between the Toast provider and its descendant components.
 */
export interface ToastContextValue {
  readonly notify: (options: ToastOptions) => string;
  readonly dismiss: (id: string) => void;
  readonly dismissAll: () => void;
}

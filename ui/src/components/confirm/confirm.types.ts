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

/* eslint-disable jsdoc/require-jsdoc -- Closed confirmation slots are self-describing.
 */

import type { HTMLAttributes, ReactNode } from "react";

import type { MiaixzSlotProps } from "../../shared/slots.js";
import type { ButtonProps } from "../button/button.types.js";

export type ConfirmTone = "normal" | "danger";
export type ConfirmCloseReason = "cancel" | "confirm" | "escape" | "backdrop";
export type ConfirmSlot = "root" | "confirmationInput" | "error" | "cancelButton" | "confirmButton";

export interface ConfirmOwnerState {
  readonly open: boolean;
  readonly tone: ConfirmTone;
  readonly pending: boolean;
  readonly confirmationRequired: boolean;
  readonly confirmationMatches: boolean;
}

export interface ConfirmSlotProps {
  readonly root?: MiaixzSlotProps<ConfirmOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly confirmationInput?: MiaixzSlotProps<ConfirmOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly error?: MiaixzSlotProps<ConfirmOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly cancelButton?: MiaixzSlotProps<ConfirmOwnerState, Omit<ButtonProps, "children">>;
  readonly confirmButton?: MiaixzSlotProps<ConfirmOwnerState, Omit<ButtonProps, "children">>;
}

export interface ConfirmProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean, reason: ConfirmCloseReason) => void;
  readonly title: ReactNode;
  readonly description: ReactNode;
  readonly confirmLabel: string;
  readonly cancelLabel: string;
  readonly tone?: ConfirmTone;
  readonly confirmationText?: string;
  readonly pending?: boolean;
  readonly error?: ReactNode;
  readonly errorFormatter?: (error: unknown) => ReactNode;
  readonly onError?: (error: unknown) => void;
  readonly onConfirm: () => void | Promise<void>;
  readonly slotProps?: ConfirmSlotProps;
}

/* eslint-enable jsdoc/require-jsdoc
 */

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
 * Defines the confirm public type contracts.
 */

import type { HTMLAttributes, ReactNode } from "react";

import type { MiaixzSlotProps } from "../../shared/slots.js";
import type { ButtonProps } from "../button/button.types.js";

/**
 * Confirm semantic color tones permitted by the component contract.
 */
export type ConfirmTone = "normal" | "info" | "success" | "warning" | "danger";
/**
 * Confirm dismissal reasons permitted by the component contract.
 */
export type ConfirmCloseReason = "cancel" | "confirm" | "escape" | "backdrop" | "closeButton";
/**
 * Named Confirm parts available for slot and style customization.
 */
export type ConfirmSlot =
  | "root"
  | "icon"
  | "subject"
  | "description"
  | "detail"
  | "confirmationInput"
  | "error"
  | "cancelButton"
  | "confirmButton";

/**
 * Resolved Confirm state exposed to theme and slot overrides.
 */
export interface ConfirmOwnerState {
  readonly open: boolean;
  readonly tone: ConfirmTone;
  readonly pending: boolean;
  readonly confirmationRequired: boolean;
  readonly confirmationMatches: boolean;
}

/**
 * Per-slot attributes and state-dependent override callbacks for Confirm.
 */
export interface ConfirmSlotProps {
  readonly root?: MiaixzSlotProps<ConfirmOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly icon?: MiaixzSlotProps<ConfirmOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly subject?: MiaixzSlotProps<ConfirmOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly description?: MiaixzSlotProps<ConfirmOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly detail?: MiaixzSlotProps<ConfirmOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly confirmationInput?: MiaixzSlotProps<ConfirmOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly error?: MiaixzSlotProps<ConfirmOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly cancelButton?: MiaixzSlotProps<ConfirmOwnerState, Omit<ButtonProps, "children">>;
  readonly confirmButton?: MiaixzSlotProps<ConfirmOwnerState, Omit<ButtonProps, "children">>;
}

/**
 * Properties accepted by the Confirm renderer.
 */
export interface ConfirmProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean, reason: ConfirmCloseReason) => void;
  readonly title: ReactNode;
  readonly subject?: ReactNode;
  readonly description?: ReactNode;
  readonly detail?: ReactNode;
  readonly children?: ReactNode;
  readonly icon?: ReactNode;
  readonly confirmLabel: ReactNode;
  readonly cancelLabel: ReactNode;
  readonly tone?: ConfirmTone;
  readonly confirmationText?: string;
  readonly confirmationLabel?: ReactNode;
  readonly confirmationHelperText?: ReactNode;
  readonly pending?: boolean;
  readonly error?: ReactNode;
  readonly errorFormatter?: (error: unknown) => ReactNode;
  readonly onError?: (error: unknown) => void;
  readonly onConfirm: () => void | Promise<void>;
  readonly showClose?: boolean;
  readonly closeOnEscape?: boolean;
  readonly closeOnBackdrop?: boolean;
  readonly slotProps?: ConfirmSlotProps;
}

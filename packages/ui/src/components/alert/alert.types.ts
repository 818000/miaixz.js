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
 * Defines the alert public type contracts.
 */

import type { HTMLAttributes, ReactNode, RefAttributes } from "react";
import type { MiaixzFeedbackLive } from "../feedback/feedback.types.js";
import type { MiaixzSlotProps } from "../../shared/slots.js";
import type { MiaixzFeedbackTone } from "../shared.types.js";

/**
 * Named Alert parts available for slot and style customization.
 */
export type AlertSlot = "root" | "icon" | "content" | "title" | "message" | "actions" | "dismiss";
/**
 * Resolved Alert state exposed to theme and slot overrides.
 */
export interface AlertOwnerState {
  readonly tone: MiaixzFeedbackTone;
  readonly live: MiaixzFeedbackLive;
  readonly dismissible: boolean;
}
/**
 * Attributes accepted by the Alert Root slot.
 */
export type AlertRootAttributes = HTMLAttributes<HTMLDivElement> &
  RefAttributes<HTMLDivElement> & { readonly "data-tone"?: MiaixzFeedbackTone };
/**
 * Per-slot attributes and state-dependent override callbacks for Alert.
 */
export interface AlertSlotProps {
  readonly root?: MiaixzSlotProps<AlertOwnerState, AlertRootAttributes>;
  readonly icon?: MiaixzSlotProps<AlertOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly content?: MiaixzSlotProps<AlertOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly title?: MiaixzSlotProps<AlertOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly message?: MiaixzSlotProps<AlertOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly actions?: MiaixzSlotProps<AlertOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly dismiss?: MiaixzSlotProps<AlertOwnerState, HTMLAttributes<HTMLSpanElement>>;
}
/**
 * Component-specific Alert properties composed with the permitted native attributes.
 */
export interface MiaixzAlertOwnProps {
  readonly tone?: MiaixzFeedbackTone;
  readonly live?: MiaixzFeedbackLive;
  readonly title?: ReactNode;
  readonly children: ReactNode;
  readonly actions?: ReactNode;
  readonly dismissLabel?: string;
  readonly onDismiss?: () => void;
  readonly slotProps?: AlertSlotProps;
}
/**
 * Properties accepted by the Alert renderer.
 */
export type AlertProps = MiaixzAlertOwnProps &
  Omit<HTMLAttributes<HTMLDivElement>, keyof MiaixzAlertOwnProps | "role" | "aria-live">;

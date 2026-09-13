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

/* eslint-disable jsdoc/require-jsdoc -- Closed feedback slots are self-describing.
 */

import type { HTMLAttributes, ReactNode, RefAttributes } from "react";
import type { MiaixzFeedbackLive } from "../feedback/feedback.types.js";
import type { MiaixzSlotProps } from "../../shared/slots.js";
import type { MiaixzFeedbackTone } from "../shared.types.js";

export type AlertSlot = "root" | "icon" | "content" | "title" | "message" | "actions" | "dismiss";
export interface AlertOwnerState {
  readonly tone: MiaixzFeedbackTone;
  readonly live: MiaixzFeedbackLive;
  readonly dismissible: boolean;
}
export type AlertRootAttributes = HTMLAttributes<HTMLDivElement> &
  RefAttributes<HTMLDivElement> & { readonly "data-tone"?: MiaixzFeedbackTone };
export interface AlertSlotProps {
  readonly root?: MiaixzSlotProps<AlertOwnerState, AlertRootAttributes>;
  readonly icon?: MiaixzSlotProps<AlertOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly content?: MiaixzSlotProps<AlertOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly title?: MiaixzSlotProps<AlertOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly message?: MiaixzSlotProps<AlertOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly actions?: MiaixzSlotProps<AlertOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly dismiss?: MiaixzSlotProps<AlertOwnerState, HTMLAttributes<HTMLSpanElement>>;
}
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
export type AlertProps = MiaixzAlertOwnProps &
  Omit<HTMLAttributes<HTMLDivElement>, keyof MiaixzAlertOwnProps | "role" | "aria-live">;

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
 * Defines the notice public type contracts.
 */

import type { HTMLAttributes, ReactNode, RefAttributes } from "react";
import type { MiaixzFeedbackLive } from "../feedback/feedback.types.js";
import type { MiaixzSlotProps } from "../../shared/slots.js";
import type { MiaixzFeedbackTone } from "../shared.types.js";

/**
 * Named Notice parts available for slot and style customization.
 */
export type NoticeSlot = "root" | "icon" | "content";
/**
 * Resolved Notice state exposed to theme and slot overrides.
 */
export interface NoticeOwnerState {
  readonly tone: MiaixzFeedbackTone;
  readonly live: MiaixzFeedbackLive;
}
/**
 * Per-slot attributes and state-dependent override callbacks for Notice.
 */
export interface NoticeSlotProps {
  readonly root?: MiaixzSlotProps<
    NoticeOwnerState,
    HTMLAttributes<HTMLDivElement> &
      RefAttributes<HTMLDivElement> & { readonly "data-tone"?: MiaixzFeedbackTone }
  >;
  readonly icon?: MiaixzSlotProps<NoticeOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly content?: MiaixzSlotProps<NoticeOwnerState, HTMLAttributes<HTMLDivElement>>;
}
/**
 * Component-specific Notice properties composed with the permitted native attributes.
 */
export interface MiaixzNoticeOwnProps {
  readonly tone?: MiaixzFeedbackTone;
  readonly live?: MiaixzFeedbackLive;
  readonly children: ReactNode;
  readonly slotProps?: NoticeSlotProps;
}
/**
 * Properties accepted by the Notice renderer.
 */
export type NoticeProps = MiaixzNoticeOwnProps &
  Omit<HTMLAttributes<HTMLDivElement>, keyof MiaixzNoticeOwnProps | "role" | "aria-live">;

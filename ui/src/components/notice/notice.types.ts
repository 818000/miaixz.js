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

export type NoticeSlot = "root" | "icon" | "content";
export interface NoticeOwnerState {
  readonly tone: MiaixzFeedbackTone;
  readonly live: MiaixzFeedbackLive;
}
export interface NoticeSlotProps {
  readonly root?: MiaixzSlotProps<
    NoticeOwnerState,
    HTMLAttributes<HTMLDivElement> &
      RefAttributes<HTMLDivElement> & { readonly "data-tone"?: MiaixzFeedbackTone }
  >;
  readonly icon?: MiaixzSlotProps<NoticeOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly content?: MiaixzSlotProps<NoticeOwnerState, HTMLAttributes<HTMLDivElement>>;
}
export interface MiaixzNoticeOwnProps {
  readonly tone?: MiaixzFeedbackTone;
  readonly live?: MiaixzFeedbackLive;
  readonly children: ReactNode;
  readonly slotProps?: NoticeSlotProps;
}
export type NoticeProps = MiaixzNoticeOwnProps &
  Omit<HTMLAttributes<HTMLDivElement>, keyof MiaixzNoticeOwnProps | "role" | "aria-live">;

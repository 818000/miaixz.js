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

/* eslint-disable jsdoc/require-jsdoc -- Closed timeline models and slots are self-describing.
 */
import type { HTMLAttributes, ReactNode, RefAttributes } from "react";
import type { MiaixzSlotProps } from "../../shared/slots.js";
import type { MiaixzFeedbackTone } from "../shared.types.js";

export interface MiaixzTimelineItem {
  readonly id: string;
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly meta?: ReactNode;
  readonly status: string;
  readonly tone: MiaixzFeedbackTone;
}
export type TimelineLayout = "track" | "list" | "rows";
export type TimelineSlot =
  "root" | "item" | "node" | "body" | "heading" | "title" | "status" | "description" | "meta";
export interface TimelineOwnerState {
  readonly layout: TimelineLayout;
  readonly itemId: string | undefined;
  readonly tone: MiaixzFeedbackTone | undefined;
}
export type TimelineRootAttributes = HTMLAttributes<HTMLOListElement> &
  RefAttributes<HTMLOListElement> & { readonly "data-layout"?: TimelineLayout };
export type TimelineItemAttributes = HTMLAttributes<HTMLLIElement> & {
  readonly "data-tone"?: MiaixzFeedbackTone;
};
export interface TimelineSlotProps {
  readonly root?: MiaixzSlotProps<TimelineOwnerState, TimelineRootAttributes>;
  readonly item?: MiaixzSlotProps<TimelineOwnerState, TimelineItemAttributes>;
  readonly node?: MiaixzSlotProps<TimelineOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly body?: MiaixzSlotProps<TimelineOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly heading?: MiaixzSlotProps<TimelineOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly title?: MiaixzSlotProps<TimelineOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly status?: MiaixzSlotProps<TimelineOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly description?: MiaixzSlotProps<TimelineOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly meta?: MiaixzSlotProps<TimelineOwnerState, HTMLAttributes<HTMLDivElement>>;
}
export interface MiaixzTimelineOwnProps {
  readonly "aria-label": string;
  readonly items: readonly MiaixzTimelineItem[];
  readonly layout?: TimelineLayout;
  readonly renderItem?: (item: MiaixzTimelineItem, defaultBody: ReactNode) => ReactNode;
  readonly slotProps?: TimelineSlotProps;
}
/*
 * Configures an ordered timeline from one item source. @public
 */
export type TimelineProps = MiaixzTimelineOwnProps &
  Omit<HTMLAttributes<HTMLOListElement>, keyof MiaixzTimelineOwnProps | "children">;

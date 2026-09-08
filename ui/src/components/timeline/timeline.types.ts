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

import type { ReactNode } from "react";

import type { MiaixzFeedbackTone } from "../shared.types.js";

/**
 * Defines one ordered event in a Timeline. @public
 */
export interface MiaixzTimelineItem {
  /**
   * Uniquely identifies the event.
   */
  readonly id: string;
  /**
   * Supplies the event heading.
   */
  readonly title: ReactNode;
  /**
   * Displays supporting event detail.
   */
  readonly description?: ReactNode;
  /**
   * Displays secondary event metadata.
   */
  readonly meta?: ReactNode;
  /**
   * Provides readable event status text.
   */
  readonly status: string;
  /**
   * Selects the semantic event tone.
   */
  readonly tone: MiaixzFeedbackTone;
}

/**
 * Configures an ordered Timeline. @public
 */
export interface TimelineDefaultProps {
  /**
   * Keeps the tracked-event presentation used by item data.
   */
  readonly variant?: "default";
  /**
   * Provides the ordered list's accessible name.
   */
  readonly "aria-label": string;
  /**
   * Supplies events in display order.
   */
  readonly items: readonly MiaixzTimelineItem[];
}

/**
 * Configures a plain chronological list whose content and column widths belong to the consumer.
 *
 * @public
 */
export interface TimelineListProps {
  /**
   * Selects the spaced list or compact row presentation.
   */
  readonly variant: "list" | "rows";
  /**
   * Provides the ordered list's accessible name.
   */
  readonly "aria-label": string;
  /**
   * Supplies consumer-owned semantic list items.
   */
  readonly children: ReactNode;
  /**
   * Appends a consumer class name without replacing the recipe class.
   */
  readonly className?: string;
}

/**
 * Selects default tracked events or a plain list composition.
 *
 * @public
 */
export type TimelineProps = TimelineDefaultProps | TimelineListProps;

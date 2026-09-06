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
export interface TimelineProps {
  /**
   * Provides the ordered list's accessible name.
   */
  readonly "aria-label": string;
  /**
   * Supplies events in display order.
   */
  readonly items: readonly MiaixzTimelineItem[];
}

import type { HTMLAttributes, ReactNode } from "react";

import type { MiaixzFeedbackTone } from "../shared.types.js";

/**
 * Defines properties owned by the Miaixz Notice contract.
 *
 * @public
 */
export interface MiaixzNoticeOwnProps {
  /**
   * Selects the semantic feedback tone.
   *
   * @defaultValue `"neutral"`
   */
  readonly tone?: MiaixzFeedbackTone;

  /**
   * Supplies the required compact message content.
   */
  readonly children: ReactNode;
}

/**
 * Configures a compact semantic feedback message.
 *
 * @public
 */
export interface NoticeProps
  extends Omit<HTMLAttributes<HTMLDivElement>, keyof MiaixzNoticeOwnProps>, MiaixzNoticeOwnProps {}

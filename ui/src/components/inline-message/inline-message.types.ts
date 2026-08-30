import type { HTMLAttributes, ReactNode } from "react";

import type { MiaixzFeedbackTone } from "../shared.types.js";

/**
 * Defines properties owned by the Miaixz InlineMessage contract.
 *
 * @public
 */
export interface MiaixzInlineMessageOwnProps {
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
export interface InlineMessageProps
  extends
    Omit<HTMLAttributes<HTMLDivElement>, keyof MiaixzInlineMessageOwnProps>,
    MiaixzInlineMessageOwnProps {}

import type { HTMLAttributes } from "react";

import type { MiaixzFeedbackTone } from "../shared.types.js";

/**
 * Defines properties owned by the Miaixz StatusIndicator contract.
 *
 * @public
 */
export interface MiaixzStatusIndicatorOwnProps {
  /**
   * Selects the required semantic status tone.
   */
  readonly tone: MiaixzFeedbackTone;

  /**
   * Supplies the required visible and accessible status label.
   */
  readonly label: string;
}

/**
 * Configures a status marker that never relies on color alone.
 *
 * @public
 */
export interface StatusIndicatorProps
  extends
    Omit<HTMLAttributes<HTMLSpanElement>, keyof MiaixzStatusIndicatorOwnProps>,
    MiaixzStatusIndicatorOwnProps {}

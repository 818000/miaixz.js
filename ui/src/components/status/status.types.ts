import type { HTMLAttributes } from "react";

import type { MiaixzFeedbackTone } from "../shared.types.js";

/**
 * Defines properties owned by the Miaixz Status contract.
 *
 * @public
 */
export interface MiaixzStatusOwnProps {
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
export interface StatusProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, keyof MiaixzStatusOwnProps>, MiaixzStatusOwnProps {}

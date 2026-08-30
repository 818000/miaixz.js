import type { HTMLAttributes, ReactNode } from "react";

import type { MiaixzFeedbackTone } from "../shared.types.js";

/**
 * Defines properties owned by the Miaixz Alert contract.
 *
 * @public
 */
export interface MiaixzAlertOwnProps {
  /**
   * Selects the semantic feedback tone.
   *
   * @defaultValue `"neutral"`
   */
  readonly tone?: MiaixzFeedbackTone;

  /**
   * Displays an optional alert heading.
   */
  readonly title?: ReactNode;

  /**
   * Supplies the required alert message content.
   */
  readonly children: ReactNode;

  /**
   * Displays optional actions below the message.
   */
  readonly actions?: ReactNode;

  /**
   * Overrides the localized accessible dismissal label.
   */
  readonly dismissLabel?: string;

  /**
   * Enables dismissal and receives the dismissal request.
   */
  readonly onDismiss?: () => void;
}

/**
 * Configures a prominent semantic feedback message.
 *
 * @public
 */
export interface AlertProps
  extends Omit<HTMLAttributes<HTMLDivElement>, keyof MiaixzAlertOwnProps>, MiaixzAlertOwnProps {}

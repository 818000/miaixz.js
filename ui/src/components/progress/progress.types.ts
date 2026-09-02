import type { HTMLAttributes } from "react";

import type { MiaixzVisualTone } from "../shared.types.js";

/**
 * Defines properties owned by the Miaixz Progress contract.
 *
 * @public
 */
export interface MiaixzProgressOwnProps {
  /** Selects the default or thin track geometry. */
  readonly size?: "default" | "thin";
  /**
   * Supplies the current value, or leaves progress indeterminate when omitted.
   */
  readonly value?: number;

  /**
   * Supplies the finite positive maximum value.
   *
   * @defaultValue `100`
   */
  readonly max?: number;

  /**
   * Supplies the required localized accessible progress label.
   */
  readonly label: string;

  /**
   * Displays the rounded percentage for determinate progress.
   *
   * @defaultValue `false`
   */
  readonly showValue?: boolean;

  /**
   * Selects a theme-resolved semantic or categorical visual tone.
   *
   * @defaultValue `"brand"`
   */
  readonly tone?: MiaixzVisualTone;
}

/**
 * Configures determinate or indeterminate progress feedback.
 *
 * @public
 */
export interface ProgressProps
  extends
    Omit<HTMLAttributes<HTMLDivElement>, keyof MiaixzProgressOwnProps | "color">,
    MiaixzProgressOwnProps {}

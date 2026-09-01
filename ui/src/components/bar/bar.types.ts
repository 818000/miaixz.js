import type { HTMLAttributes } from "react";

/**
 * Defines properties owned by the Miaixz loading bar contract. @public
 */
export interface MiaixzBarOwnProps {
  /**
   * Controls whether the bar is visible.
   */
  readonly active: boolean;
  /**
   * Plays the completion transition before hiding.
   */
  readonly complete?: boolean;
  /**
   * Uses the continuous indeterminate animation.
   */
  readonly indeterminate?: boolean;
  /**
   * Sets determinate completion from zero to one.
   */
  readonly progress?: number;
}

/**
 * Configures fixed page and navigation loading progress. @public
 */
export interface BarProps
  extends Omit<HTMLAttributes<HTMLDivElement>, keyof MiaixzBarOwnProps>, MiaixzBarOwnProps {}

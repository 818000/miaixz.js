import type { HTMLAttributes, ReactNode } from "react";

/**
 * Defines the semantic color treatment of a badge.
 *
 * @public
 */
export type BadgeTone = "neutral" | "brand" | "success" | "warning" | "danger" | "info";

/**
 * Configures a compact semantic badge.
 *
 * @public
 */
export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /**
   * Selects the semantic color treatment.
   *
   * @defaultValue `"neutral"`
   */
  tone?: BadgeTone;
  /**
   * Uses an outlined rather than filled presentation.
   *
   * @defaultValue `false`
   */
  outline?: boolean;
  /**
   * Displays a leading status dot.
   *
   * @defaultValue `false`
   */
  dot?: boolean;
  /**
   * Displays optional leading icon content.
   */
  icon?: ReactNode;
}

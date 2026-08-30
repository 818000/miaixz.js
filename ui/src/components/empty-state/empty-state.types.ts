import type { HTMLAttributes, ReactNode } from "react";

/**
 * Configures an empty, missing, or filtered state.
 *
 * @public
 */
export interface EmptyStateProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  /**
   * Supplies the empty-state heading.
   */
  title: ReactNode;
  /**
   * Supplies supporting explanatory content.
   */
  description?: ReactNode;
  /**
   * Displays optional illustrative icon content.
   */
  icon?: ReactNode;
  /**
   * Displays optional recovery or creation actions.
   */
  actions?: ReactNode;
  /**
   * Reduces the component spacing for constrained regions.
   *
   * @defaultValue `false`
   */
  compact?: boolean;
  /**
   * Selects the semantic heading level.
   *
   * @defaultValue `3`
   */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
}

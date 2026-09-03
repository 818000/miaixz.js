import type { HTMLAttributes, ReactNode } from "react";

/**
 * Configures a page title and action region. @public
 */
export interface HeaderProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  /** Selects the compact, vertically centered title composition. */
  variant?: "default" | "compact";
  /** Lets a parent layout own spacing after a composed header. */
  spacing?: "default" | "none";
  /**
   * Supplies the page heading.
   */
  title: ReactNode;
  /**
   * Displays short context above the heading.
   */
  eyebrow?: ReactNode;
  /**
   * Displays supporting text below the heading.
   */
  description?: ReactNode;
  /**
   * Displays page-level actions.
   */
  actions?: ReactNode;
  /**
   * Selects the semantic heading level.
   */
  headingLevel?: 1 | 2 | 3;
}

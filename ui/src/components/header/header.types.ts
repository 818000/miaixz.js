import type { HTMLAttributes, ReactNode } from "react";

/**
 * Configures a page title and action region. @public
 */
export interface HeaderProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
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

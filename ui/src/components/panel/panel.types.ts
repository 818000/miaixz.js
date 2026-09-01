import type { HTMLAttributes, ReactNode } from "react";

/**
 * Configures a framed content surface.
 *
 * @public
 */
export interface PanelProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  /**
   * Supplies consistently spaced panel sections.
   */
  sections?: readonly ReactNode[];
  /**
   * Supplies the optional panel heading.
   */
  title?: ReactNode;
  /**
   * Supplies supporting panel description content.
   */
  description?: ReactNode;
  /**
   * Displays panel-level actions.
   */
  actions?: ReactNode;
  /**
   * Supplies the panel footer content.
   */
  footer?: ReactNode;
  /**
   * Applies the elevated surface shadow.
   *
   * @defaultValue `false`
   */
  raised?: boolean;
  /**
   * Applies the selected surface treatment.
   *
   * @defaultValue `false`
   */
  selected?: boolean;
  /**
   * Enables interactive hover treatment.
   *
   * @defaultValue `false`
   */
  interactive?: boolean;
  /**
   * Removes inline padding from panel regions.
   *
   * @defaultValue `false`
   */
  flush?: boolean;
  /**
   * Selects the semantic heading level.
   *
   * @defaultValue `3`
   */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
}

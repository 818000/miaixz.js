import type { HTMLAttributes, ReactNode } from "react";

/**
 * Configures a framed content surface.
 *
 * @public
 */
export interface PanelProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  /**
   * Selects whether the body grows to fill the panel.
   */
  bodyLayout?: "content" | "fill";
  /**
   * Selects the body spacing preset.
   */
  bodyGap?: "default" | "none";
  /**
   * Selects the dashboard body height preset.
   */
  bodySize?: "default" | "medium" | "tall";
  /**
   * Selects the panel header height preset.
   */
  headerSize?: "default" | "compact";
  /**
   * Enables narrow-screen horizontal body scrolling.
   */
  responsiveBodyScroll?: boolean;
  /**
   * Selects a reusable panel composition.
   */
  variant?: "dashboard" | "default";
  /**
   * Selects the filled panel surface or a transparent background.
   *
   * @defaultValue `"default"`
   */
  surface?: "default" | "transparent";
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

import type { HTMLAttributes } from "react";

/**
 * Configures an accessible group of related controls.
 *
 * @public
 */
export interface ToolbarProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Provides the required accessible toolbar label.
   */
  label: string;
  /**
   * Selects the control flow direction and keyboard metadata.
   *
   * @defaultValue `"horizontal"`
   */
  orientation?: "horizontal" | "vertical";
}

/**
 * Configures a labeled subgroup within a toolbar.
 *
 * @public
 */
export interface ToolbarGroupProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Provides an accessible group label when needed.
   */
  label?: string;
}

/**
 * Configures a flexible spacer between toolbar groups.
 *
 * @public
 */
export interface ToolbarSpacerProps extends HTMLAttributes<HTMLSpanElement> {}

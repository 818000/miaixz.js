import type { HTMLAttributes, ReactNode } from "react";

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
  /**
   * Supplies leading filters, search, or contextual content.
   */
  leading?: ReactNode;
  /**
   * Supplies trailing toolbar actions.
   */
  actions?: ReactNode;
  /**
   * Keeps the toolbar visible within its scrolling container.
   */
  sticky?: boolean;
}

import type { HTMLAttributes, ReactNode } from "react";

/**
 * Defines the supported tab-list flow directions. @public
 */
export type TabsOrientation = "horizontal" | "vertical";

/**
 * Defines one tab and its associated panel. @public
 */
export interface TabsEntry {
  /**
   * Uniquely identifies the tab.
   */
  value: string;
  /**
   * Supplies the visible tab label.
   */
  label: ReactNode;
  /**
   * Supplies the associated panel content.
   */
  content: ReactNode;
  /**
   * Displays optional metadata beside the label.
   */
  count?: ReactNode;
  /**
   * Prevents selection of this tab.
   */
  disabled?: boolean;
  /**
   * Adds the associated panel to the sequential keyboard focus order.
   */
  panelTabIndex?: 0 | -1;
}

/**
 * Configures a declarative controlled or uncontrolled tabs collection. @public
 */
export interface TabsProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /**
   * Supplies tabs and their panel content.
   */
  items: readonly TabsEntry[];
  /**
   * Provides the tab list's accessible name.
   */
  label: string;
  /**
   * Controls the selected tab.
   */
  value?: string;
  /**
   * Selects the initial uncontrolled tab.
   */
  defaultValue?: string;
  /**
   * Runs when the selected tab changes.
   */
  onValueChange?: (value: string) => void;
  /**
   * Selects horizontal or vertical keyboard navigation.
   */
  orientation?: TabsOrientation;
}

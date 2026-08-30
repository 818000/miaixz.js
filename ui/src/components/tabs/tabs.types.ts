import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

/**
 * Defines the supported tab-list flow directions.
 *
 * @public
 */
export type TabsOrientation = "horizontal" | "vertical";

/**
 * Configures controlled or uncontrolled tab selection.
 *
 * @public
 */
export interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Controls the selected tab value.
   */
  value?: string;
  /**
   * Sets the initial uncontrolled tab value.
   */
  defaultValue?: string;
  /**
   * Receives requested tab selection changes.
   */
  onValueChange?: (value: string) => void;
  /**
   * Selects the tab-list flow direction and keyboard axis.
   *
   * @defaultValue `"horizontal"`
   */
  orientation?: TabsOrientation;
}

/**
 * Configures an accessible tab-list container.
 *
 * @public
 */
export interface TabListProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Provides the required accessible tab-list label.
   */
  label: string;
}

/**
 * Configures one selectable tab.
 *
 * @public
 */
export interface TabProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "value"> {
  /**
   * Identifies the tab and its associated panel.
   */
  value: string;
  /**
   * Displays optional compact count or status content.
   */
  count?: ReactNode;
}

/**
 * Configures content associated with one tab value.
 *
 * @public
 */
export interface TabPanelProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Identifies the tab that controls this panel.
   */
  value: string;
}

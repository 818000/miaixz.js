import type { ReactNode } from "react";

/**
 * Defines one route-level navigation item rendered by ModuleFrame. @public
 */
export interface MiaixzModuleFrameNavigationItem {
  /**
   * Uniquely identifies the route-level item.
   */
  readonly id: string;
  /**
   * Supplies the visible route-level label.
   */
  readonly label: ReactNode;
  /**
   * Prevents route selection.
   */
  readonly disabled?: boolean;
}

/**
 * Defines the controlled navigation rendered by ModuleFrame. @public
 */
export interface MiaixzModuleFrameNavigation {
  /**
   * Provides the navigation's accessible name.
   */
  readonly label: string;
  /**
   * Supplies the available route-level items.
   */
  readonly items: readonly MiaixzModuleFrameNavigationItem[];
  /**
   * Controls the selected route-level item.
   */
  readonly value: string;
  /**
   * Runs when a route-level item is selected.
   */
  readonly onValueChange: (value: string) => void;
}

/**
 * Configures the shared route-level page frame. @public
 */
export interface ModuleFrameProps {
  /**
   * Provides the frame's accessible name.
   */
  readonly "aria-label": string;
  /**
   * Supplies the page heading.
   */
  readonly title: ReactNode;
  /**
   * Displays supporting text below the heading.
   */
  readonly description?: ReactNode;
  /**
   * Displays page-level actions.
   */
  readonly actions?: ReactNode;
  /**
   * Selects the semantic heading level.
   */
  readonly headingLevel?: 1 | 2 | 3;
  /**
   * Supplies optional controlled route-level navigation.
   */
  readonly navigation?: MiaixzModuleFrameNavigation;
  /**
   * Marks the frame and its navigation unavailable.
   */
  readonly disabled?: boolean;
  /**
   * Supplies page content.
   */
  readonly children: ReactNode;
}

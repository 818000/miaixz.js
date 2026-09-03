import type { HTMLAttributes, ReactNode } from "react";

/**
 * Identifies the styleable regions of an application navigation rail.
 *
 * @public
 */
export type NavigationRailSlot = "root" | "header" | "toggle" | "brand" | "body" | "utility";

/**
 * Supplies classes for individual navigation rail regions.
 *
 * @public
 */
export type NavigationRailClassNames = Partial<Readonly<Record<NavigationRailSlot, string>>>;

/**
 * Selects the visual treatment of an application navigation rail.
 *
 * @public
 */
export type NavigationRailVariant = "default" | "brand";

/**
 * Configures a single-level application navigation rail.
 *
 * @public
 */
export interface NavigationRailProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Adds classes to the rail regions without depending on internal selectors.
   */
  readonly classNames?: NavigationRailClassNames;
  /**
   * Supplies the brand destination revealed beside the toggle when expanded.
   */
  readonly brand: ReactNode;
  /**
   * Supplies the control that expands or collapses the rail.
   */
  readonly toggle: ReactNode;
  /**
   * Supplies the direct, single-level navigation content.
   */
  readonly navigation: ReactNode;
  /**
   * Reveals the brand and navigation labels without adding another menu level.
   *
   * @defaultValue `false`
   */
  readonly expanded?: boolean;
  /**
   * Selects the rail's visual treatment.
   *
   * @defaultValue `"default"`
   */
  readonly variant?: NavigationRailVariant;
  /**
   * Supplies optional account or utility actions at the bottom of the rail.
   * The utility stays in the compact icon column when the rail expands.
   */
  readonly utility?: ReactNode;
}

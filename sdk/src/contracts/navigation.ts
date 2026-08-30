/**
 * Describes a navigation item contributed by a remotely loaded Miaixz module.
 *
 * @public
 */
export interface MiaixzModuleNavigationItem {
  /**
   * Module-local navigation item identifier.
   */
  readonly id: string;

  /**
   * Identifier of a route declared by the same manifest.
   */
  readonly routeId: string;

  /**
   * Internationalization key used for the navigation label.
   */
  readonly labelKey: string;

  /**
   * Optional UI icon name interpreted by the host application.
   */
  readonly icon?: string;

  /**
   * Numeric position used before the identifier tie-breaker.
   */
  readonly order: number;
}

/**
 * Compares navigation items using the frozen order and identifier sort rules.
 *
 * @param first - First navigation item to compare.
 * @param second - Second navigation item to compare.
 * @returns Negative, zero, or positive sort result.
 */
export function compareMiaixzModuleNavigation(
  first: MiaixzModuleNavigationItem,
  second: MiaixzModuleNavigationItem,
): number {
  return first.order - second.order || first.id.localeCompare(second.id);
}

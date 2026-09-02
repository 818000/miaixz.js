import { forwardRef } from "react";

import { classNames } from "../../internal/class-names.js";
import type { NavigationRailProps } from "./navigation-rail.types.js";

/**
 * Composes a single-level application rail that can reveal its labels in place.
 *
 * @public
 */
export const NavigationRail = forwardRef<HTMLDivElement, NavigationRailProps>(
  function NavigationRail(
    {
      brand,
      toggle,
      navigation,
      utility,
      expanded = false,
      className,
      classNames: slotClassNames = {},
      ...props
    },
    ref,
  ) {
    return (
      <div
        {...props}
        ref={ref}
        data-expanded={expanded || undefined}
        className={classNames("miaixz-navigation-rail-frame", className, slotClassNames.root)}
      >
        <div className={classNames("miaixz-navigation-rail-header", slotClassNames.header)}>
          <div className={classNames("miaixz-navigation-rail-toggle", slotClassNames.toggle)}>
            {toggle}
          </div>
          {expanded && (
            <div className={classNames("miaixz-navigation-rail-brand", slotClassNames.brand)}>
              {brand}
            </div>
          )}
        </div>
        <div className={classNames("miaixz-navigation-rail-body", slotClassNames.body)}>
          {navigation}
        </div>
        {utility !== undefined && utility !== null && (
          <div className={classNames("miaixz-navigation-rail-utility", slotClassNames.utility)}>
            {utility}
          </div>
        )}
      </div>
    );
  },
);

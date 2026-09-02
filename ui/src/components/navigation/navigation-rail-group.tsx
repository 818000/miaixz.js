import { forwardRef } from "react";

import { classNames } from "../../internal/class-names.js";
import type { NavigationRailGroupProps } from "./navigation-rail-group.types.js";

/**
 * Groups direct rail destinations and morphs its compact divider into a label when expanded.
 *
 * @public
 */
export const NavigationRailGroup = forwardRef<HTMLElement, NavigationRailGroupProps>(
  function NavigationRailGroup({ label, separated = false, className, children, ...props }, ref) {
    return (
      <section
        {...props}
        ref={ref}
        data-separated={separated || undefined}
        className={classNames("miaixz-navigation-rail-group", className)}
      >
        {separated && (
          <div aria-hidden="true" className="miaixz-navigation-rail-group-marker">
            <span className="miaixz-navigation-rail-group-marker-line" />
            <span className="miaixz-navigation-rail-group-marker-label">{label}</span>
          </div>
        )}
        {children}
      </section>
    );
  },
);

import { forwardRef } from "react";

import { classNames } from "../../internal/class-names.js";
import type { ShellProps } from "./shell.types.js";

/**
 * Provides the root grid for product navigation, header, and main content. @public
 */
export const Shell = forwardRef<HTMLDivElement, ShellProps>(function Shell(
  {
    header,
    sidebar,
    headerBehavior = "fixed",
    navigationVariant,
    navigationExpanded = false,
    mobileNavigation,
    headerClassName,
    sidebarClassName,
    mainClassName,
    mobileNavigationClassName,
    className,
    children,
    ...props
  },
  ref,
) {
  return (
    <div
      {...props}
      ref={ref}
      data-header-behavior={headerBehavior}
      data-navigation-variant={navigationVariant}
      data-navigation-expanded={navigationExpanded || undefined}
      className={classNames("miaixz-shell", className)}
    >
      <header className={classNames("miaixz-shell-header", headerClassName)}>{header}</header>
      <aside className={classNames("miaixz-shell-sidebar", sidebarClassName)}>{sidebar}</aside>
      <main className={classNames("miaixz-shell-main", mainClassName)}>{children}</main>
      {mobileNavigation !== undefined && mobileNavigation !== null && (
        <div className={classNames("miaixz-shell-mobile-navigation", mobileNavigationClassName)}>
          {mobileNavigation}
        </div>
      )}
    </div>
  );
});

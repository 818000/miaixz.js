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
    headerClassName,
    sidebarClassName,
    mainClassName,
    className,
    children,
    ...props
  },
  ref,
) {
  return (
    <div {...props} ref={ref} className={classNames("miaixz-shell", className)}>
      <header className={classNames("miaixz-shell-header", headerClassName)}>{header}</header>
      <aside className={classNames("miaixz-shell-sidebar", sidebarClassName)}>{sidebar}</aside>
      <main className={classNames("miaixz-shell-main", mainClassName)}>{children}</main>
    </div>
  );
});

import { forwardRef } from "react";

import { useMiaixzLocale } from "../../i18n/index.js";
import { classNames } from "../../internal/class-names.js";
import type { SidebarProps } from "./sidebar.types.js";

/**
 * Creates a localized sidebar and content layout. @public
 */
export const Sidebar = forwardRef<HTMLDivElement, SidebarProps>(function Sidebar(
  { sidebar, sidebarLabel, stickySidebar = true, contentClassName, className, children, ...props },
  ref,
) {
  const { t } = useMiaixzLocale();
  return (
    <div {...props} ref={ref} className={classNames("miaixz-sidebar", className)}>
      <aside
        aria-label={sidebarLabel ?? t("ui.sectionNavigation.label")}
        className={classNames("miaixz-sidebar-aside", stickySidebar && "miaixz-sticky")}
      >
        {sidebar}
      </aside>
      <div className={classNames("miaixz-sidebar-main", contentClassName)}>{children}</div>
    </div>
  );
});

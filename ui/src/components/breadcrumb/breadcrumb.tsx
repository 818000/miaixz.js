import { forwardRef } from "react";

import { classNames } from "../../internal/class-names.js";
import { useMiaixzLocale } from "../../i18n/index.js";
import type { BreadcrumbItemProps, BreadcrumbProps } from "./breadcrumb.types.js";

/**
 * Renders localized hierarchical navigation with semantic list markup.
 *
 * @public
 */
export const Breadcrumb = forwardRef<HTMLElement, BreadcrumbProps>(function Breadcrumb(
  { label, className, children, ...props },
  ref,
) {
  const { t } = useMiaixzLocale();
  return (
    <nav
      {...props}
      ref={ref}
      aria-label={label ?? t("ui.breadcrumb.label")}
      className={classNames("miaixz-breadcrumb", className)}
    >
      <ol className="miaixz-breadcrumb-list">{children}</ol>
    </nav>
  );
});

/**
 * Renders one breadcrumb link and its optional separator.
 *
 * @public
 */
export const BreadcrumbItem = forwardRef<HTMLAnchorElement, BreadcrumbItemProps>(
  function BreadcrumbItem({ current = false, icon, className, children, href, ...props }, ref) {
    return (
      <li className="miaixz-breadcrumb-item">
        {current ? (
          <span aria-current="page" className={classNames("miaixz-breadcrumb-current", className)}>
            {icon !== undefined && <span className="miaixz-breadcrumb-icon">{icon}</span>}
            <span className="miaixz-breadcrumb-label">{children}</span>
          </span>
        ) : (
          <a
            {...props}
            ref={ref}
            href={href}
            className={classNames("miaixz-breadcrumb-link", className)}
          >
            {icon !== undefined && <span className="miaixz-breadcrumb-icon">{icon}</span>}
            <span className="miaixz-breadcrumb-label">{children}</span>
          </a>
        )}
      </li>
    );
  },
);

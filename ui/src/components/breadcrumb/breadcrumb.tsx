import { forwardRef } from "react";

import { classNames } from "../../internal/class-names.js";
import { useMiaixzLocale } from "../../i18n/index.js";
import type { BreadcrumbEntry, BreadcrumbProps } from "./breadcrumb.types.js";

/**
 * Renders localized hierarchical navigation with semantic list markup.
 *
 * @public
 */
export const Breadcrumb = forwardRef<HTMLElement, BreadcrumbProps>(function Breadcrumb(
  { label, items, className, children, ...props },
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
      <ol className="miaixz-breadcrumb-list">
        {items?.map((item, index) => (
          <BreadcrumbEntryView key={`${item.href ?? "current"}-${index}`} {...item} />
        )) ?? children}
      </ol>
    </nav>
  );
});

/**
 * Renders one breadcrumb link and its optional separator.
 *
 * @param entry - Declarative breadcrumb entry.
 * @returns The rendered breadcrumb row.
 * @internal
 */
function BreadcrumbEntryView(entry: BreadcrumbEntry) {
  const { current = false, icon, label, className, href, ...props } = entry;
  return (
    <li className="miaixz-breadcrumb-item">
      {current ? (
        <span aria-current="page" className={classNames("miaixz-breadcrumb-current", className)}>
          {icon !== undefined && <span className="miaixz-breadcrumb-icon">{icon}</span>}
          <span className="miaixz-breadcrumb-label">{label}</span>
        </span>
      ) : (
        <a {...props} href={href} className={classNames("miaixz-breadcrumb-link", className)}>
          {icon !== undefined && <span className="miaixz-breadcrumb-icon">{icon}</span>}
          <span className="miaixz-breadcrumb-label">{label}</span>
        </a>
      )}
    </li>
  );
}

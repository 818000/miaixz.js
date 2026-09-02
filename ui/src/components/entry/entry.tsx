import { forwardRef } from "react";

import { classNames } from "../../internal/class-names.js";
import type { EntryProps } from "./entry.types.js";

/**
 * Renders a full-viewport entry layout without product-specific content.
 *
 * @public
 */
export const Entry = forwardRef<HTMLDivElement, EntryProps>(function Entry(
  { variant, aside, className, children, ...props },
  ref,
) {
  const hasAside = aside !== undefined && aside !== null && aside !== false;

  return (
    <div
      {...props}
      ref={ref}
      data-variant={variant}
      data-has-aside={hasAside || undefined}
      className={classNames("miaixz-entry", className)}
    >
      {hasAside && (
        <aside className="miaixz-entry-aside">
          <div className="miaixz-entry-aside-content">{aside}</div>
        </aside>
      )}
      <main className="miaixz-entry-main">{children}</main>
    </div>
  );
});

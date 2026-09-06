import { forwardRef, useId } from "react";

import { classNames } from "../../internal/class-names.js";
import type { GroupedListProps } from "./grouped-list.types.js";

/**
 * Displays multiple labeled read-only collections without nested card or table surfaces. @public
 */
export const GroupedList = forwardRef<HTMLDivElement, GroupedListProps>(function GroupedList(
  { groups, headingLevel = 3, layout = "rows", className, ...props },
  ref,
) {
  const baseId = `miaixz-grouped-list-${useId()}`;
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4" | "h5" | "h6";

  return (
    <div
      {...props}
      ref={ref}
      className={classNames("miaixz-grouped-list", `miaixz-grouped-list--${layout}`, className)}
    >
      <div className="miaixz-grouped-list-grid">
        {groups.map((group) => {
          const headingId = `${baseId}-${group.id}`;
          return (
            <section
              key={group.id}
              aria-labelledby={headingId}
              className="miaixz-grouped-list-group"
            >
              <header className="miaixz-grouped-list-header">
                <Heading id={headingId} className="miaixz-grouped-list-heading">
                  {group.label}
                </Heading>
                {group.count !== undefined && (
                  <p className="miaixz-grouped-list-count">{group.count}</p>
                )}
              </header>
              {group.items.length > 0 ? (
                <ul className="miaixz-grouped-list-items">
                  {group.items.map((item) => (
                    <li key={item.id} className="miaixz-grouped-list-item">
                      <p className="miaixz-grouped-list-title">{item.title}</p>
                      {item.description !== undefined && (
                        <p className="miaixz-grouped-list-description">{item.description}</p>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="miaixz-grouped-list-empty">{group.empty}</p>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
});

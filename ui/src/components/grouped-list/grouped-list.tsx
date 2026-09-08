/*
 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
 ~                                                                           ~
 ~ Copyright (c) 2015-2026 miaixz.org and other contributors.                ~
 ~                                                                           ~
 ~ Licensed under the Apache License, Version 2.0 (the "License");           ~
 ~ you may not use this file except in compliance with the License.          ~
 ~ You may obtain a copy of the License at                                   ~
 ~                                                                           ~
 ~      https://www.apache.org/licenses/LICENSE-2.0                          ~
 ~                                                                           ~
 ~ Unless required by applicable law or agreed to in writing, software       ~
 ~ distributed under the License is distributed on an "AS IS" BASIS,         ~
 ~ WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  ~
 ~ See the License for the specific language governing permissions and       ~
 ~ limitations under the License.                                            ~
 ~                                                                           ~
 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
*/

import { forwardRef, useId } from "react";

import { classNames } from "../../shared/class-names.js";
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

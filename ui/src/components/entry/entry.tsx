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

import { forwardRef } from "react";

import { classNames } from "../../shared/class-names.js";
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

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
import type { EmptyProps } from "./empty.types.js";

/**
 * Presents an empty, missing, or filtered state with optional icon and actions.
 *
 * @public
 */
export const Empty = forwardRef<HTMLDivElement, EmptyProps>(function Empty(
  {
    title,
    description,
    icon,
    actions,
    compact = false,
    headingLevel = 3,
    variant = "default",
    className,
    ...props
  },
  ref,
) {
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4" | "h5" | "h6";
  if (variant === "plain") {
    return (
      <div {...props} ref={ref} className={classNames("miaixz-empty-plain", className)}>
        {title}
        {description}
        {actions}
      </div>
    );
  }

  return (
    <div
      {...props}
      ref={ref}
      className={classNames("miaixz-empty", compact && "miaixz-empty-compact", className)}
    >
      <div className="miaixz-empty-content">
        {icon !== undefined && <div className="miaixz-empty-icon">{icon}</div>}
        <Heading className="miaixz-empty-title">{title}</Heading>
        {description !== undefined && <p className="miaixz-empty-description">{description}</p>}
        {actions !== undefined && <div className="miaixz-empty-actions">{actions}</div>}
      </div>
    </div>
  );
});

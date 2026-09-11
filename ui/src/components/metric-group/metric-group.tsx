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

import { Children, cloneElement, forwardRef, isValidElement, type CSSProperties } from "react";

import { classNames } from "../../shared/class-names.js";
import type { MetricProps } from "../metric/index.js";
import type { MetricGroupProps } from "./metric-group.types.js";

/**
 * Groups strip metrics inside one responsive framed surface. @public
 */
export const MetricGroup = forwardRef<HTMLDivElement, MetricGroupProps>(function MetricGroup(
  {
    children,
    variant = "default",
    className,
    columns = 4,
    responsive = "default",
    itemVariant = "strip",
    surface = "default",
    density = "default",
    spacingAfter = "none",
    ...props
  },
  ref,
) {
  if (variant === "summary") {
    return (
      <div
        {...props}
        ref={ref}
        className={classNames("miaixz-metric-group-summary", className)}
        data-columns={columns}
      >
        <ul
          className="miaixz-metric-group-summary-list"
          style={{ "--miaixz-metric-group-columns": columns } as CSSProperties}
          tabIndex={0}
        >
          {children}
        </ul>
      </div>
    );
  }
  if (variant !== "default") {
    return (
      <div
        {...props}
        ref={ref}
        className={classNames(`miaixz-metric-group-${variant}`, className)}
        data-columns={columns}
      >
        {children}
      </div>
    );
  }
  return (
    <div
      {...props}
      ref={ref}
      className={classNames(
        "miaixz-metric-group",
        responsive === "mobile" && "miaixz-metric-group-mobile",
        responsive === "none" && "miaixz-metric-group-fixed",
        surface === "transparent" && "miaixz-metric-group-transparent",
        density === "compact" && "miaixz-metric-group-compact",
        spacingAfter === "compact" && "miaixz-metric-group-spacing-compact",
        className,
      )}
      data-columns={columns}
    >
      {Children.map(children, (child) =>
        itemVariant === "strip" && isValidElement<MetricProps>(child)
          ? cloneElement(child, { variant: "strip" })
          : child,
      )}
    </div>
  );
});

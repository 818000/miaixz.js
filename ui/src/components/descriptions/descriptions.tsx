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

import { Fragment, forwardRef } from "react";

import { classNames } from "../../shared/class-names.js";
import type { DescriptionsProps } from "./types.js";

/**
 * Renders a semantic, divided list of facts with bounded column and density options.
 *
 * @public
 */
export const Descriptions = forwardRef<HTMLDListElement, DescriptionsProps>(function Descriptions(
  {
    items,
    children,
    className,
    columns = 1,
    density = "default",
    variant = "default",
    valueSize = "default",
    ...props
  },
  ref,
) {
  return (
    <dl
      {...props}
      ref={ref}
      data-columns={columns}
      data-density={density}
      className={classNames(
        "miaixz-descriptions",
        `miaixz-descriptions-${variant}`,
        density === "compact" && "miaixz-descriptions-compact",
        valueSize === "compact" && "miaixz-descriptions-value-compact",
        className,
      )}
    >
      {items === undefined
        ? children
        : items.map((item, index) =>
            variant === "matrix" ? (
              <Fragment key={item.id ?? index}>
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
              </Fragment>
            ) : (
              <div key={item.id ?? index}>
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            ),
          )}
    </dl>
  );
});

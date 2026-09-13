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

/* eslint-disable jsdoc/require-jsdoc -- Public Metrics contract lives in its type module.
 */
import { forwardRef, type CSSProperties } from "react";

import { classNames } from "../../shared/class-names.js";
import { Scroll } from "../scroll/scroll.js";
import { MetricVariantContext } from "./context.js";
import type { MetricsProps } from "./metrics.types.js";
import { withMiaixzThemeComponent } from "../../theme/themed-component.js";

/*
 * Groups metrics without cloning or modifying consumer children. @public
 */
export const Metrics = withMiaixzThemeComponent(
  "Metrics",
  forwardRef<HTMLDivElement, MetricsProps>(function Metrics(
    {
      children,
      layout = "strip",
      columns = 4,
      responsive = "default",
      surface = "filled",
      density = "standard",
      spacingAfter = "none",
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      className,
      ...props
    },
    ref,
  ) {
    const named =
      (ariaLabel !== undefined && ariaLabel.trim() !== "") ||
      (ariaLabelledBy !== undefined && ariaLabelledBy.trim() !== "");
    return (
      <div
        {...props}
        ref={ref}
        className={classNames("miaixz-metrics", className)}
        role={named ? "group" : undefined}
        aria-label={named ? ariaLabel : undefined}
        aria-labelledby={named ? ariaLabelledBy : undefined}
        data-layout={layout}
        data-columns={columns}
        data-responsive={responsive}
        data-surface={surface}
        data-density={density}
        data-spacing-after={spacingAfter}
      >
        <Scroll
          {...(named
            ? ariaLabel === undefined
              ? { focusable: "auto" as const, "aria-labelledby": ariaLabelledBy! }
              : { focusable: "auto" as const, "aria-label": ariaLabel }
            : { focusable: "never" as const })}
          className="miaixz-metrics-scroll"
          style={{ "--miaixz-metrics-columns": columns } as CSSProperties}
        >
          <MetricVariantContext.Provider value={layout === "strip" ? "strip" : "standard"}>
            {children}
          </MetricVariantContext.Provider>
        </Scroll>
      </div>
    );
  }),
);

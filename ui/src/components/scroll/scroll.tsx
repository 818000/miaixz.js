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

/* eslint-disable jsdoc/require-jsdoc --
 * Public Scroll contracts are defined by the component type module.
 */
import { forwardRef } from "react";

import { assertMiaixzAccessibleName } from "../../accessibility/assert-accessible-name.js";
import { classNames } from "../../shared/class-names.js";
import { useMergedRef } from "../../shared/use-merged-ref.js";
import type { ScrollProps } from "./scroll.types.js";
import { useOverflowFocus } from "./use-overflow-focus.js";
import { withMiaixzThemeComponent } from "../../theme/themed-component.js";

/*
 * Creates a bounded overflow region that is focusable only when configured or overflowing. @public
 */
export const Scroll = withMiaixzThemeComponent(
  "Scroll",
  forwardRef<HTMLDivElement, ScrollProps>(function Scroll(
    { focusable = "auto", className, ...props },
    forwardedRef,
  ) {
    if (focusable !== "never") {
      assertMiaixzAccessibleName({
        ...(props["aria-label"] === undefined ? {} : { ariaLabel: props["aria-label"] }),
        ...(props["aria-labelledby"] === undefined
          ? {}
          : { ariaLabelledBy: props["aria-labelledby"] }),
      });
    }
    const { elementRef, overflowing } = useOverflowFocus(focusable === "auto");
    const setRef = useMergedRef(forwardedRef, elementRef);
    const isFocusable = focusable === "always" || (focusable === "auto" && overflowing);
    return (
      <div
        {...props}
        ref={setRef}
        className={classNames("miaixz-scroll", className)}
        role={isFocusable ? "region" : undefined}
        tabIndex={isFocusable ? 0 : undefined}
      />
    );
  }),
);

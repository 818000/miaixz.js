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
 * Public Page contracts are defined by the component type module.
 */
import { createElement, forwardRef, useCallback, useLayoutEffect, useRef } from "react";

import { MiaixzUiError } from "../../errors/ui-error.js";
import { classNames } from "../../shared/class-names.js";
import type { PageProps } from "./page.types.js";
import { withMiaixzThemeComponent } from "../../theme/themed-component.js";

/*
 * Establishes page content width and spacing without implicitly creating a landmark. @public
 */
export const Page = withMiaixzThemeComponent(
  "Page",
  forwardRef<HTMLElement, PageProps>(function Page(
    { component = "div", fullWidth = false, className, ...props },
    forwardedRef,
  ) {
    const rootRef = useRef<HTMLElement | null>(null);
    const setRef = useCallback(
      (element: HTMLElement | null) => {
        rootRef.current = element;
        if (typeof forwardedRef === "function") forwardedRef(element);
        else if (forwardedRef !== null) forwardedRef.current = element;
      },
      [forwardedRef],
    );
    useLayoutEffect(() => {
      if (component !== "section") return;
      const root = rootRef.current;
      const labelledBy = props["aria-labelledby"];
      const label =
        labelledBy === undefined || labelledBy.trim() === ""
          ? null
          : root?.ownerDocument.getElementById(labelledBy);
      if (root === null || label === null || label === undefined || !root.contains(label)) {
        throw new MiaixzUiError({
          code: "UI_PAGE_LABELLED_BY_INVALID",
          details: { labelledBy },
        });
      }
    }, [component, props]);
    return createElement(component, {
      ...props,
      ref: setRef,
      className: classNames("miaixz-page", fullWidth && "miaixz-page-fullwidth", className),
    });
  }),
);

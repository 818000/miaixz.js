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

/**
 * Implements the shared tab trigger surface.
 */

import { forwardRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type Ref } from "react";
import { Anchor } from "../../shared/anchor.js";
import { classNames } from "../../shared/class-names.js";

/**
 * Attributes shared by in-page tabs, filters and route-backed tab links.
 * @public
 */
export type TabTriggerProps = {
  readonly refreshMode?: import("../../shared/anchor.js").LinkRefreshMode | undefined;
} & (
  | (ButtonHTMLAttributes<HTMLButtonElement> & { readonly href?: never })
  | (AnchorHTMLAttributes<HTMLAnchorElement> & { readonly href: string })
);

/**
 * Renders the common tab surface while preserving button and navigation-link semantics.
 * @public
 */
export const TabTrigger = forwardRef<HTMLButtonElement | HTMLAnchorElement, TabTriggerProps>(
  function TabTrigger({ refreshMode, ...props }, ref) {
    const className = classNames("miaixz-tab", props.className);
    if (props.href !== undefined) {
      return (
        <Anchor
          {...props}
          refreshMode={refreshMode}
          data-miaixz-tab-trigger="true"
          className={className}
          ref={ref as Ref<HTMLAnchorElement>}
        />
      );
    }
    return (
      <button
        {...props}
        data-miaixz-tab-trigger="true"
        className={className}
        ref={ref as Ref<HTMLButtonElement>}
        type={props.type ?? "button"}
      />
    );
  },
);

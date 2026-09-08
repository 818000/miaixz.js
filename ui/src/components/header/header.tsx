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
import type { HeaderProps } from "./header.types.js";

/**
 * Renders a page title area with description, metadata, and actions. @public
 */
export const Header = forwardRef<HTMLElement, HeaderProps>(function Header(
  {
    title,
    eyebrow,
    description,
    actions,
    headingLevel = 1,
    className,
    children,
    variant = "default",
    spacing = "default",
    ...props
  },
  ref,
) {
  const Heading = `h${headingLevel}` as "h1" | "h2" | "h3";
  return (
    <header
      {...props}
      ref={ref}
      className={classNames(
        "miaixz-header",
        variant === "compact" && "miaixz-header-compact",
        spacing === "none" && "miaixz-header-unspaced",
        className,
      )}
    >
      <div className="miaixz-header-content">
        {eyebrow !== undefined && <div className="miaixz-header-eyebrow">{eyebrow}</div>}
        <Heading className="miaixz-header-title">{title}</Heading>
        {description !== undefined && <p className="miaixz-header-description">{description}</p>}
        {children}
      </div>
      {actions !== undefined && <div className="miaixz-header-actions">{actions}</div>}
    </header>
  );
});

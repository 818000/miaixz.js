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

import { useMiaixzLocale } from "../../i18n/index.js";
import { classNames } from "../../shared/class-names.js";
import type { SidebarProps } from "./sidebar.types.js";

/**
 * Creates a localized sidebar and content layout. @public
 */
export const Sidebar = forwardRef<HTMLDivElement, SidebarProps>(function Sidebar(
  {
    sidebar,
    sidebarLabel,
    stickySidebar = true,
    collapseAt,
    size = "default",
    contentClassName,
    className,
    children,
    ...props
  },
  ref,
) {
  const { t } = useMiaixzLocale();
  return (
    <div
      {...props}
      ref={ref}
      className={classNames("miaixz-sidebar", `miaixz-sidebar-${size}`, className)}
      data-collapse-at={collapseAt}
    >
      <aside
        aria-label={sidebarLabel ?? t("ui.sectionNavigation.label")}
        className={classNames("miaixz-sidebar-aside", stickySidebar && "miaixz-sticky")}
      >
        {sidebar}
      </aside>
      <div className={classNames("miaixz-sidebar-main", contentClassName)}>{children}</div>
    </div>
  );
});

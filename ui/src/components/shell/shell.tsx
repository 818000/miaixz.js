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
import type { ShellProps } from "./shell.types.js";

/**
 * Provides the root grid for product navigation, header, and main content. @public
 */
export const Shell = forwardRef<HTMLDivElement, ShellProps>(function Shell(
  {
    header,
    sidebar,
    headerBehavior = "fixed",
    navigationVariant,
    navigationExpanded = false,
    mobileNavigationMode = "bottom",
    navigationDismissLabel,
    onNavigationDismiss,
    mobileNavigation,
    headerClassName,
    sidebarClassName,
    mainClassName,
    mainRef,
    mobileNavigationClassName,
    className,
    children,
    ...props
  },
  ref,
) {
  return (
    <div
      {...props}
      ref={ref}
      data-header-behavior={headerBehavior}
      data-navigation-variant={navigationVariant}
      data-navigation-expanded={navigationExpanded || undefined}
      data-mobile-navigation-mode={mobileNavigationMode}
      className={classNames("miaixz-shell", className)}
    >
      <header className={classNames("miaixz-shell-header", headerClassName)}>{header}</header>
      <aside className={classNames("miaixz-shell-sidebar", sidebarClassName)}>{sidebar}</aside>
      <main ref={mainRef} className={classNames("miaixz-shell-main", mainClassName)}>
        {children}
      </main>
      {mobileNavigationMode === "drawer" &&
        navigationExpanded &&
        navigationDismissLabel &&
        onNavigationDismiss && (
          <button
            aria-label={navigationDismissLabel}
            className="miaixz-shell-navigation-backdrop"
            onClick={onNavigationDismiss}
            type="button"
          />
        )}
      {mobileNavigation !== undefined && mobileNavigation !== null && (
        <div className={classNames("miaixz-shell-mobile-navigation", mobileNavigationClassName)}>
          {mobileNavigation}
        </div>
      )}
    </div>
  );
});

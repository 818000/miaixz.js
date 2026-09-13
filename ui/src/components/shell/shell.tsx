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
 * Public Shell contracts are defined by the component type module.
 */
import { forwardRef, useEffect, useState } from "react";

import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import { Drawer } from "../drawer/drawer.js";
import type { ShellOwnerState, ShellProps } from "./shell.types.js";
import { withMiaixzThemeComponent } from "../../theme/themed-component.js";

const mobileQuery = "(max-width: 1023px)";

/*
 * Provides the sole page-level main and navigation layout owner. @public
 */
export const Shell = withMiaixzThemeComponent(
  "Shell",
  forwardRef<HTMLDivElement, ShellProps>(function Shell(
    {
      header,
      sidebar,
      sidebarOverflow = "auto",
      headerBehavior = "fixed",
      desktopNavigation = { mode: "sidebar" },
      mobileNavigation = { mode: "none" },
      slotProps,
      mainRef,
      children,
      ...props
    },
    ref,
  ) {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
      if (typeof window.matchMedia !== "function") return;
      const query = window.matchMedia(mobileQuery);
      const update = () => setIsMobile(query.matches);
      update();
      query.addEventListener("change", update);
      return () => query.removeEventListener("change", update);
    }, []);
    const ownerState: ShellOwnerState = {
      desktopNavigation,
      mobileNavigation,
      headerBehavior,
      sidebarOverflow,
    };
    const expanded = desktopNavigation.mode === "rail" && desktopNavigation.expanded;
    return (
      <>
        <div
          {...mergeMiaixzSlotProps({
            ownerState,
            defaultProps: { className: "miaixz-shell" },
            componentProps: props,
            slotProps: slotProps?.root,
            forwardedRef: ref,
            internalProps: {
              "data-desktop-navigation": desktopNavigation.mode,
              ...(expanded ? { "data-navigation-expanded": true } : {}),
              "data-header-behavior": headerBehavior,
            },
            ownedProps: [
              "data-desktop-navigation",
              "data-navigation-expanded",
              "data-header-behavior",
            ],
          })}
        >
          <header
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-shell-header" },
              slotProps: slotProps?.header,
            })}
          >
            {header}
          </header>
          <aside
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-shell-sidebar" },
              slotProps: slotProps?.sidebar,
              internalProps: { "data-overflow": sidebarOverflow },
              ownedProps: ["data-overflow"],
            })}
          >
            {sidebar}
          </aside>
          <main
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-shell-main" },
              slotProps: slotProps?.main,
              internalRef: mainRef,
            })}
          >
            {children}
          </main>
          {mobileNavigation.mode === "bottom" && (
            <div
              {...mergeMiaixzSlotProps({
                ownerState,
                defaultProps: { className: "miaixz-shell-mobile-navigation" },
                slotProps: slotProps?.mobileNavigation,
              })}
            >
              {mobileNavigation.content}
            </div>
          )}
        </div>
        {mobileNavigation.mode === "drawer" && isMobile && (
          <Drawer
            closeLabel={mobileNavigation.dismissLabel}
            onOpenChange={(open) => mobileNavigation.onOpenChange(open)}
            open={mobileNavigation.open}
            placement="left"
            title={mobileNavigation.dismissLabel}
          >
            <div
              {...mergeMiaixzSlotProps({
                ownerState,
                defaultProps: { className: "miaixz-shell-mobile-navigation" },
                slotProps: slotProps?.mobileNavigation,
              })}
            >
              {sidebar}
            </div>
          </Drawer>
        )}
      </>
    );
  }),
);

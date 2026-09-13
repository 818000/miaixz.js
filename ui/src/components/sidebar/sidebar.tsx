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
 * Public Sidebar contracts are defined by the component type module.
 */
import { forwardRef } from "react";

import { useMiaixzLocale } from "../../i18n/i18n.js";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import type { SidebarOwnerState, SidebarProps } from "./sidebar.types.js";
import { withMiaixzThemeComponent } from "../../theme/themed-component.js";

/*
 * Creates a local sidebar layout without owning viewport or expanded state. @public
 */
export const Sidebar = withMiaixzThemeComponent(
  "Sidebar",
  forwardRef<HTMLDivElement, SidebarProps>(function Sidebar(
    {
      sidebar,
      sidebarLabel,
      stickySidebar = true,
      size = "default",
      footer,
      slotProps,
      children,
      ...props
    },
    ref,
  ) {
    const { t } = useMiaixzLocale();
    const ownerState: SidebarOwnerState = { size, stickySidebar };
    return (
      <div
        {...mergeMiaixzSlotProps({
          ownerState,
          defaultProps: { className: "miaixz-sidebar" },
          componentProps: props,
          slotProps: slotProps?.root,
          forwardedRef: ref,
          internalProps: { "data-size": size },
          ownedProps: ["data-size"],
        })}
      >
        <aside
          {...mergeMiaixzSlotProps({
            ownerState,
            defaultProps: { className: "miaixz-sidebar-aside" },
            slotProps: slotProps?.sidebar,
            internalProps: {
              "aria-label": sidebarLabel ?? t("ui.sectionNavigation.label"),
              ...(stickySidebar ? { "data-sticky": true } : {}),
            },
            ownedProps: ["aria-label", "data-sticky"],
          })}
        >
          {sidebar}
        </aside>
        <div
          {...mergeMiaixzSlotProps({
            ownerState,
            defaultProps: { className: "miaixz-sidebar-content" },
            slotProps: slotProps?.content,
          })}
        >
          {children}
        </div>
        {footer !== undefined && (
          <footer
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-sidebar-footer" },
              slotProps: slotProps?.footer,
            })}
          >
            {footer}
          </footer>
        )}
      </div>
    );
  }),
);

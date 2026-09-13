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
 * Public Entry contracts are defined by the component type module.
 */
import { createElement, forwardRef } from "react";

import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import type { EntryOwnerState, EntryProps } from "./entry.types.js";
import { withMiaixzThemeComponent } from "../../theme/themed-component.js";

/*
 * Renders an entry layout without implicitly creating a main landmark. @public
 */
export const Entry = withMiaixzThemeComponent(
  "Entry",
  forwardRef<HTMLDivElement, EntryProps>(function Entry(
    {
      layout = "centered",
      contentComponent = "div",
      aside,
      slotProps,
      className,
      children,
      ...props
    },
    ref,
  ) {
    const hasAside = aside !== undefined && aside !== null && aside !== false;
    const ownerState: EntryOwnerState = { layout, contentComponent, hasAside };
    return (
      <div
        {...mergeMiaixzSlotProps({
          ownerState,
          defaultProps: { className: "miaixz-entry" },
          componentProps: { ...props, className },
          slotProps: slotProps?.root,
          forwardedRef: ref,
          internalProps: {
            ...(hasAside ? { "data-has-aside": true } : {}),
            "data-layout": layout,
          },
        })}
      >
        {hasAside && (
          <aside
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-entry-aside" },
              slotProps: slotProps?.aside,
            })}
          >
            <div
              {...mergeMiaixzSlotProps({
                ownerState,
                defaultProps: { className: "miaixz-entry-aside-content" },
                slotProps: slotProps?.asideContent,
              })}
            >
              {aside}
            </div>
          </aside>
        )}
        {createElement(
          contentComponent,
          mergeMiaixzSlotProps({
            ownerState,
            defaultProps: { className: "miaixz-entry-content" },
            slotProps: slotProps?.content,
          }),
          children,
        )}
      </div>
    );
  }),
);

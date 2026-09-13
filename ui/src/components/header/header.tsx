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
 * Public Header contracts are defined by the component type module.
 */
import { createElement, forwardRef } from "react";

import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import type { HeaderOwnerState, HeaderProps } from "./header.types.js";
import { withMiaixzThemeComponent } from "../../theme/themed-component.js";

/*
 * Renders a page title area with configurable structure slots. @public
 */
export const Header = withMiaixzThemeComponent(
  "Header",
  forwardRef<HTMLElement, HeaderProps>(function Header(
    {
      title,
      eyebrow,
      description,
      actions,
      headingLevel = 1,
      density = "standard",
      spacing = "default",
      slots,
      slotProps,
      children,
      ...props
    },
    ref,
  ) {
    const ownerState: HeaderOwnerState = { density, spacing };
    const Description = slots?.description ?? "div";
    return (
      <header
        {...mergeMiaixzSlotProps({
          ownerState,
          defaultProps: { className: "miaixz-header" },
          componentProps: props,
          slotProps: slotProps?.root,
          forwardedRef: ref,
          internalProps: { "data-density": density, "data-spacing": spacing },
          ownedProps: ["data-density", "data-spacing"],
        })}
      >
        <div
          {...mergeMiaixzSlotProps({
            ownerState,
            defaultProps: { className: "miaixz-header-content" },
            slotProps: slotProps?.content,
          })}
        >
          {eyebrow !== undefined && (
            <div
              {...mergeMiaixzSlotProps({
                ownerState,
                defaultProps: { className: "miaixz-header-eyebrow" },
                slotProps: slotProps?.eyebrow,
              })}
            >
              {eyebrow}
            </div>
          )}
          {createElement(
            `h${headingLevel}`,
            mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-header-title" },
              slotProps: slotProps?.title,
            }),
            title,
          )}
          {description !== undefined && (
            <Description
              {...mergeMiaixzSlotProps({
                ownerState,
                defaultProps: { className: "miaixz-header-description" },
                slotProps: slotProps?.description,
              })}
            >
              {description}
            </Description>
          )}
          {children}
        </div>
        {actions !== undefined && (
          <div
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-header-actions" },
              slotProps: slotProps?.actions,
            })}
          >
            {actions}
          </div>
        )}
      </header>
    );
  }),
);

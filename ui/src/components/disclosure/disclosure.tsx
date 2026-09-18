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

import { createElement, forwardRef, useId, useState } from "react";

import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import { withMiaixzThemeComponent } from "../../theme/binding.js";
import { Icon } from "../icon/icon.js";
import type {
  DisclosureOwnerState,
  DisclosureProps,
  DisclosureRootAttributes,
} from "./disclosure.types.js";

/**
 * Renders one independently expandable content section.
 */
export const Disclosure = withMiaixzThemeComponent(
  "Disclosure",
  forwardRef<HTMLDivElement, DisclosureProps>(function Disclosure(
    {
      summary,
      children,
      headingLevel = 3,
      expanded,
      defaultExpanded = false,
      onExpandedChange,
      disabled = false,
      unmountOnExit = false,
      slotProps,
      ...props
    },
    forwardedRef,
  ) {
    const [uncontrolledExpanded, setUncontrolledExpanded] = useState(defaultExpanded);
    const resolvedExpanded = expanded ?? uncontrolledExpanded;
    const triggerId = useId();
    const regionId = useId();
    const ownerState: DisclosureOwnerState = {
      expanded: resolvedExpanded,
      disabled,
      headingLevel,
    };
    const toggle = () => {
      if (disabled) return;
      const next = !resolvedExpanded;
      if (expanded === undefined) setUncontrolledExpanded(next);
      onExpandedChange?.(next);
    };
    const headingProps = mergeMiaixzSlotProps({
      ownerState,
      defaultProps: { className: "miaixz-disclosure-heading" },
      slotProps: slotProps?.heading,
    });
    const region =
      !unmountOnExit || resolvedExpanded ? (
        <div
          {...mergeMiaixzSlotProps({
            ownerState,
            defaultProps: { className: "miaixz-disclosure-region" },
            slotProps: slotProps?.region,
            internalProps: {
              id: regionId,
              role: "region",
              "aria-labelledby": triggerId,
              hidden: !resolvedExpanded,
            },
            ownedProps: ["id", "role", "aria-labelledby", "hidden"],
          })}
        >
          {children}
        </div>
      ) : null;

    return (
      <div
        {...mergeMiaixzSlotProps<DisclosureOwnerState, DisclosureRootAttributes, HTMLDivElement>({
          ownerState,
          defaultProps: { className: "miaixz-disclosure" },
          componentProps: props,
          slotProps: slotProps?.root,
          forwardedRef,
          internalProps: {
            "data-ui": "disclosure",
            ...(resolvedExpanded ? { "data-expanded": true } : {}),
          },
          ownedProps: ["data-ui", "data-expanded"],
        })}
      >
        {createElement(
          `h${headingLevel}`,
          headingProps,
          <button
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-disclosure-trigger" },
              slotProps: slotProps?.trigger,
              internalProps: {
                id: triggerId,
                type: "button",
                disabled,
                "aria-expanded": resolvedExpanded,
                "aria-controls": regionId,
                onClick: toggle,
              },
              ownedProps: ["id", "type", "disabled", "aria-expanded", "aria-controls"],
            })}
          >
            <span>{summary}</span>
            <span
              {...mergeMiaixzSlotProps({
                ownerState,
                defaultProps: { className: "miaixz-disclosure-icon" },
                slotProps: slotProps?.icon,
                internalProps: { "aria-hidden": true },
                ownedProps: ["aria-hidden"],
              })}
            >
              <Icon name="ChevronDown" size="control" />
            </span>
          </button>,
        )}
        {region}
      </div>
    );
  }),
);

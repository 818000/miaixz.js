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

/* eslint-disable jsdoc/require-jsdoc, react-hooks/refs --
 * Slot ref composition is centralized and public contracts live in the type module.
 */
import { forwardRef } from "react";

import { MiaixzUiError } from "../../errors/ui-error.js";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import { Icon } from "../icon/icon.js";
import type {
  NavigationEntry,
  NavigationOwnerState,
  NavigationProps,
  NavigationSlotProps,
  NavigationSlots,
} from "./navigation.types.js";
import { withMiaixzThemeComponent } from "../../theme/themed-component.js";

/*
 * Renders a labeled, link-only navigation region from one declarative item source. @public
 */
export const Navigation = withMiaixzThemeComponent(
  "Navigation",
  forwardRef<HTMLElement, NavigationProps>(function Navigation(
    {
      items,
      orientation = "vertical",
      density = "standard",
      surface = "plain",
      label,
      slots,
      slotProps,
      ...props
    },
    ref,
  ) {
    validateItems(items);
    const ownerState: NavigationOwnerState = {
      orientation,
      density,
      surface,
      current: undefined,
      itemId: undefined,
    };
    return (
      <nav
        {...mergeMiaixzSlotProps({
          ownerState,
          defaultProps: { className: "miaixz-navigation" },
          componentProps: props,
          slotProps: slotProps?.root,
          forwardedRef: ref,
          internalProps: {
            "aria-label": label,
            "data-orientation": orientation,
            "data-density": density,
            "data-surface": surface,
          },
          ownedProps: ["aria-label", "data-orientation", "data-density", "data-surface"],
        })}
      >
        {items.map((item) => (
          <NavigationEntryView
            density={density}
            entry={item}
            key={item.id}
            orientation={orientation}
            slotProps={slotProps}
            slots={slots}
            surface={surface}
          />
        ))}
      </nav>
    );
  }),
);

function NavigationEntryView({
  entry,
  orientation,
  density,
  surface,
  slots,
  slotProps,
}: {
  readonly entry: NavigationEntry;
  readonly orientation: NavigationOwnerState["orientation"];
  readonly density: NavigationOwnerState["density"];
  readonly surface: NavigationOwnerState["surface"];
  readonly slots: NavigationSlots | undefined;
  readonly slotProps: NavigationSlotProps | undefined;
}) {
  const ownerState: NavigationOwnerState = {
    orientation,
    density,
    surface,
    current: entry.current,
    itemId: entry.id,
  };
  const IconRenderer = slots?.icon ?? Icon;
  return (
    <a
      {...mergeMiaixzSlotProps({
        ownerState,
        defaultProps: { className: "miaixz-navigation-item" },
        componentProps: entry.anchorProps,
        slotProps: slotProps?.item,
        internalProps: { href: entry.href, "aria-current": entry.current },
        ownedProps: ["href", "aria-current"],
      })}
    >
      {entry.icon !== undefined && (
        <IconRenderer
          {...mergeMiaixzSlotProps({
            ownerState,
            defaultProps: {
              className: "miaixz-navigation-icon",
              name: entry.icon,
              size: "navigation",
            },
            slotProps: slotProps?.icon,
            internalProps: { "aria-hidden": true },
            ownedProps: ["aria-hidden"],
          })}
        />
      )}
      <span
        {...mergeMiaixzSlotProps({
          ownerState,
          defaultProps: { className: "miaixz-navigation-label" },
          slotProps: slotProps?.label,
        })}
      >
        {entry.label}
      </span>
      {entry.meta !== undefined && (
        <span
          {...mergeMiaixzSlotProps({
            ownerState,
            defaultProps: { className: "miaixz-navigation-meta" },
            slotProps: slotProps?.meta,
          })}
        >
          {entry.meta}
        </span>
      )}
    </a>
  );
}

function validateItems(items: readonly NavigationEntry[]): void {
  const ids = new Set<string>();
  for (const item of items) {
    if (ids.has(item.id)) {
      throw new MiaixzUiError({
        code: "UI_NAVIGATION_DUPLICATE_ID",
        details: { id: item.id },
      });
    }
    ids.add(item.id);
    if (item.textValue.trim() === "") {
      throw new MiaixzUiError({
        code: "UI_NAVIGATION_TEXT_VALUE_INVALID",
        details: { id: item.id },
      });
    }
  }
}

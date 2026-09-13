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
 * Public Tabs contracts are defined by the component type module.
 */
import { forwardRef, useId, useRef, useState, type KeyboardEvent } from "react";

import { MiaixzUiError } from "../../errors/ui-error.js";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import { useControlled } from "../../shared/use-controlled.js";
import type { TabsOwnerState, TabsProps } from "./tabs.types.js";
import { withMiaixzThemeComponent } from "../../theme/themed-component.js";

/*
 * Renders a complete accessible tabs collection from one declarative source. @public
 */
export const Tabs = withMiaixzThemeComponent(
  "Tabs",
  forwardRef<HTMLDivElement, TabsProps>(function Tabs(props, ref) {
    const {
      items,
      label,
      value: controlledValue,
      defaultValue,
      onValueChange,
      orientation = "horizontal",
      activationMode = "manual",
      slotProps,
      ...nativeProps
    } = props;
    validateTabs(items);
    const firstEnabled = items.find((item) => !item.disabled)?.value;
    const hasControlledValue = controlledValue !== undefined;
    const hasExplicitInitialValue = hasControlledValue || defaultValue !== undefined;
    const state = useControlled<string | undefined>({
      value: controlledValue,
      defaultValue: defaultValue ?? firstEnabled,
      hasDefaultValue: hasControlledValue && defaultValue !== undefined,
      ...(onValueChange === undefined
        ? {}
        : { onValueChange: (value) => value !== undefined && onValueChange(value) }),
      readOnly: hasControlledValue && onValueChange === undefined,
    });
    const selectedItem = items.find((item) => item.value === state.value);
    if (hasExplicitInitialValue && (selectedItem === undefined || selectedItem.disabled === true)) {
      throw new MiaixzUiError({
        code: "UI_TABS_VALUE_INVALID",
        details: { value: state.value },
      });
    }
    const effectiveValue =
      selectedItem !== undefined && !selectedItem.disabled ? selectedItem.value : firstEnabled;
    const [focusedValue, setFocusedValue] = useState<string | undefined>(effectiveValue);
    const effectiveFocusedValue = items.some(
      (item) => item.value === focusedValue && !item.disabled,
    )
      ? focusedValue
      : effectiveValue;
    const baseId = `miaixz-tabs-${useId()}`;
    const listRef = useRef<HTMLDivElement | null>(null);
    const rootOwnerState: TabsOwnerState = {
      orientation,
      activationMode,
      selected: false,
      disabled: false,
      value: effectiveValue,
    };
    const select = (value: string) => {
      if (state.readOnly || value === effectiveValue) return;
      state.setValue(value);
    };
    const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, value: string) => {
      if (state.readOnly) return;
      const enabledItems = items.filter((item) => !item.disabled);
      const currentIndex = enabledItems.findIndex((item) => item.value === value);
      if (currentIndex < 0 || enabledItems.length === 0) return;
      const rtl = getComputedStyle(listRef.current ?? event.currentTarget).direction === "rtl";
      const previousKey = orientation === "vertical" ? "ArrowUp" : rtl ? "ArrowRight" : "ArrowLeft";
      const nextKey = orientation === "vertical" ? "ArrowDown" : rtl ? "ArrowLeft" : "ArrowRight";
      let nextIndex: number | undefined;
      if (event.key === previousKey) {
        nextIndex = (currentIndex - 1 + enabledItems.length) % enabledItems.length;
      } else if (event.key === nextKey) {
        nextIndex = (currentIndex + 1) % enabledItems.length;
      } else if (event.key === "Home") {
        nextIndex = 0;
      } else if (event.key === "End") {
        nextIndex = enabledItems.length - 1;
      } else if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        select(value);
        return;
      }
      if (nextIndex === undefined) return;
      event.preventDefault();
      const nextValue = enabledItems[nextIndex]?.value;
      if (nextValue === undefined) return;
      setFocusedValue(nextValue);
      const nextIndexInItems = items.findIndex((item) => item.value === nextValue);
      const nextTab = listRef.current?.ownerDocument.getElementById(
        `${baseId}-tab-${nextIndexInItems}`,
      );
      if (nextTab instanceof HTMLButtonElement && listRef.current?.contains(nextTab))
        nextTab.focus();
      if (activationMode === "automatic") select(nextValue);
    };
    return (
      <div
        {...mergeMiaixzSlotProps({
          ownerState: rootOwnerState,
          defaultProps: { className: "miaixz-tabs" },
          componentProps: nativeProps,
          slotProps: slotProps?.root,
          forwardedRef: ref,
          internalProps: { "data-orientation": orientation },
          ownedProps: ["data-orientation"],
        })}
      >
        <div
          {...mergeMiaixzSlotProps({
            ownerState: rootOwnerState,
            defaultProps: { className: "miaixz-tabs-list" },
            slotProps: slotProps?.list,
            internalRef: listRef,
            internalProps: {
              role: "tablist",
              "aria-label": label,
              "aria-orientation": orientation,
            },
            ownedProps: ["role", "aria-label", "aria-orientation"],
          })}
        >
          {items.map((item, index) => {
            const selected = effectiveValue === item.value;
            const disabled = item.disabled === true || (state.readOnly && !selected);
            const ownerState: TabsOwnerState = {
              orientation,
              activationMode,
              selected,
              disabled,
              value: item.value,
            };
            return (
              <button
                {...mergeMiaixzSlotProps({
                  ownerState,
                  defaultProps: { className: "miaixz-tab" },
                  slotProps: slotProps?.tab,
                  internalProps: {
                    id: `${baseId}-tab-${index}`,
                    type: "button",
                    role: "tab",
                    "aria-selected": selected,
                    "aria-controls": `${baseId}-panel-${index}`,
                    tabIndex: item.value === effectiveFocusedValue ? 0 : -1,
                    disabled,
                    onClick: () => {
                      setFocusedValue(item.value);
                      select(item.value);
                    },
                    onKeyDown: (event) => handleKeyDown(event, item.value),
                  },
                  ownedProps: [
                    "id",
                    "type",
                    "role",
                    "aria-selected",
                    "aria-controls",
                    "tabIndex",
                    "disabled",
                  ],
                })}
                key={item.value}
              >
                <span
                  {...mergeMiaixzSlotProps({
                    ownerState,
                    slotProps: slotProps?.label,
                  })}
                >
                  {item.label}
                </span>
                {item.count !== undefined && (
                  <span
                    {...mergeMiaixzSlotProps({
                      ownerState,
                      defaultProps: { className: "miaixz-tab-count" },
                      slotProps: slotProps?.count,
                    })}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {items.map((item, index) => {
          const selected = effectiveValue === item.value;
          const ownerState: TabsOwnerState = {
            orientation,
            activationMode,
            selected,
            disabled: item.disabled === true,
            value: item.value,
          };
          return (
            <div
              {...mergeMiaixzSlotProps({
                ownerState,
                defaultProps: { className: "miaixz-tab-panel" },
                slotProps: slotProps?.panel,
                internalProps: {
                  id: `${baseId}-panel-${index}`,
                  role: "tabpanel",
                  "aria-labelledby": `${baseId}-tab-${index}`,
                  hidden: !selected,
                  tabIndex: item.panelTabIndex,
                },
                ownedProps: ["id", "role", "aria-labelledby", "hidden", "tabIndex"],
              })}
              key={item.value}
            >
              {item.content}
            </div>
          );
        })}
      </div>
    );
  }),
);

function validateTabs(items: TabsProps["items"]): void {
  const values = new Set<string>();
  for (const item of items) {
    if (values.has(item.value)) {
      throw new MiaixzUiError({
        code: "UI_TABS_DUPLICATE_VALUE",
        details: { value: item.value },
      });
    }
    values.add(item.value);
  }
}

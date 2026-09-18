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

import { forwardRef, useRef, useState } from "react";

import { MiaixzUiError } from "../../errors/ui-error.js";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import { withMiaixzThemeComponent } from "../../theme/binding.js";
import { Icon } from "../icon/icon.js";
import type { SegmentedItem, SegmentedOwnerState, SegmentedProps } from "./segmented.types.js";
import type { ReactElement, RefAttributes } from "react";

type SegmentedComponent = <Value extends string>(
  props: SegmentedProps<Value> & RefAttributes<HTMLDivElement>,
) => ReactElement | null;

/**
 * Renders an exclusive set of compact native buttons.
 */
const SegmentedImplementation = forwardRef(function Segmented<Value extends string>(
  {
    items,
    value,
    defaultValue,
    onValueChange,
    orientation = "horizontal",
    disabled = false,
    slotProps,
    ...props
  }: SegmentedProps<Value>,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  if (items.length === 0) throw new MiaixzUiError({ code: "UI_SEGMENTED_ITEMS_EMPTY" });
  const values = new Set<Value>();
  for (const item of items) {
    if (values.has(item.value)) throw new MiaixzUiError({ code: "UI_SEGMENTED_DUPLICATE_VALUE" });
    values.add(item.value);
  }
  const enabledItems = items.filter((item) => item.disabled !== true);
  if (enabledItems.length === 0) throw new MiaixzUiError({ code: "UI_SEGMENTED_NO_ENABLED_ITEM" });
  if (value !== undefined && !values.has(value)) {
    throw new MiaixzUiError({ code: "UI_SEGMENTED_VALUE_INVALID" });
  }
  const fallback = enabledItems[0]!.value;
  const [uncontrolledValue, setUncontrolledValue] = useState<Value>(defaultValue ?? fallback);
  const selectedValue = value ?? (values.has(uncontrolledValue) ? uncontrolledValue : fallback);
  const selectedItem = items.find((item) => item.value === selectedValue);
  const tabValue = selectedItem?.disabled === true ? fallback : selectedValue;
  const refs = useRef(new Map<Value, HTMLButtonElement>());
  const ownerState: SegmentedOwnerState = { orientation, disabled };

  const select = (item: SegmentedItem<Value>) => {
    if (disabled || item.disabled === true) return;
    if (value === undefined) setUncontrolledValue(item.value);
    if (item.value !== selectedValue) onValueChange?.(item.value);
  };
  const move = (current: Value, direction: number) => {
    const index = enabledItems.findIndex((item) => item.value === current);
    const next = enabledItems[(index + direction + enabledItems.length) % enabledItems.length]!;
    refs.current.get(next.value)?.focus();
    select(next);
  };

  return (
    <div
      {...mergeMiaixzSlotProps({
        ownerState,
        defaultProps: { className: "miaixz-segmented" },
        componentProps: props,
        slotProps: slotProps?.root,
        forwardedRef,
        internalProps: {
          role: "group",
          "data-ui": "segmented",
          "data-orientation": orientation,
        },
        ownedProps: ["role", "data-ui", "data-orientation"],
      })}
    >
      {items.map((item) => {
        const itemDisabled = disabled || item.disabled === true;
        return (
          <button
            key={item.value}
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-segmented-item" },
              slotProps: slotProps?.item,
            })}
            ref={(node) => {
              if (node === null) refs.current.delete(item.value);
              else refs.current.set(item.value, node);
            }}
            type="button"
            disabled={itemDisabled}
            aria-label={item.textValue}
            aria-pressed={item.value === selectedValue}
            tabIndex={item.value === tabValue ? 0 : -1}
            onClick={() => select(item)}
            onKeyDown={(event) => {
              const previous = orientation === "horizontal" ? "ArrowLeft" : "ArrowUp";
              const next = orientation === "horizontal" ? "ArrowRight" : "ArrowDown";
              if (event.key === previous || event.key === next) {
                event.preventDefault();
                move(item.value, event.key === previous ? -1 : 1);
              } else if (event.key === "Home" || event.key === "End") {
                event.preventDefault();
                const target = event.key === "Home" ? enabledItems[0]! : enabledItems.at(-1)!;
                refs.current.get(target.value)?.focus();
                select(target);
              }
            }}
          >
            {item.icon !== undefined && (
              <span
                {...mergeMiaixzSlotProps({
                  ownerState,
                  defaultProps: { className: "miaixz-segmented-icon" },
                  slotProps: slotProps?.icon,
                })}
              >
                <Icon name={item.icon} size="control" />
              </span>
            )}
            <span
              {...mergeMiaixzSlotProps({
                ownerState,
                defaultProps: { className: "miaixz-segmented-label" },
                slotProps: slotProps?.label,
              })}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}) as SegmentedComponent;

/**
 * Exposes the themed generic segmented control.
 */
export const Segmented = withMiaixzThemeComponent(
  "Segmented",
  SegmentedImplementation,
) as SegmentedComponent;

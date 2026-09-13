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

import type { ButtonHTMLAttributes, MouseEvent } from "react";

import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import { Icon } from "../icon/icon.js";
import type {
  SelectEntry,
  SelectOption,
  SelectOwnerState,
  SelectProps,
  SelectSlot,
} from "./select.types.js";

/**
 * Removes Select-owned fields from native trigger attributes.
 *
 * @param props - Complete or partial Select properties.
 * @returns Native trigger properties.
 */
export function getSelectTriggerProps(
  props: Partial<SelectProps>,
): ButtonHTMLAttributes<HTMLButtonElement> {
  const {
    items: _items,
    size: _size,
    invalid: _invalid,
    readOnly: _readOnly,
    required: _required,
    widthPreset: _widthPreset,
    value: _value,
    defaultValue: _defaultValue,
    onValueChange: _onValueChange,
    onInvalid: _onInvalid,
    slotProps: _slotProps,
    className: _className,
    style: _style,
    name: _name,
    form: _form,
    ...triggerProps
  } = props;
  return triggerProps;
}

/**
 * Renders options and groups with the Select slot contract.
 *
 * @param items - Entries in render order.
 * @param value - Current value.
 * @param activeId - Active option id.
 * @param optionIdPrefix - Stable DOM id prefix.
 * @param readOnly - Whether selection changes are unavailable.
 * @param ownerState - Effective Select state.
 * @param props - Select slot properties.
 * @param themeClasses - Resolves Theme classes for a slot.
 * @param setActiveId - Moves pointer activity.
 * @param choose - Selects one option.
 * @returns Rendered option and group nodes.
 */
export function renderSelectEntries(
  items: readonly SelectEntry[],
  value: string,
  activeId: string | null,
  optionIdPrefix: string,
  readOnly: boolean,
  ownerState: SelectOwnerState,
  props: SelectProps,
  themeClasses: (slot: SelectSlot) => readonly (string | undefined)[],
  setActiveId: (id: string) => void,
  choose: (option: SelectOption) => void,
) {
  const renderOption = (option: SelectOption) => {
    const selected = option.value === value;
    const interactionDisabled = readOnly || option.disabled === true;
    const optionProps = mergeMiaixzSlotProps({
      ownerState,
      defaultProps: { className: "miaixz-select-option" },
      themeClassNames: themeClasses("option"),
      slotProps: props.slotProps?.option,
      internalProps: {
        id: `${optionIdPrefix}-${option.id}`,
        role: "option",
        "aria-selected": selected,
        ...(interactionDisabled ? { "aria-disabled": true } : {}),
        "data-state": option.id === activeId ? "active" : "idle",
        ...(interactionDisabled ? { "data-disabled": true } : {}),
        onPointerMove: () => {
          if (!interactionDisabled) setActiveId(option.id);
        },
        onMouseDown: (event: MouseEvent) => event.preventDefault(),
        onClick: () => choose(option),
      },
      ownedProps: ["id", "role", "aria-selected", "aria-disabled", "data-state", "data-disabled"],
    });
    return (
      <div key={option.id} {...optionProps}>
        <span className="miaixz-select-option-label">{option.label}</span>
        {selected && <Icon name="Check" size="control" />}
      </div>
    );
  };
  return items.map((entry) => {
    if (entry.kind === "option") return renderOption(entry);
    const groupProps = mergeMiaixzSlotProps({
      ownerState,
      defaultProps: { className: "miaixz-select-group" },
      themeClassNames: themeClasses("group"),
      slotProps: props.slotProps?.group,
      internalProps: {
        role: "group",
        "aria-labelledby": `${optionIdPrefix}-group-${entry.id}`,
      },
      ownedProps: ["role", "aria-labelledby"],
    });
    const labelProps = mergeMiaixzSlotProps({
      ownerState,
      defaultProps: { className: "miaixz-select-group-label" },
      themeClassNames: themeClasses("groupLabel"),
      slotProps: props.slotProps?.groupLabel,
      internalProps: { id: `${optionIdPrefix}-group-${entry.id}` },
      ownedProps: ["id"],
    });
    return (
      <div key={entry.id} {...groupProps}>
        <div {...labelProps}>{entry.label}</div>
        {entry.options.map(renderOption)}
      </div>
    );
  });
}

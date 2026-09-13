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

import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import type { ComboboxOwnerState, MiaixzOption } from "../combobox/combobox.types.js";
import { Icon } from "../icon/icon.js";
import type { PickerSlotProps } from "./picker.types.js";

/**
 * Renders the default ordered Picker chip collection.
 *
 * @param value - Current selection.
 * @param ownerState - Effective Picker owner state.
 * @param slotProps - Picker slot customizations.
 * @param removeMessage - Localized remove label.
 * @param disabled - Whether removal is unavailable.
 * @param onRemove - Removes one option.
 * @returns Default value chips or null.
 */
export function renderDefaultValues<Value extends string>(
  value: readonly MiaixzOption<Value>[],
  ownerState: ComboboxOwnerState,
  slotProps: PickerSlotProps | undefined,
  removeMessage: string,
  disabled: boolean,
  onRemove: (option: MiaixzOption<Value>) => void,
) {
  if (value.length === 0) return null;
  const valuesProps = mergeMiaixzSlotProps({
    ownerState,
    defaultProps: { className: "miaixz-picker-tags" },
    slotProps: slotProps?.values,
  });
  return (
    <div {...valuesProps}>
      {value.map((option) => {
        const valueProps = mergeMiaixzSlotProps({
          ownerState,
          defaultProps: { className: "miaixz-picker-tag" },
          slotProps: slotProps?.value,
        });
        const labelProps = mergeMiaixzSlotProps({
          ownerState,
          defaultProps: { className: "miaixz-picker-tag-label" },
          slotProps: slotProps?.valueLabel,
        });
        const removeProps = mergeMiaixzSlotProps({
          ownerState,
          defaultProps: { className: "miaixz-picker-tag-remove" },
          slotProps: slotProps?.remove,
          internalProps: {
            type: "button",
            "aria-label": `${removeMessage} ${option.textValue}`,
            disabled,
            onClick: () => onRemove(option),
          },
          ownedProps: ["type", "aria-label", "disabled"],
        });
        return (
          <span key={option.value} {...valueProps}>
            <span {...labelProps}>{option.label}</span>
            <button {...removeProps}>
              <Icon name="X" size="indicator" />
            </button>
          </span>
        );
      })}
    </div>
  );
}

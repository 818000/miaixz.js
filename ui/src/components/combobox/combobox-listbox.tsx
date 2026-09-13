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

import type { UIEvent } from "react";

import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import { ComboboxOption } from "./combobox-option.js";
import type {
  ComboboxOwnerState,
  ComboboxSlotProps,
  MiaixzOption,
  MiaixzOptionRenderState,
} from "./combobox.types.js";

/* eslint-disable jsdoc/require-jsdoc --
 * This module exposes implementation-only composition contracts.
 */

/*
 * Configures the common listbox used by Combobox and Picker.
 */
export interface ComboboxListboxProps<Value extends string> {
  readonly component: "combobox" | "picker";
  readonly id: string;
  readonly labelId: string;
  readonly optionIdPrefix: string;
  readonly options: readonly MiaixzOption<Value>[];
  readonly activeValue: Value | null;
  readonly multiple: boolean;
  readonly ownerState: ComboboxOwnerState;
  readonly slotProps: ComboboxSlotProps | undefined;
  readonly renderOption:
    ((option: MiaixzOption<Value>, state: MiaixzOptionRenderState) => React.ReactNode) | undefined;
  readonly isSelected: (option: MiaixzOption<Value>) => boolean;
  readonly isDisabled: (option: MiaixzOption<Value>) => boolean;
  readonly onActivate: (option: MiaixzOption<Value>) => void;
  readonly onSelect: (option: MiaixzOption<Value>) => void;
  readonly hasNextPage: boolean;
  readonly onLoadNextPage: () => void;
}

/**
 * Renders a grouped, paginated fixed-role listbox.
 *
 * @typeParam Value - Stable option value type.
 * @param props - Collection state and selection callbacks.
 * @returns One listbox with stable option identities.
 */
export function ComboboxListbox<Value extends string>(props: ComboboxListboxProps<Value>) {
  const listboxProps = mergeMiaixzSlotProps({
    ownerState: props.ownerState,
    defaultProps: { className: `miaixz-${props.component}-listbox` },
    slotProps: props.slotProps?.listbox,
    internalProps: {
      id: props.id,
      role: "listbox",
      "aria-labelledby": props.labelId,
      ...(props.multiple ? { "aria-multiselectable": true } : {}),
      onScroll: (event: UIEvent<HTMLDivElement>) => {
        const element = event.currentTarget;
        if (
          props.hasNextPage &&
          element.scrollHeight - element.scrollTop <= element.clientHeight + 1
        ) {
          props.onLoadNextPage();
        }
      },
    },
    ownedProps: ["id", "role", "aria-labelledby", "aria-multiselectable"],
  });
  const sections = groupMiaixzOptions(props.options);
  return (
    <div {...listboxProps}>
      {sections.map((section) => {
        const options = section.options.map((option) => (
          <ComboboxOption
            key={option.value}
            component={props.component}
            option={option}
            id={`${props.optionIdPrefix}-${option.value}`}
            selected={props.isSelected(option)}
            active={props.activeValue === option.value}
            disabled={props.isDisabled(option)}
            ownerState={props.ownerState}
            slotProps={props.slotProps}
            renderOption={props.renderOption}
            onActivate={() => props.onActivate(option)}
            onSelect={() => props.onSelect(option)}
          />
        ));
        if (section.id === null) return options;
        const groupLabelId = `${props.optionIdPrefix}-group-${section.id}`;
        const groupProps = mergeMiaixzSlotProps({
          ownerState: props.ownerState,
          defaultProps: { className: `miaixz-${props.component}-group` },
          slotProps: props.slotProps?.group,
          internalProps: { role: "group", "aria-labelledby": groupLabelId },
          ownedProps: ["role", "aria-labelledby"],
        });
        const labelProps = mergeMiaixzSlotProps({
          ownerState: props.ownerState,
          defaultProps: { className: `miaixz-${props.component}-group-label` },
          slotProps: props.slotProps?.groupLabel,
          internalProps: { id: groupLabelId },
          ownedProps: ["id"],
        });
        return (
          <div key={section.id} {...groupProps}>
            <div {...labelProps}>{section.label}</div>
            {options}
          </div>
        );
      })}
    </div>
  );
}

/*
 * Represents one first-seen option group.
 */
interface MiaixzOptionSection<Value extends string> {
  readonly id: string | null;
  readonly label: string | null;
  readonly options: MiaixzOption<Value>[];
}

/*
 * Groups options once by first group occurrence while preserving option order within each group.
 */
function groupMiaixzOptions<Value extends string>(
  options: readonly MiaixzOption<Value>[],
): readonly MiaixzOptionSection<Value>[] {
  const sections: MiaixzOptionSection<Value>[] = [];
  const byId = new Map<string | null, MiaixzOptionSection<Value>>();
  for (const option of options) {
    const id = option.group?.id ?? null;
    let section = byId.get(id);
    if (section === undefined) {
      section = { id, label: option.group?.label ?? null, options: [] };
      byId.set(id, section);
      sections.push(section);
    }
    section.options.push(option);
  }
  return sections;
}

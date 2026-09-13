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

import type { MouseEvent } from "react";

import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import { Icon } from "../icon/icon.js";
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
 * Configures one shared listbox option.
 */
export interface ComboboxOptionProps<Value extends string> {
  /*
   * Selects the CSS namespace.
   */
  readonly component: "combobox" | "picker";
  /*
   * Supplies the option data.
   */
  readonly option: MiaixzOption<Value>;
  /*
   * Supplies the stable option DOM id.
   */
  readonly id: string;
  /*
   * Reports whether the option is selected.
   */
  readonly selected: boolean;
  /*
   * Reports whether the option is keyboard-active.
   */
  readonly active: boolean;
  /*
   * Reports whether activation is unavailable.
   */
  readonly disabled: boolean;
  /*
   * Supplies the shared owner state.
   */
  readonly ownerState: ComboboxOwnerState;
  /*
   * Supplies optional slot property customizations.
   */
  readonly slotProps: ComboboxSlotProps | undefined;
  /*
   * Replaces the option's fixed default content.
   */
  readonly renderOption:
    ((option: MiaixzOption<Value>, state: MiaixzOptionRenderState) => React.ReactNode) | undefined;
  /*
   * Moves pointer activity to this option.
   */
  readonly onActivate: () => void;
  /*
   * Requests selection of this option.
   */
  readonly onSelect: () => void;
}

/**
 * Renders one fixed-semantic listbox option.
 *
 * @typeParam Value - Stable option value type.
 * @param props - Option state and callbacks.
 * @returns One option node.
 */
export function ComboboxOption<Value extends string>(props: ComboboxOptionProps<Value>) {
  const state: MiaixzOptionRenderState = { selected: props.selected, active: props.active };
  const optionProps = mergeMiaixzSlotProps({
    ownerState: props.ownerState,
    defaultProps: { className: `miaixz-${props.component}-option` },
    slotProps: props.slotProps?.option,
    internalProps: {
      id: props.id,
      role: "option",
      "aria-selected": props.selected,
      ...(props.disabled ? { "aria-disabled": true } : {}),
      "data-state": props.active ? "active" : "idle",
      ...(props.disabled ? { "data-disabled": true } : {}),
      onPointerMove: () => {
        if (!props.disabled) props.onActivate();
      },
      onMouseDown: (event: MouseEvent) => event.preventDefault(),
      onClick: props.onSelect,
    },
    ownedProps: ["id", "role", "aria-selected", "aria-disabled", "data-state", "data-disabled"],
  });
  const copyProps = mergeMiaixzSlotProps({
    ownerState: props.ownerState,
    defaultProps: { className: `miaixz-${props.component}-option-copy` },
    slotProps: props.slotProps?.optionCopy,
  });
  const labelProps = mergeMiaixzSlotProps({
    ownerState: props.ownerState,
    defaultProps: { className: `miaixz-${props.component}-option-label` },
    slotProps: props.slotProps?.optionLabel,
  });
  const descriptionProps = mergeMiaixzSlotProps({
    ownerState: props.ownerState,
    defaultProps: { className: `miaixz-${props.component}-option-description` },
    slotProps: props.slotProps?.optionDescription,
  });
  return (
    <div {...optionProps}>
      {props.renderOption === undefined ? (
        <span {...copyProps}>
          <span {...labelProps}>{props.option.label}</span>
          {props.option.description !== undefined && (
            <span {...descriptionProps}>{props.option.description}</span>
          )}
        </span>
      ) : (
        props.renderOption(props.option, state)
      )}
      {props.selected && <Icon name="Check" size="control" />}
    </div>
  );
}

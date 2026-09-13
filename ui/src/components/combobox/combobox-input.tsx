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

import type { KeyboardEvent, ReactNode, RefObject } from "react";

import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import { Icon } from "../icon/icon.js";
import type { ComboboxOwnerState, ComboboxSlotProps } from "./combobox.types.js";

/* eslint-disable jsdoc/require-jsdoc --
 * This module exposes implementation-only composition contracts.
 */

/*
 * Configures the fixed input/control structure shared by both option pickers.
 */
export interface ComboboxInputProps {
  readonly component: "combobox" | "picker";
  readonly inputRef: RefObject<HTMLInputElement | null>;
  readonly controlRef: RefObject<HTMLDivElement | null>;
  readonly id: string | undefined;
  readonly form: string | undefined;
  readonly required: boolean;
  readonly listboxId: string;
  readonly labelId: string;
  readonly describedBy: string | undefined;
  readonly activeOptionId: string | undefined;
  readonly inputValue: string;
  readonly placeholder: string | undefined;
  readonly ownerState: ComboboxOwnerState;
  readonly inputReadOnly: boolean;
  readonly clearable: boolean;
  readonly slotProps: ComboboxSlotProps | undefined;
  readonly beforeInput: ReactNode;
  readonly afterInput: ReactNode;
  readonly clearLabel: string;
  readonly toggleLabel: string;
  readonly onOpen: () => void;
  readonly onToggle: () => void;
  readonly onClear: () => void;
  readonly onInputValueChange: (value: string) => void;
  readonly onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
}

/**
 * Renders the immutable control, input, clear, and disclosure order.
 *
 * @param props - Current input state and interaction callbacks.
 * @returns One combobox input/control subtree.
 */
export function ComboboxInput(props: ComboboxInputProps) {
  const state = props.ownerState;
  const controlProps = mergeMiaixzSlotProps({
    ownerState: state,
    defaultProps: { className: `miaixz-control miaixz-${props.component}-control` },
    slotProps: props.slotProps?.control,
    internalRef: props.controlRef,
    internalProps: {
      "data-state": state.open ? "open" : "closed",
      ...(state.disabled ? { "data-disabled": true } : {}),
      ...(state.readOnly ? { "data-readonly": true } : {}),
      ...(state.invalid ? { "data-invalid": true } : {}),
      ...(state.filled ? { "data-filled": true } : {}),
    },
    ownedProps: ["data-state", "data-disabled", "data-readonly", "data-invalid", "data-filled"],
  });
  const inputProps = mergeMiaixzSlotProps({
    ownerState: state,
    defaultProps: { className: `miaixz-${props.component}-input` },
    slotProps: props.slotProps?.input,
    internalRef: props.inputRef,
    internalProps: {
      ...(props.id === undefined ? {} : { id: props.id }),
      ...(props.form === undefined ? {} : { form: props.form }),
      type: "text",
      role: "combobox",
      "aria-autocomplete": "list",
      "aria-controls": props.listboxId,
      "aria-expanded": state.open,
      "aria-labelledby": props.labelId,
      ...(props.describedBy === undefined ? {} : { "aria-describedby": props.describedBy }),
      ...(props.activeOptionId === undefined
        ? {}
        : { "aria-activedescendant": props.activeOptionId }),
      ...(state.invalid ? { "aria-invalid": true } : {}),
      ...(props.inputReadOnly ? { "aria-readonly": true } : {}),
      ...(props.required ? { "aria-required": true } : {}),
      autoComplete: "off",
      value: props.inputValue,
      ...(props.placeholder === undefined ? {} : { placeholder: props.placeholder }),
      disabled: state.disabled,
      readOnly: props.inputReadOnly,
      onFocus: props.onOpen,
      onClick: props.onOpen,
      onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
        props.onInputValueChange(event.currentTarget.value),
      onKeyDown: props.onKeyDown,
    },
    ownedProps: [
      "id",
      "form",
      "type",
      "role",
      "aria-autocomplete",
      "aria-controls",
      "aria-expanded",
      "aria-labelledby",
      "aria-describedby",
      "aria-activedescendant",
      "aria-invalid",
      "aria-readonly",
      "aria-required",
      "autoComplete",
      "value",
      "disabled",
      "readOnly",
    ],
  });
  const clearProps = mergeMiaixzSlotProps({
    ownerState: state,
    defaultProps: { className: `miaixz-${props.component}-clear` },
    slotProps: props.slotProps?.clear,
    internalProps: {
      type: "button",
      "aria-label": props.clearLabel,
      tabIndex: -1,
      onClick: props.onClear,
    },
    ownedProps: ["type", "aria-label", "tabIndex"],
  });
  const toggleProps = mergeMiaixzSlotProps({
    ownerState: state,
    defaultProps: { className: `miaixz-${props.component}-toggle` },
    slotProps: props.slotProps?.toggle,
    internalProps: {
      type: "button",
      "aria-label": props.toggleLabel,
      "aria-controls": props.listboxId,
      "aria-expanded": state.open,
      disabled: state.disabled,
      tabIndex: -1,
      onClick: props.onToggle,
    },
    ownedProps: ["type", "aria-label", "aria-controls", "aria-expanded", "disabled", "tabIndex"],
  });
  return (
    <div {...controlProps}>
      {props.beforeInput}
      <input {...inputProps} />
      {props.afterInput}
      {props.clearable && !state.disabled && (
        <button {...clearProps}>
          <Icon name="X" size="indicator" />
        </button>
      )}
      <button {...toggleProps}>
        <Icon name="ChevronDown" size="control" />
      </button>
    </div>
  );
}

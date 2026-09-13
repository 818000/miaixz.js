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

import { forwardRef, useRef } from "react";

import { classNames } from "../../shared/class-names.js";
import { hasMiaixzControlValue } from "../../shared/control-state.js";
import { useFieldControl } from "../../shared/field-context.js";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import { useControlValueState } from "../../shared/use-control-value-state.js";
import { getMiaixzThemeSlotClassNames } from "../../theme/components.js";
import { useMiaixzThemeComponent } from "../../theme/context.js";
import type { InputOwnerState, InputProps, InputRootAttributes, InputSlot } from "./input.types.js";

/**
 * Removes Input-owned fields from native input attributes.
 *
 * @param props - Complete or partial public Input properties.
 * @returns Native properties that belong on the input element.
 */
function getInputNativeProps(props: Partial<InputProps>) {
  const {
    size: _size,
    invalid: _invalid,
    startAdornment: _startAdornment,
    endAdornment: _endAdornment,
    slotProps: _slotProps,
    className: _className,
    style: _style,
    ...nativeProps
  } = props;
  return nativeProps;
}

/**
 * Renders a single-line native input with explicit root and input slots.
 *
 * @public
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(props, ref) {
  const theme = useMiaixzThemeComponent("Input");
  const defaults = theme?.defaultProps;
  const {
    size = defaults?.size ?? "medium",
    invalid = defaults?.invalid,
    startAdornment = defaults?.startAdornment,
    endAdornment = defaults?.endAdornment,
    className,
    style,
    disabled = defaults?.disabled,
    readOnly = defaults?.readOnly,
    value = defaults?.value,
    defaultValue = defaults?.defaultValue,
    id = defaults?.id,
    required = defaults?.required,
    "aria-invalid": ariaInvalid = defaults?.["aria-invalid"],
    "aria-labelledby": ariaLabelledBy = defaults?.["aria-labelledby"],
    "aria-describedby": ariaDescribedBy = defaults?.["aria-describedby"],
    slotProps,
  } = props;
  const fieldProps = useFieldControl({
    ...(id === undefined ? {} : { id }),
    ...(required === undefined ? {} : { required }),
    ...(disabled === undefined ? {} : { disabled }),
    ...(invalid === undefined ? {} : { invalid }),
    ...(ariaInvalid === undefined ? {} : { "aria-invalid": ariaInvalid }),
    ...(ariaLabelledBy === undefined ? {} : { "aria-labelledby": ariaLabelledBy }),
    ...(ariaDescribedBy === undefined ? {} : { "aria-describedby": ariaDescribedBy }),
  });
  const effectiveInvalid =
    fieldProps.invalid ??
    (fieldProps["aria-invalid"] !== undefined &&
      fieldProps["aria-invalid"] !== false &&
      fieldProps["aria-invalid"] !== "false");
  const effectiveDisabled = fieldProps.disabled ?? false;
  const inputRef = useRef<HTMLInputElement>(null);
  const filledState = useControlValueState({
    controlRef: inputRef,
    value: value === undefined ? undefined : hasMiaixzControlValue(value),
    defaultValue: hasMiaixzControlValue(defaultValue),
    read: (control) => hasMiaixzControlValue(control.value),
  });
  const ownerState: InputOwnerState = {
    size,
    invalid: effectiveInvalid,
    disabled: effectiveDisabled,
    readOnly: readOnly === true,
    filled: filledState.value,
  };
  const themeClasses = (slot: InputSlot) => getMiaixzThemeSlotClassNames(theme, ownerState, slot);
  const rootProps = mergeMiaixzSlotProps<InputOwnerState, InputRootAttributes, HTMLSpanElement>({
    ownerState,
    defaultProps: {
      className: classNames(
        "miaixz-control",
        "miaixz-input",
        `miaixz-control-${size}`,
        startAdornment !== undefined && "miaixz-input-with-start",
        endAdornment !== undefined && "miaixz-input-with-end",
      ),
    },
    themeDefaultProps: {
      ...(defaults?.className === undefined ? {} : { className: defaults.className }),
      ...(defaults?.style === undefined ? {} : { style: defaults.style }),
    },
    componentProps: {
      ...(className === undefined ? {} : { className }),
      ...(style === undefined ? {} : { style }),
    },
    themeClassNames: themeClasses("root"),
    slotProps: slotProps?.root,
    internalProps: {
      "data-size": size,
      ...(effectiveInvalid ? { "data-invalid": true } : {}),
      ...(effectiveDisabled ? { "data-disabled": true } : {}),
      ...(readOnly ? { "data-readonly": true } : {}),
      ...(filledState.value ? { "data-filled": true } : {}),
    },
    ownedProps: ["data-size", "data-invalid", "data-disabled", "data-readonly", "data-filled"],
  });
  const inputProps = mergeMiaixzSlotProps({
    ownerState,
    defaultProps: { className: "miaixz-input-element" },
    componentProps: {
      ...getInputNativeProps(props),
    },
    themeDefaultProps: getInputNativeProps(defaults ?? {}),
    themeClassNames: themeClasses("input"),
    slotProps: slotProps?.input,
    internalRef: inputRef,
    forwardedRef: ref,
    internalProps: {
      ...(fieldProps.id === undefined ? {} : { id: fieldProps.id }),
      ...(fieldProps.required === undefined ? {} : { required: fieldProps.required }),
      disabled: effectiveDisabled,
      ...(readOnly === undefined ? {} : { readOnly }),
      ...(effectiveInvalid ? { "aria-invalid": true } : {}),
      ...(fieldProps["aria-labelledby"] === undefined
        ? {}
        : { "aria-labelledby": fieldProps["aria-labelledby"] }),
      ...(fieldProps["aria-describedby"] === undefined
        ? {}
        : { "aria-describedby": fieldProps["aria-describedby"] }),
      onChange: filledState.sync,
    },
    ownedProps: [
      "id",
      "required",
      "disabled",
      "readOnly",
      "aria-invalid",
      "aria-labelledby",
      "aria-describedby",
    ],
  });
  const startProps = mergeMiaixzSlotProps({
    ownerState,
    defaultProps: { className: "miaixz-input-adornment miaixz-input-start-adornment" },
    themeClassNames: themeClasses("startAdornment"),
    slotProps: slotProps?.startAdornment,
  });
  const endProps = mergeMiaixzSlotProps({
    ownerState,
    defaultProps: { className: "miaixz-input-adornment miaixz-input-end-adornment" },
    themeClassNames: themeClasses("endAdornment"),
    slotProps: slotProps?.endAdornment,
  });
  return (
    <span {...rootProps}>
      {startAdornment !== undefined && <span {...startProps}>{startAdornment}</span>}
      <input {...inputProps} />
      {endAdornment !== undefined && <span {...endProps}>{endAdornment}</span>}
    </span>
  );
});

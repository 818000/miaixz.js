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

import { forwardRef, useLayoutEffect, useRef } from "react";

import { classNames } from "../../shared/class-names.js";
import { useFieldControl } from "../../shared/field-context.js";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import { useChoiceControlState } from "../../shared/use-choice-control-state.js";
import type {
  CheckboxOwnerState,
  CheckboxProps,
  CheckboxRootAttributes,
} from "./checkbox.types.js";
import { withMiaixzThemeComponent } from "../../theme/themed-component.js";

/**
 * Renders a labeled native checkbox with fixed semantic slots.
 *
 * @public
 */
export const Checkbox = withMiaixzThemeComponent(
  "Checkbox",
  forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(props, ref) {
    const {
      label,
      description,
      indeterminate = false,
      invalid,
      className,
      style,
      disabled,
      checked,
      defaultChecked,
      onChange,
      required,
      id,
      slotProps,
      "aria-invalid": ariaInvalid,
      "aria-labelledby": ariaLabelledBy,
      "aria-describedby": ariaDescribedBy,
      ...nativeProps
    } = props;
    const inputRef = useRef<HTMLInputElement>(null);
    const checkedState = useChoiceControlState({
      inputRef,
      checked,
      defaultChecked: defaultChecked ?? false,
    });
    const fieldProps = useFieldControl({
      ...(id === undefined ? {} : { id }),
      ...(required === undefined ? {} : { required }),
      ...(disabled === undefined ? {} : { disabled }),
      ...(invalid === undefined ? {} : { invalid }),
      ...(ariaInvalid === undefined ? {} : { "aria-invalid": ariaInvalid }),
      ...(ariaLabelledBy === undefined ? {} : { "aria-labelledby": ariaLabelledBy }),
      ...(ariaDescribedBy === undefined ? {} : { "aria-describedby": ariaDescribedBy }),
    });
    const effectiveDisabled = fieldProps.disabled ?? false;
    const effectiveInvalid = fieldProps.invalid ?? false;
    const ownerState: CheckboxOwnerState = {
      checked: checkedState.value,
      indeterminate,
      disabled: effectiveDisabled,
      invalid: effectiveInvalid,
    };
    useLayoutEffect(() => {
      if (inputRef.current !== null) inputRef.current.indeterminate = indeterminate;
    }, [indeterminate]);

    const rootProps = mergeMiaixzSlotProps<
      CheckboxOwnerState,
      CheckboxRootAttributes,
      HTMLLabelElement
    >({
      ownerState,
      defaultProps: {
        className: classNames(
          "miaixz-choice",
          "miaixz-checkbox",
          effectiveDisabled && "miaixz-choice-disabled",
          effectiveInvalid && "miaixz-choice-invalid",
        ),
      },
      componentProps: {
        ...(className === undefined ? {} : { className }),
        ...(style === undefined ? {} : { style }),
      },
      slotProps: slotProps?.root,
      internalProps: {
        ...(effectiveDisabled ? { "data-disabled": true } : {}),
        ...(checkedState.value || indeterminate ? { "data-filled": true } : {}),
        ...(effectiveInvalid ? { "data-invalid": true } : {}),
      },
      ownedProps: ["data-disabled", "data-filled", "data-invalid"],
    });
    const inputProps = mergeMiaixzSlotProps({
      ownerState,
      defaultProps: { className: "miaixz-choice-input" },
      componentProps: { ...nativeProps, ...(onChange === undefined ? {} : { onChange }) },
      slotProps: slotProps?.input,
      internalRef: inputRef,
      forwardedRef: ref,
      internalProps: {
        ...(fieldProps.id === undefined ? {} : { id: fieldProps.id }),
        type: "checkbox",
        disabled: effectiveDisabled,
        ...(fieldProps.required === undefined ? {} : { required: fieldProps.required }),
        ...(checked === undefined ? {} : { checked }),
        ...(defaultChecked === undefined ? {} : { defaultChecked }),
        "aria-checked": indeterminate ? "mixed" : checkedState.value,
        ...(effectiveInvalid ? { "aria-invalid": true } : {}),
        ...(fieldProps["aria-labelledby"] === undefined
          ? {}
          : { "aria-labelledby": fieldProps["aria-labelledby"] }),
        ...(fieldProps["aria-describedby"] === undefined
          ? {}
          : { "aria-describedby": fieldProps["aria-describedby"] }),
        onChange: checkedState.sync,
      },
      ownedProps: [
        "id",
        "type",
        "disabled",
        "required",
        "checked",
        "defaultChecked",
        "aria-checked",
        "aria-invalid",
        "aria-labelledby",
        "aria-describedby",
      ],
    });
    const markProps = mergeMiaixzSlotProps({
      ownerState,
      defaultProps: { className: "miaixz-choice-mark" },
      slotProps: slotProps?.mark,
      internalProps: { "aria-hidden": true },
      ownedProps: ["aria-hidden"],
    });
    const contentProps = mergeMiaixzSlotProps({
      ownerState,
      defaultProps: { className: "miaixz-choice-content" },
      slotProps: slotProps?.content,
    });
    const labelProps = mergeMiaixzSlotProps({
      ownerState,
      defaultProps: { className: "miaixz-choice-label" },
      slotProps: slotProps?.label,
    });
    const descriptionProps = mergeMiaixzSlotProps({
      ownerState,
      defaultProps: { className: "miaixz-choice-description" },
      slotProps: slotProps?.description,
    });
    return (
      <label {...rootProps}>
        <input {...inputProps} />
        <span {...markProps} />
        {(label !== undefined || description !== undefined) && (
          <span {...contentProps}>
            {label !== undefined && <span {...labelProps}>{label}</span>}
            {description !== undefined && <span {...descriptionProps}>{description}</span>}
          </span>
        )}
      </label>
    );
  }),
);

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

import { hasMiaixzControlValue } from "../../shared/control-state.js";
import { useFieldControl } from "../../shared/field-context.js";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import { useControlValueState } from "../../shared/use-control-value-state.js";
import type {
  TextareaOwnerState,
  TextareaProps,
  TextareaRootAttributes,
  TextareaControlAttributes,
} from "./textarea.types.js";
import { withMiaixzThemeComponent } from "../../theme/themed-component.js";

/**
 * Renders a multiline native input with explicit root and textarea slots.
 *
 * @public
 */
export const Textarea = withMiaixzThemeComponent(
  "Textarea",
  forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(props, ref) {
    const {
      size = "medium",
      invalid,
      resize = "vertical",
      className,
      style,
      disabled,
      readOnly,
      value,
      defaultValue,
      id,
      required,
      "aria-invalid": ariaInvalid,
      "aria-labelledby": ariaLabelledBy,
      "aria-describedby": ariaDescribedBy,
      slotProps,
      ...nativeProps
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
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const filledState = useControlValueState({
      controlRef: textareaRef,
      value: value === undefined ? undefined : hasMiaixzControlValue(value),
      defaultValue: hasMiaixzControlValue(defaultValue),
      read: (control) => hasMiaixzControlValue(control.value),
    });
    const ownerState: TextareaOwnerState = {
      size,
      resize,
      invalid: effectiveInvalid,
      disabled: effectiveDisabled,
      readOnly: readOnly === true,
      filled: filledState.value,
    };
    const rootProps = mergeMiaixzSlotProps<
      TextareaOwnerState,
      TextareaRootAttributes,
      HTMLSpanElement
    >({
      ownerState,
      defaultProps: { className: `miaixz-control miaixz-textarea-frame miaixz-control-${size}` },
      componentProps: {
        ...(className === undefined ? {} : { className }),
        ...(style === undefined ? {} : { style }),
      },
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
    const textareaProps = mergeMiaixzSlotProps<
      TextareaOwnerState,
      TextareaControlAttributes,
      HTMLTextAreaElement
    >({
      ownerState,
      defaultProps: { className: `miaixz-textarea miaixz-textarea-${size}` },
      componentProps: {
        ...nativeProps,
        ...(value === undefined ? {} : { value }),
        ...(defaultValue === undefined ? {} : { defaultValue }),
      },
      slotProps: slotProps?.textarea,
      internalRef: textareaRef,
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
        "data-resize": resize,
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
        "data-resize",
      ],
    });
    return (
      <span {...rootProps}>
        <textarea {...textareaProps} />
      </span>
    );
  }),
);

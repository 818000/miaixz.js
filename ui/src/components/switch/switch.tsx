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
import { useFieldControl } from "../../shared/field-context.js";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import { useChoiceControlState } from "../../shared/use-choice-control-state.js";
import type { SwitchOwnerState, SwitchProps, SwitchRootAttributes } from "./switch.types.js";
import { withMiaixzThemeComponent } from "../../theme/themed-component.js";

/**
 * Renders an accessible native boolean switch with fixed semantic slots.
 *
 * @public
 */
export const Switch = withMiaixzThemeComponent(
  "Switch",
  forwardRef<HTMLInputElement, SwitchProps>(function Switch(props, ref) {
    const {
      label,
      size = "medium",
      description,
      invalid,
      className,
      style,
      disabled,
      checked,
      defaultChecked,
      onChange,
      "aria-invalid": ariaInvalid,
      "aria-labelledby": ariaLabelledBy,
      "aria-describedby": ariaDescribedBy,
      id,
      required,
      slotProps,
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
    const ownerState: SwitchOwnerState = {
      size,
      checked: checkedState.value,
      disabled: effectiveDisabled,
      invalid: effectiveInvalid,
    };
    const rootProps = mergeMiaixzSlotProps<
      SwitchOwnerState,
      SwitchRootAttributes,
      HTMLLabelElement
    >({
      ownerState,
      defaultProps: {
        className: classNames(
          "miaixz-switch",
          size === "small" && "miaixz-switch-small",
          effectiveDisabled && "miaixz-switch-disabled",
          effectiveInvalid && "miaixz-switch-invalid",
        ),
      },
      componentProps: {
        ...(className === undefined ? {} : { className }),
        ...(style === undefined ? {} : { style }),
      },
      slotProps: slotProps?.root,
      internalProps: {
        "data-size": size,
        ...(effectiveDisabled ? { "data-disabled": true } : {}),
        ...(checkedState.value ? { "data-filled": true } : {}),
        ...(effectiveInvalid ? { "data-invalid": true } : {}),
      },
      ownedProps: ["data-size", "data-disabled", "data-filled", "data-invalid"],
    });
    const inputProps = mergeMiaixzSlotProps({
      ownerState,
      defaultProps: { className: "miaixz-switch-input" },
      componentProps: { ...nativeProps, ...(onChange === undefined ? {} : { onChange }) },
      slotProps: slotProps?.input,
      internalRef: inputRef,
      forwardedRef: ref,
      internalProps: {
        ...(fieldProps.id === undefined ? {} : { id: fieldProps.id }),
        type: "checkbox",
        role: "switch",
        disabled: effectiveDisabled,
        ...(fieldProps.required === undefined ? {} : { required: fieldProps.required }),
        ...(checked === undefined ? {} : { checked }),
        ...(defaultChecked === undefined ? {} : { defaultChecked }),
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
        "role",
        "disabled",
        "required",
        "checked",
        "defaultChecked",
        "aria-invalid",
        "aria-labelledby",
        "aria-describedby",
      ],
    });
    const trackProps = mergeMiaixzSlotProps({
      ownerState,
      defaultProps: { className: "miaixz-switch-track" },
      slotProps: slotProps?.track,
      internalProps: { "aria-hidden": true },
      ownedProps: ["aria-hidden"],
    });
    const thumbProps = mergeMiaixzSlotProps({
      ownerState,
      defaultProps: { className: "miaixz-switch-thumb" },
      slotProps: slotProps?.thumb,
    });
    const contentProps = mergeMiaixzSlotProps({
      ownerState,
      defaultProps: { className: "miaixz-switch-content" },
      slotProps: slotProps?.content,
    });
    const labelProps = mergeMiaixzSlotProps({
      ownerState,
      defaultProps: { className: "miaixz-switch-label" },
      slotProps: slotProps?.label,
    });
    const descriptionProps = mergeMiaixzSlotProps({
      ownerState,
      defaultProps: { className: "miaixz-switch-description" },
      slotProps: slotProps?.description,
    });
    return (
      <label {...rootProps}>
        <input {...inputProps} />
        <span {...trackProps}>
          <span {...thumbProps} />
        </span>
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

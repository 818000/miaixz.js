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

import { forwardRef, useEffect, useRef } from "react";

import { classNames } from "../../shared/class-names.js";
import { useFieldControl } from "../../shared/field-context.js";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import { useChoiceControlState } from "../../shared/use-choice-control-state.js";
import type { RadioOwnerState, RadioProps, RadioRootAttributes } from "./radio.types.js";
import { withMiaixzThemeComponent } from "../../theme/themed-component.js";

/**
 * Renders a labeled native radio control with fixed semantic slots.
 *
 * @public
 */
export const Radio = withMiaixzThemeComponent(
  "Radio",
  forwardRef<HTMLInputElement, RadioProps>(function Radio(props, ref) {
    const {
      label,
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
    const ownerState: RadioOwnerState = {
      checked: checkedState.value,
      disabled: effectiveDisabled,
      invalid: effectiveInvalid,
    };
    useEffect(() => {
      const input = inputRef.current;
      if (checked !== undefined || input === null) return undefined;
      const root = input.form ?? input.ownerDocument;
      const synchronizeGroup = (event: Event) => {
        const target = event.target;
        if (
          target instanceof HTMLInputElement &&
          target.type === "radio" &&
          target.name === input.name
        ) {
          queueMicrotask(checkedState.sync);
        }
      };
      root.addEventListener("input", synchronizeGroup, true);
      root.addEventListener("change", synchronizeGroup, true);
      return () => {
        root.removeEventListener("input", synchronizeGroup, true);
        root.removeEventListener("change", synchronizeGroup, true);
      };
    }, [checked, checkedState.sync]);

    const rootProps = mergeMiaixzSlotProps<RadioOwnerState, RadioRootAttributes, HTMLLabelElement>({
      ownerState,
      defaultProps: {
        className: classNames(
          "miaixz-choice",
          "miaixz-radio",
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
        ...(checkedState.value ? { "data-filled": true } : {}),
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
        type: "radio",
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
        "disabled",
        "required",
        "checked",
        "defaultChecked",
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

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

import { forwardRef, useState, type CSSProperties } from "react";

import { useFieldControl } from "../../shared/field-context.js";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import { withMiaixzThemeComponent } from "../../theme/binding.js";
import type { SliderOwnerState, SliderProps, SliderRootAttributes } from "./slider.types.js";

interface SliderMarkStyle extends CSSProperties {
  readonly "--miaixz-slider-mark-position": string;
}

/**
 * Renders a branded native range control with optional output and marks.
 */
export const Slider = withMiaixzThemeComponent(
  "Slider",
  forwardRef<HTMLInputElement, SliderProps>(function Slider(props, ref) {
    const {
      disabled,
      invalid,
      id,
      required,
      readOnly = false,
      orientation = "horizontal",
      showValue = false,
      formatValue = String,
      getValueText = String,
      marks = [],
      value,
      defaultValue,
      onChange,
      slotProps,
      "aria-invalid": ariaInvalid,
      "aria-labelledby": ariaLabelledBy,
      "aria-describedby": ariaDescribedBy,
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
    const minimum = Number(props.min ?? 0);
    const maximum = Number(props.max ?? 100);
    const initialValue = defaultValue ?? minimum;
    const [uncontrolledValue, setUncontrolledValue] = useState(initialValue);
    const currentValue = value ?? uncontrolledValue;
    const effectiveDisabled = fieldProps.disabled ?? false;
    const effectiveInvalid = fieldProps.invalid ?? false;
    const ownerState: SliderOwnerState = {
      disabled: effectiveDisabled,
      invalid: effectiveInvalid,
      readOnly,
      orientation,
      showValue,
    };
    const visibleMarks = marks.filter((mark) => mark.value >= minimum && mark.value <= maximum);
    const rootProps = mergeMiaixzSlotProps<
      SliderOwnerState,
      SliderRootAttributes,
      HTMLInputElement
    >({
      ownerState,
      defaultProps: { className: "miaixz-slider" },
      componentProps: nativeProps,
      slotProps: slotProps?.root,
      forwardedRef: ref,
      internalProps: {
        ...(fieldProps.id === undefined ? {} : { id: fieldProps.id }),
        type: "range",
        value: currentValue,
        disabled: effectiveDisabled,
        ...(fieldProps.required === undefined ? {} : { required: fieldProps.required }),
        ...(effectiveInvalid ? { "aria-invalid": true } : {}),
        "aria-readonly": readOnly,
        "aria-valuetext": getValueText(currentValue),
        ...(fieldProps["aria-labelledby"] === undefined
          ? {}
          : { "aria-labelledby": fieldProps["aria-labelledby"] }),
        ...(fieldProps["aria-describedby"] === undefined
          ? {}
          : { "aria-describedby": fieldProps["aria-describedby"] }),
        "data-ui": "slider",
        "data-orientation": orientation,
        ...(effectiveDisabled ? { "data-disabled": true } : {}),
        ...(effectiveInvalid ? { "data-invalid": true } : {}),
        ...(readOnly ? { "data-readonly": true } : {}),
        onChange: (event) => {
          if (readOnly) return;
          if (value === undefined) setUncontrolledValue(event.currentTarget.valueAsNumber);
          onChange?.(event);
        },
        onKeyDown: (event) => {
          nativeProps.onKeyDown?.(event);
          if (readOnly) event.preventDefault();
        },
        onPointerDown: (event) => {
          nativeProps.onPointerDown?.(event);
          if (readOnly) event.preventDefault();
        },
      },
      ownedProps: [
        "id",
        "type",
        "value",
        "disabled",
        "required",
        "aria-invalid",
        "aria-readonly",
        "aria-valuetext",
        "aria-labelledby",
        "aria-describedby",
        "data-ui",
        "data-orientation",
        "data-disabled",
        "data-invalid",
        "data-readonly",
        "onChange",
      ],
    });
    return (
      <span className="miaixz-slider-frame" data-orientation={orientation}>
        <input {...rootProps} />
        {showValue && (
          <output
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-slider-output" },
              slotProps: slotProps?.output,
              internalProps: fieldProps.id === undefined ? {} : { htmlFor: fieldProps.id },
              ownedProps: ["htmlFor"],
            })}
          >
            {formatValue(currentValue)}
          </output>
        )}
        {visibleMarks.length > 0 && (
          <div
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-slider-marks" },
              slotProps: slotProps?.marks,
              internalProps: { "aria-hidden": true },
              ownedProps: ["aria-hidden"],
            })}
          >
            {visibleMarks.map((mark) => {
              const position =
                maximum === minimum ? 0 : ((mark.value - minimum) / (maximum - minimum)) * 100;
              const style: SliderMarkStyle = { "--miaixz-slider-mark-position": `${position}%` };
              return (
                <span
                  key={mark.value}
                  {...mergeMiaixzSlotProps({
                    ownerState,
                    defaultProps: { className: "miaixz-slider-mark" },
                    slotProps: slotProps?.mark,
                    internalProps: { style },
                    ownedProps: ["style"],
                  })}
                >
                  {mark.label !== undefined && (
                    <span
                      {...mergeMiaixzSlotProps({
                        ownerState,
                        defaultProps: { className: "miaixz-slider-mark-label" },
                        slotProps: slotProps?.markLabel,
                      })}
                    >
                      {mark.label}
                    </span>
                  )}
                </span>
              );
            })}
          </div>
        )}
      </span>
    );
  }),
);

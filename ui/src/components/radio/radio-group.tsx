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

import { MiaixzUiError } from "../../errors/ui-error.js";
import { validateMiaixzCollectionItems } from "../../shared/collection/controller.js";
import { classNames } from "../../shared/class-names.js";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import { useControlled } from "../../shared/use-controlled.js";
import { useFormReset } from "../../shared/use-form-reset.js";
import type { RadioGroupOwnerState, RadioGroupProps } from "./radio-group.types.js";
import { withMiaixzThemeComponent } from "../../theme/themed-component.js";

/**
 * Renders a native fieldset whose items are the only group-content source.
 *
 * @public
 */
export const RadioGroup = withMiaixzThemeComponent(
  "RadioGroup",
  forwardRef<HTMLFieldSetElement, RadioGroupProps>(function RadioGroup(props, ref) {
    const controlled = "value" in props;
    const {
      name,
      label,
      items,
      orientation = "vertical",
      required = false,
      invalid = false,
      disabled = false,
      value,
      defaultValue,
      onValueChange,
      className,
      slotProps,
      ...rootNativeProps
    } = props;
    validateMiaixzCollectionItems(
      items.map((item) => ({
        id: item.id,
        value: item.value,
        textValue: item.id,
        disabled: item.disabled,
      })),
    );
    const initialValue = defaultValue;
    for (const candidate of [value, defaultValue]) {
      if (candidate !== undefined && !items.some((item) => item.value === candidate)) {
        throw new MiaixzUiError({
          code: "UI_CONTROLLED_VALUE_INVALID",
        });
      }
    }
    const state = useControlled<string | undefined>({
      controlled,
      value,
      defaultValue,
      hasDefaultValue: controlled && "defaultValue" in props,
      readOnly: controlled && onValueChange === undefined,
    });
    const firstInputRef = useRef<HTMLInputElement>(null);
    useFormReset(firstInputRef, () => state.resetValue(initialValue));
    const readOnly = controlled && onValueChange === undefined;
    const ownerState: RadioGroupOwnerState = {
      orientation,
      required,
      invalid,
      disabled,
      readOnly,
    };
    const rootProps = mergeMiaixzSlotProps({
      ownerState,
      defaultProps: { className: "miaixz-radio-group" },
      componentProps: { ...rootNativeProps, ...(className === undefined ? {} : { className }) },
      slotProps: slotProps?.root,
      forwardedRef: ref,
      internalProps: { disabled },
      ownedProps: ["disabled"],
    });
    const legendProps = mergeMiaixzSlotProps({
      ownerState,
      defaultProps: { className: "miaixz-radio-group-legend" },
      slotProps: slotProps?.legend,
    });
    const itemsProps = mergeMiaixzSlotProps({
      ownerState,
      defaultProps: { className: "miaixz-radio-group-items" },
      slotProps: slotProps?.items,
      internalProps: { role: "radiogroup", "aria-orientation": orientation },
      ownedProps: ["role", "aria-orientation"],
    });
    return (
      <fieldset {...rootProps}>
        <legend {...legendProps}>{label}</legend>
        <div {...itemsProps}>
          {items.map((item, index) => {
            const itemDisabled = disabled || readOnly || item.disabled === true;
            const itemProps = mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-choice miaixz-radio" },
              slotProps: slotProps?.item,
            });
            const controlProps = mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-choice-input" },
              slotProps: slotProps?.control,
              internalRef: index === 0 ? firstInputRef : undefined,
              internalProps: {
                id: item.id,
                name,
                type: "radio",
                value: item.value,
                checked: state.value === item.value,
                disabled: itemDisabled,
                required,
                ...(invalid ? { "aria-invalid": true } : {}),
                onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
                  state.setValue(item.value);
                  onValueChange?.(item.value, event);
                },
              },
              ownedProps: [
                "id",
                "name",
                "type",
                "value",
                "checked",
                "disabled",
                "required",
                "aria-invalid",
              ],
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
              <label key={item.id} {...itemProps}>
                <input {...controlProps} />
                <span className="miaixz-choice-mark" aria-hidden="true" />
                <span className="miaixz-choice-content">
                  <span {...labelProps}>{item.label}</span>
                  {item.description !== undefined && (
                    <span {...descriptionProps}>{item.description}</span>
                  )}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
    );
  }),
);

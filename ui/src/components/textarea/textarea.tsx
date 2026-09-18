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

import { forwardRef, useCallback, useEffect, useRef, useState } from "react";

import { MiaixzUiError } from "../../errors/ui-error.js";
import { hasMiaixzControlValue } from "../../shared/control-state.js";
import { useFieldControl } from "../../shared/field-context.js";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import { useMiaixzLayoutEffect } from "../../shared/use-client-layout-effect.js";
import { useControlValueState } from "../../shared/use-control-value-state.js";
import type {
  TextareaOwnerState,
  TextareaProps,
  TextareaRootAttributes,
  TextareaControlAttributes,
} from "./textarea.types.js";
import { withMiaixzThemeComponent } from "../../theme/binding.js";

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
      autoResize = false,
      minRows = 2,
      maxRows,
      showCount = false,
      formatCount,
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
    if (
      autoResize &&
      (!Number.isInteger(minRows) ||
        minRows <= 0 ||
        (maxRows !== undefined &&
          (!Number.isInteger(maxRows) || maxRows <= 0 || minRows > maxRows)))
    ) {
      throw new MiaixzUiError({ code: "UI_TEXTAREA_ROWS_INVALID" });
    }
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
    const [uncontrolledLength, setUncontrolledLength] = useState(
      () => String(defaultValue ?? "").length,
    );
    const currentLength = value === undefined ? uncontrolledLength : String(value).length;
    const filledState = useControlValueState({
      controlRef: textareaRef,
      value: value === undefined ? undefined : hasMiaixzControlValue(value),
      defaultValue: hasMiaixzControlValue(defaultValue),
      read: (control) => hasMiaixzControlValue(control.value),
    });
    const ownerState: TextareaOwnerState = {
      size,
      resize: autoResize ? "none" : resize,
      invalid: effectiveInvalid,
      disabled: effectiveDisabled,
      readOnly: readOnly === true,
      filled: filledState.value,
      autoResize,
      showCount,
    };
    const measure = useCallback(() => {
      const control = textareaRef.current;
      if (!autoResize || control === null) return;
      const computed = window.getComputedStyle(control);
      const lineHeight =
        Number.parseFloat(computed.lineHeight) || Number.parseFloat(computed.fontSize) * 1.2;
      const verticalChrome =
        Number.parseFloat(computed.paddingTop) +
        Number.parseFloat(computed.paddingBottom) +
        Number.parseFloat(computed.borderTopWidth) +
        Number.parseFloat(computed.borderBottomWidth);
      const minimumHeight = lineHeight * minRows + verticalChrome;
      const maximumHeight =
        maxRows === undefined ? Number.POSITIVE_INFINITY : lineHeight * maxRows + verticalChrome;
      control.style.height = "auto";
      const nextHeight = Math.min(maximumHeight, Math.max(minimumHeight, control.scrollHeight));
      control.style.height = `${nextHeight}px`;
      control.style.overflowY = control.scrollHeight > maximumHeight ? "auto" : "hidden";
    }, [autoResize, maxRows, minRows]);
    useMiaixzLayoutEffect(measure, [currentLength, measure, value]);
    useEffect(() => {
      if (!autoResize) return;
      const control = textareaRef.current;
      if (control === null) return;
      const observer =
        typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(measure);
      observer?.observe(control);
      if (observer === undefined) window.addEventListener("resize", measure);
      void document.fonts?.ready.then(measure);
      return () => {
        observer?.disconnect();
        window.removeEventListener("resize", measure);
      };
    }, [autoResize, measure]);
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
        "data-resize": autoResize ? "none" : resize,
        onChange: (event) => {
          filledState.sync();
          if (value === undefined) setUncontrolledLength(event.currentTarget.value.length);
          measure();
        },
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
        {showCount && (
          <output
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-textarea-count" },
              slotProps: slotProps?.count,
              internalProps: fieldProps.id === undefined ? {} : { htmlFor: fieldProps.id },
              ownedProps: ["htmlFor"],
            })}
          >
            {formatCount?.(currentLength, nativeProps.maxLength) ??
              (nativeProps.maxLength === undefined
                ? String(currentLength)
                : `${currentLength} / ${nativeProps.maxLength}`)}
          </output>
        )}
      </span>
    );
  }),
);

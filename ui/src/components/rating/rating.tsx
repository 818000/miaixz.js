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

import { forwardRef, useEffect, useRef, useState } from "react";

import { MiaixzUiError } from "../../errors/ui-error.js";
import { useMiaixzLocale } from "../../i18n/i18n.js";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import { useMergedRef } from "../../shared/use-merged-ref.js";
import { withMiaixzThemeComponent } from "../../theme/binding.js";
import { Icon } from "../icon/icon.js";
import type { RatingOwnerState, RatingProps, RatingRootAttributes } from "./rating.types.js";

/**
 * Renders a native-radio rating field with whole or half-star precision.
 */
export const Rating = withMiaixzThemeComponent(
  "Rating",
  forwardRef<HTMLDivElement, RatingProps>(function Rating(
    {
      value,
      defaultValue = null,
      onValueChange,
      max = 5,
      precision = 1,
      size = "medium",
      name,
      required = false,
      disabled = false,
      readOnly = false,
      allowClear = true,
      getLabelText,
      slotProps,
      ...labelProps
    },
    forwardedRef,
  ) {
    if (!Number.isInteger(max) || max < 1 || max > 10) {
      throw new MiaixzUiError({ code: "UI_RATING_MAX_INVALID" });
    }
    if (precision !== 1 && precision !== 0.5) {
      throw new MiaixzUiError({ code: "UI_RATING_PRECISION_INVALID" });
    }
    const validateValue = (candidate: number | null | undefined) =>
      candidate === undefined ||
      candidate === null ||
      (Number.isFinite(candidate) &&
        candidate >= precision &&
        candidate <= max &&
        Math.abs(candidate / precision - Math.round(candidate / precision)) < Number.EPSILON);
    if (!validateValue(value) || !validateValue(defaultValue)) {
      throw new MiaixzUiError({ code: "UI_RATING_VALUE_INVALID" });
    }
    const [uncontrolledValue, setUncontrolledValue] = useState<number | null>(defaultValue);
    const [preview, setPreview] = useState<number | null>(null);
    const rootRef = useRef<HTMLDivElement | null>(null);
    const inputRefs = useRef(new Map<number, HTMLInputElement>());
    const mergedRef = useMergedRef(forwardedRef, rootRef);
    const resolvedValue = value ?? uncontrolledValue;
    const visibleValue = preview ?? resolvedValue ?? 0;
    const { t } = useMiaixzLocale();
    const labelFor =
      getLabelText ??
      ((next: number, total: number) => t("ui.rating.value", { value: next, max: total }));
    const ownerState: RatingOwnerState = { max, precision, size, disabled, readOnly };
    const commit = (next: number | null) => {
      if (disabled || readOnly || (required && next === null)) return;
      if (value === undefined) setUncontrolledValue(next);
      onValueChange?.(next);
    };
    const values = Array.from({ length: max / precision }, (_, index) => (index + 1) * precision);
    useEffect(() => {
      if (value !== undefined) return undefined;
      const form = rootRef.current?.closest("form");
      if (form === undefined || form === null) return undefined;
      const reset = () => {
        setUncontrolledValue(defaultValue);
        setPreview(null);
      };
      form.addEventListener("reset", reset);
      return () => form.removeEventListener("reset", reset);
    }, [defaultValue, value]);
    const focusValue = (next: number) => {
      inputRefs.current.get(next)?.focus();
    };
    const move = (current: number, amount: number) => {
      const index = values.indexOf(current);
      const next = values[Math.min(values.length - 1, Math.max(0, index + amount))];
      if (next === undefined) return;
      commit(next);
      focusValue(next);
    };
    return (
      <div
        {...mergeMiaixzSlotProps<RatingOwnerState, RatingRootAttributes, HTMLDivElement>({
          ownerState,
          defaultProps: { className: "miaixz-rating" },
          componentProps: labelProps,
          slotProps: slotProps?.root,
          forwardedRef: mergedRef,
          internalProps: {
            role: "radiogroup",
            "aria-readonly": readOnly || undefined,
            "data-ui": "rating",
            "data-size": size,
          },
          ownedProps: ["role", "aria-readonly", "data-ui", "data-size"],
        })}
        onMouseLeave={() => setPreview(null)}
      >
        {Array.from({ length: max }, (_, index) => {
          const star = index + 1;
          const fill =
            visibleValue >= star ? "full" : visibleValue >= star - 0.5 ? "half" : "empty";
          const options = precision === 0.5 ? [star - 0.5, star] : [star];
          return (
            <span className="miaixz-rating-star" data-fill={fill} key={star}>
              <span
                {...mergeMiaixzSlotProps({
                  ownerState,
                  defaultProps: { className: "miaixz-rating-icon" },
                  slotProps: slotProps?.icon,
                })}
                aria-hidden="true"
              >
                <Icon name="Star" size="feature" />
              </span>
              <span className="miaixz-rating-fill" aria-hidden="true">
                <Icon name={fill === "half" ? "StarHalf" : "Star"} size="feature" />
              </span>
              {options.map((option) => (
                <label
                  key={option}
                  {...mergeMiaixzSlotProps({
                    ownerState,
                    defaultProps: { className: "miaixz-rating-item" },
                    slotProps: slotProps?.item,
                  })}
                  data-half={(precision === 0.5 && option % 1 !== 0) || undefined}
                  onMouseEnter={() => !disabled && setPreview(option)}
                >
                  <input
                    {...mergeMiaixzSlotProps({
                      ownerState,
                      defaultProps: { className: "miaixz-rating-input" },
                      slotProps: slotProps?.input,
                    })}
                    ref={(node) => {
                      if (node === null) inputRefs.current.delete(option);
                      else inputRefs.current.set(option, node);
                    }}
                    type="radio"
                    name={name}
                    value={option}
                    checked={resolvedValue === option}
                    required={required}
                    disabled={disabled}
                    aria-label={labelFor(option, max)}
                    onBlur={() => setPreview(null)}
                    onFocus={() => setPreview(option)}
                    onChange={() => commit(option)}
                    onClick={(event) => {
                      if (resolvedValue === option && allowClear && !required) {
                        event.preventDefault();
                        commit(null);
                      }
                    }}
                    onKeyDown={(event) => {
                      if (disabled || readOnly) {
                        event.preventDefault();
                        return;
                      }
                      if ((event.key === "Delete" || event.key === "Backspace") && allowClear) {
                        event.preventDefault();
                        commit(null);
                      }
                      if (event.key === "Home") {
                        event.preventDefault();
                        commit(precision);
                        focusValue(precision);
                      }
                      if (event.key === "End") {
                        event.preventDefault();
                        commit(max);
                        focusValue(max);
                      }
                      const rtl =
                        event.currentTarget.closest("[dir=rtl]") !== null ||
                        document.documentElement.dir === "rtl";
                      if (event.key === "ArrowLeft") {
                        event.preventDefault();
                        move(option, rtl ? 1 : -1);
                      }
                      if (event.key === "ArrowRight") {
                        event.preventDefault();
                        move(option, rtl ? -1 : 1);
                      }
                      if (event.key === "ArrowDown") {
                        event.preventDefault();
                        move(option, -1);
                      }
                      if (event.key === "ArrowUp") {
                        event.preventDefault();
                        move(option, 1);
                      }
                    }}
                  />
                </label>
              ))}
            </span>
          );
        })}
        {resolvedValue === null && <span className="miaixz-hidden">{t("ui.rating.empty")}</span>}
      </div>
    );
  }),
);

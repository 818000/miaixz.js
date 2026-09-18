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

import { useMiaixzLocale } from "../../i18n/i18n.js";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import { withMiaixzThemeComponent } from "../../theme/binding.js";
import { Input } from "./input.js";
import {
  clampNumberInput,
  formatNumberInput,
  numberInputIntermediateValues,
  parseNumberInput,
  roundNumberInput,
  stepNumberInput,
  validateNumberInputOptions,
} from "./number-input-model.js";
import type {
  NumberInputChangeDetails,
  NumberInputOwnerState,
  NumberInputProps,
} from "./number-input.types.js";

/**
 * Renders a locale-aware numeric text control with deterministic stepping.
 */
export const NumberInput = withMiaixzThemeComponent(
  "NumberInput",
  forwardRef<HTMLInputElement, NumberInputProps>(function NumberInput(
    {
      value,
      defaultValue = null,
      onValueChange,
      min,
      max,
      step = 1,
      precision = 0,
      disabled = false,
      readOnly = false,
      endAdornment,
      slotProps,
      className,
      onBlur,
      onKeyDown,
      onCompositionStart,
      onCompositionEnd,
      ...props
    },
    forwardedRef,
  ) {
    validateNumberInputOptions(min, max, step, precision);
    const controlled = value !== undefined;
    const initial = value ?? defaultValue;
    const [currentValue, setCurrentValue] = useState<number | null>(initial);
    const [rawValue, setRawValue] = useState(() => formatNumberInput(initial, precision));
    const inputRef = useRef<HTMLInputElement>(null);
    const composingRef = useRef(false);
    const { t } = useMiaixzLocale();
    const resolvedValue = controlled ? value : currentValue;

    useEffect(() => {
      if (controlled) setRawValue(formatNumberInput(value, precision));
    }, [controlled, precision, value]);

    useEffect(() => {
      const form = inputRef.current?.form;
      if (form === null || form === undefined) return;
      const reset = () => {
        const next = defaultValue;
        setRawValue(formatNumberInput(next, precision));
        if (!controlled) setCurrentValue(next);
        onValueChange?.(next, { reason: "reset", rawValue: formatNumberInput(next, precision) });
      };
      form.addEventListener("reset", reset);
      return () => form.removeEventListener("reset", reset);
    }, [controlled, defaultValue, onValueChange, precision]);

    const commit = (next: number | null, details: NumberInputChangeDetails) => {
      if (!controlled) setCurrentValue(next);
      onValueChange?.(next, details);
    };
    const move = (delta: number, reason: "increment" | "decrement") => {
      if (disabled || readOnly) return;
      const next = stepNumberInput(resolvedValue, delta, step, precision, min, max);
      const nextRaw = formatNumberInput(next, precision);
      setRawValue(nextRaw);
      commit(next, { reason, rawValue: nextRaw });
    };
    const canIncrement =
      !disabled &&
      !readOnly &&
      (max === undefined || resolvedValue === null || resolvedValue < max);
    const canDecrement =
      !disabled &&
      !readOnly &&
      (min === undefined || resolvedValue === null || resolvedValue > min);
    const ownerState: NumberInputOwnerState = {
      size: props.size ?? "medium",
      invalid: props.invalid === true,
      disabled,
      readOnly,
      filled: rawValue.length > 0,
      canIncrement,
      canDecrement,
    };
    const controls = (
      <span className="miaixz-number-input-controls">
        <button
          {...mergeMiaixzSlotProps({
            ownerState,
            defaultProps: { className: "miaixz-number-input-step" },
            slotProps: slotProps?.decrement,
          })}
          type="button"
          aria-label={t("ui.numberInput.decrement")}
          disabled={!canDecrement}
          onClick={() => move(-1, "decrement")}
        >
          <span aria-hidden="true">−</span>
        </button>
        <button
          {...mergeMiaixzSlotProps({
            ownerState,
            defaultProps: { className: "miaixz-number-input-step" },
            slotProps: slotProps?.increment,
          })}
          type="button"
          aria-label={t("ui.numberInput.increment")}
          disabled={!canIncrement}
          onClick={() => move(1, "increment")}
        >
          <span aria-hidden="true">+</span>
        </button>
      </span>
    );

    return (
      <Input
        {...props}
        ref={(node) => {
          inputRef.current = node;
          if (typeof forwardedRef === "function") forwardedRef(node);
          else if (forwardedRef !== null) forwardedRef.current = node;
        }}
        className={["miaixz-number-input", className].filter(Boolean).join(" ")}
        data-ui="number-input"
        type="text"
        inputMode="decimal"
        role="spinbutton"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={resolvedValue ?? undefined}
        value={rawValue}
        disabled={disabled}
        readOnly={readOnly}
        endAdornment={
          <>
            {endAdornment}
            {controls}
          </>
        }
        {...(slotProps === undefined ? {} : { slotProps })}
        onChange={(event) => {
          const nextRaw = event.currentTarget.value;
          if (composingRef.current) {
            setRawValue(nextRaw);
            return;
          }
          const parsed = parseNumberInput(nextRaw);
          if (parsed === undefined && !numberInputIntermediateValues.has(nextRaw)) return;
          setRawValue(nextRaw);
          if (parsed !== undefined) commit(parsed, { reason: "input", rawValue: nextRaw });
        }}
        onBlur={(event) => {
          const parsed = parseNumberInput(rawValue);
          if (typeof parsed === "number") {
            const next = roundNumberInput(clampNumberInput(parsed, min, max), precision);
            const nextRaw = formatNumberInput(next, precision);
            setRawValue(nextRaw);
            commit(next, { reason: "blur", rawValue: nextRaw });
          } else if (rawValue !== "") {
            setRawValue(formatNumberInput(resolvedValue, precision));
          }
          onBlur?.(event);
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;
          let delta: number | undefined;
          if (event.key === "ArrowUp") delta = 1;
          if (event.key === "ArrowDown") delta = -1;
          if (event.key === "PageUp") delta = 10;
          if (event.key === "PageDown") delta = -10;
          if (event.key === "Home" && min !== undefined) {
            event.preventDefault();
            const nextRaw = formatNumberInput(min, precision);
            setRawValue(nextRaw);
            commit(min, { reason: "decrement", rawValue: nextRaw });
            return;
          }
          if (event.key === "End" && max !== undefined) {
            event.preventDefault();
            const nextRaw = formatNumberInput(max, precision);
            setRawValue(nextRaw);
            commit(max, { reason: "increment", rawValue: nextRaw });
            return;
          }
          if (delta !== undefined) {
            event.preventDefault();
            move(delta, delta > 0 ? "increment" : "decrement");
          }
        }}
        onCompositionStart={(event) => {
          composingRef.current = true;
          onCompositionStart?.(event);
        }}
        onCompositionEnd={(event) => {
          composingRef.current = false;
          const nextRaw = event.currentTarget.value;
          const parsed = parseNumberInput(nextRaw);
          if (parsed !== undefined) commit(parsed, { reason: "input", rawValue: nextRaw });
          onCompositionEnd?.(event);
        }}
      />
    );
  }),
);

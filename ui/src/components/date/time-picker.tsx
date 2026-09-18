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

import { forwardRef, useEffect, useMemo, useState } from "react";

import { MiaixzUiError } from "../../errors/ui-error.js";
import { useMiaixzLocale } from "../../i18n/i18n.js";
import { useMedia } from "../../shared/responsive/use-media.js";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import { withMiaixzThemeComponent } from "../../theme/binding.js";
import { Dialog } from "../dialog/dialog.js";
import { Icon } from "../icon/icon.js";
import { Input } from "../input/input.js";
import { Popover } from "../popover/popover.js";
import { formatIsoTime, parseIsoTime, stepIsoTime } from "./date-model.js";
import type { IsoTime } from "./date.types.js";
import type { TimePickerOwnerState, TimePickerProps } from "./time-picker.types.js";

/**
 * Converts valid wall time to seconds since midnight.
 *
 * @param value - Candidate ISO wall time.
 * @param includeSeconds - Whether seconds are required.
 * @returns Seconds since midnight, or `null` for invalid input.
 */
function secondsOf(value: IsoTime, includeSeconds: boolean): number | null {
  const parts = parseIsoTime(value, includeSeconds);
  return parts === null ? null : parts.hour * 3600 + parts.minute * 60 + parts.second;
}

/**
 * Renders a strict 24-hour wall-time picker.
 */
export const TimePicker = withMiaixzThemeComponent(
  "TimePicker",
  forwardRef<HTMLInputElement, TimePickerProps>(function TimePicker(
    {
      value,
      defaultValue = null,
      onValueChange,
      open,
      defaultOpen = false,
      onOpenChange,
      includeSeconds = false,
      min,
      max,
      step = 900,
      name,
      required = false,
      clearable = true,
      disabled = false,
      readOnly = false,
      slotProps,
      ...labelProps
    },
    forwardedRef,
  ) {
    if (!Number.isInteger(step) || step <= 0 || (!includeSeconds && step % 60 !== 0)) {
      throw new MiaixzUiError({ code: "UI_TIME_PICKER_STEP_INVALID" });
    }
    const resolvedMin = min ?? (includeSeconds ? "00:00:00" : "00:00");
    const resolvedMax = max ?? (includeSeconds ? "23:59:59" : "23:59");
    const minSeconds = secondsOf(resolvedMin, includeSeconds);
    const maxSeconds = secondsOf(resolvedMax, includeSeconds);
    if (minSeconds === null || maxSeconds === null || minSeconds > maxSeconds) {
      throw new MiaixzUiError({ code: "UI_TIME_PICKER_RANGE_INVALID" });
    }
    const [uncontrolledValue, setUncontrolledValue] = useState<IsoTime | null>(defaultValue);
    const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
    const resolvedValue = value ?? uncontrolledValue;
    const resolvedOpen = open ?? uncontrolledOpen;
    const [rawValue, setRawValue] = useState(resolvedValue ?? "");
    const [invalid, setInvalid] = useState(false);
    const coarsePointer = useMedia("(pointer: coarse)");
    const { t } = useMiaixzLocale();
    useEffect(() => setRawValue(resolvedValue ?? ""), [resolvedValue]);
    const setOpen = (next: boolean) => {
      if (open === undefined) setUncontrolledOpen(next);
      onOpenChange?.(next);
    };
    const commit = (next: IsoTime | null) => {
      if (value === undefined) setUncontrolledValue(next);
      setRawValue(next ?? "");
      setInvalid(false);
      onValueChange?.(next);
    };
    const isValid = (candidate: IsoTime) => {
      const seconds = secondsOf(candidate, includeSeconds);
      return (
        seconds !== null &&
        seconds >= minSeconds &&
        seconds <= maxSeconds &&
        (seconds - minSeconds) % step === 0
      );
    };
    const commitRaw = () => {
      if (rawValue === "" && !required) {
        commit(null);
        return;
      }
      if (!isValid(rawValue)) setInvalid(true);
      else commit(rawValue);
    };
    const options = useMemo(() => {
      const values: IsoTime[] = [];
      for (let seconds = minSeconds; seconds <= maxSeconds; seconds += step) {
        values.push(
          formatIsoTime(
            {
              hour: Math.floor(seconds / 3600),
              minute: Math.floor((seconds % 3600) / 60),
              second: seconds % 60,
            },
            includeSeconds,
          ),
        );
      }
      return values;
    }, [includeSeconds, maxSeconds, minSeconds, step]);
    const ownerState: TimePickerOwnerState = { open: resolvedOpen, invalid, disabled, readOnly };
    const inputSlot =
      typeof slotProps?.input === "function" ? slotProps.input(ownerState) : slotProps?.input;
    const optionsView = (
      <div className="miaixz-time-picker-options">
        {options.map((option) => (
          <button
            key={option}
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-time-picker-option" },
              slotProps: slotProps?.option,
            })}
            type="button"
            aria-pressed={resolvedValue === option}
            onClick={() => {
              commit(option);
              setOpen(false);
            }}
          >
            {option}
          </button>
        ))}
      </div>
    );
    const trigger = (
      <button
        {...mergeMiaixzSlotProps({
          ownerState,
          defaultProps: { className: "miaixz-time-picker-trigger" },
          slotProps: slotProps?.trigger,
        })}
        type="button"
        aria-label={t("ui.time.open")}
        disabled={disabled || readOnly}
        onClick={coarsePointer ? () => setOpen(true) : undefined}
      >
        <Icon name="Clock" size="control" />
      </button>
    );
    const adornment = (
      <>
        {clearable && !required && resolvedValue !== null && !readOnly && (
          <button
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-time-picker-clear" },
              slotProps: slotProps?.clear,
            })}
            type="button"
            aria-label={t("ui.time.clear")}
            disabled={disabled}
            onClick={() => commit(null)}
          >
            <Icon name="X" size="indicator" />
          </button>
        )}
        {coarsePointer ? (
          trigger
        ) : (
          <Popover
            open={resolvedOpen}
            onOpenChange={(next) => setOpen(next)}
            popupRole="listbox"
            trigger={trigger}
          >
            {optionsView}
          </Popover>
        )}
      </>
    );
    return (
      <span
        {...mergeMiaixzSlotProps({
          ownerState,
          defaultProps: { className: "miaixz-time-picker" },
          slotProps: slotProps?.root,
          internalProps: { "data-ui": "time-picker" },
          ownedProps: ["data-ui"],
        })}
      >
        <Input
          {...labelProps}
          ref={forwardedRef}
          value={rawValue}
          required={required}
          disabled={disabled}
          readOnly={readOnly}
          invalid={invalid}
          endAdornment={adornment}
          {...(inputSlot === undefined ? {} : { slotProps: { input: inputSlot } })}
          onChange={(event) => {
            setRawValue(event.currentTarget.value);
            setInvalid(false);
          }}
          onBlur={commitRaw}
          onKeyDown={(event) => {
            if (event.key === "Enter") commitRaw();
            if (event.key === "Escape") {
              setRawValue(resolvedValue ?? "");
              setInvalid(false);
              setOpen(false);
            }
            if ((event.key === "ArrowUp" || event.key === "ArrowDown") && resolvedValue !== null) {
              event.preventDefault();
              commit(
                stepIsoTime(
                  resolvedValue,
                  event.key === "ArrowUp" ? step : -step,
                  resolvedMin,
                  resolvedMax,
                ),
              );
            }
          }}
        />
        {name !== undefined && <input type="hidden" name={name} value={resolvedValue ?? ""} />}
        {coarsePointer && (
          <Dialog
            open={resolvedOpen}
            onOpenChange={(next) => setOpen(next)}
            title={t("ui.time.select")}
          >
            {optionsView}
          </Dialog>
        )}
      </span>
    );
  }),
);

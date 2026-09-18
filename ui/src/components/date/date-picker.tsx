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

import { forwardRef, useEffect, useState } from "react";

import { useMiaixzLocale } from "../../i18n/i18n.js";
import { useMedia } from "../../shared/responsive/use-media.js";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import { withMiaixzThemeComponent } from "../../theme/binding.js";
import { Dialog } from "../dialog/dialog.js";
import { Icon } from "../icon/icon.js";
import { Input } from "../input/input.js";
import { Popover } from "../popover/popover.js";
import { Calendar } from "./calendar.js";
import { isIsoDateInRange, parseIsoDate } from "./date-model.js";
import type { DatePickerOwnerState, DatePickerProps } from "./date-picker.types.js";
import type { IsoDate } from "./date.types.js";

/**
 * Renders a strict ISO-date text field backed by Calendar.
 */
export const DatePicker = withMiaixzThemeComponent(
  "DatePicker",
  forwardRef<HTMLInputElement, DatePickerProps>(function DatePicker(
    {
      referenceDate,
      value,
      defaultValue = null,
      onValueChange,
      open,
      defaultOpen = false,
      onOpenChange,
      min,
      max,
      isDateDisabled,
      firstDayOfWeek = 1,
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
    const [uncontrolledValue, setUncontrolledValue] = useState<IsoDate | null>(defaultValue);
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
    const commit = (next: IsoDate | null) => {
      if (value === undefined) setUncontrolledValue(next);
      setRawValue(next ?? "");
      setInvalid(false);
      onValueChange?.(next);
    };
    const commitRaw = () => {
      if (rawValue === "" && !required) {
        commit(null);
        return;
      }
      const parsed = parseIsoDate(rawValue);
      if (
        parsed === null ||
        !isIsoDateInRange(rawValue, min, max) ||
        isDateDisabled?.(rawValue) === true
      ) {
        setInvalid(true);
        return;
      }
      commit(rawValue);
    };
    const ownerState: DatePickerOwnerState = { open: resolvedOpen, invalid, disabled, readOnly };
    const inputSlot =
      typeof slotProps?.input === "function" ? slotProps.input(ownerState) : slotProps?.input;
    const calendar = (
      <Calendar
        aria-label={t("ui.date.calendar")}
        referenceDate={referenceDate}
        value={resolvedValue}
        {...(min === undefined ? {} : { min })}
        {...(max === undefined ? {} : { max })}
        {...(isDateDisabled === undefined ? {} : { isDateDisabled })}
        firstDayOfWeek={firstDayOfWeek}
        disabled={disabled}
        readOnly={readOnly}
        onValueChange={(next) => {
          commit(next);
          setOpen(false);
        }}
      />
    );
    const calendarContent = (
      <div
        {...mergeMiaixzSlotProps({
          ownerState,
          defaultProps: { className: "miaixz-date-picker-content" },
          slotProps: slotProps?.content,
        })}
      >
        {calendar}
      </div>
    );
    const trigger = (
      <button
        {...mergeMiaixzSlotProps({
          ownerState,
          defaultProps: { className: "miaixz-date-picker-trigger" },
          slotProps: slotProps?.trigger,
        })}
        type="button"
        aria-label={t("ui.date.open")}
        disabled={disabled || readOnly}
        onClick={coarsePointer ? () => setOpen(true) : undefined}
      >
        <Icon name="CalendarDays" size="control" />
      </button>
    );
    const adornment = (
      <>
        {clearable && !required && resolvedValue !== null && !readOnly && (
          <button
            {...mergeMiaixzSlotProps({
              ownerState,
              defaultProps: { className: "miaixz-date-picker-clear" },
              slotProps: slotProps?.clear,
            })}
            type="button"
            aria-label={t("ui.date.clear")}
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
            popupRole="dialog"
            trigger={trigger}
          >
            {calendarContent}
          </Popover>
        )}
      </>
    );
    return (
      <span
        {...mergeMiaixzSlotProps({
          ownerState,
          defaultProps: { className: "miaixz-date-picker" },
          slotProps: slotProps?.root,
          internalProps: { "data-ui": "date-picker" },
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
          }}
        />
        <input type="hidden" name={name} value={resolvedValue ?? ""} />
        {coarsePointer && (
          <Dialog
            open={resolvedOpen}
            onOpenChange={(next) => setOpen(next)}
            title={t("ui.date.calendar")}
          >
            {calendarContent}
          </Dialog>
        )}
      </span>
    );
  }),
);

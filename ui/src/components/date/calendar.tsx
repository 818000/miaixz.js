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

import { forwardRef, useMemo, useRef, useState } from "react";

import { useMiaixzLocale } from "../../i18n/i18n.js";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import { withMiaixzThemeComponent } from "../../theme/binding.js";
import { Icon } from "../icon/icon.js";
import {
  addCalendarDays,
  addCalendarMonths,
  addCalendarYears,
  createCalendarMonth,
  formatIsoDate,
  isIsoDateInRange,
  parseIsoDate,
} from "./date-model.js";
import type {
  CalendarOwnerState,
  CalendarProps,
  CalendarRootAttributes,
} from "./calendar.types.js";
import type { IsoDate, IsoMonth } from "./date.types.js";

/**
 * Extracts the ISO month from a strict ISO date.
 *
 * @param date - Strict ISO calendar date.
 * @returns Strict ISO year and month.
 */
function monthOf(date: IsoDate): IsoMonth {
  return date.slice(0, 7);
}

/**
 * Renders a deterministic Gregorian month grid.
 */
export const Calendar = withMiaixzThemeComponent(
  "Calendar",
  forwardRef<HTMLDivElement, CalendarProps>(function Calendar(
    {
      referenceDate,
      value,
      defaultValue = null,
      onValueChange,
      visibleMonth,
      defaultVisibleMonth,
      onVisibleMonthChange,
      min,
      max,
      isDateDisabled,
      firstDayOfWeek = 1,
      disabled = false,
      readOnly = false,
      slotProps,
      ...labelProps
    },
    forwardedRef,
  ) {
    const initialDate = value ?? defaultValue ?? referenceDate;
    const [uncontrolledValue, setUncontrolledValue] = useState<IsoDate | null>(defaultValue);
    const [uncontrolledMonth, setUncontrolledMonth] = useState<IsoMonth>(
      defaultVisibleMonth ?? monthOf(initialDate),
    );
    const selectedValue = value ?? uncontrolledValue;
    const resolvedMonth = visibleMonth ?? uncontrolledMonth;
    const [focusedDate, setFocusedDate] = useState(initialDate);
    const buttonRefs = useRef(new Map<IsoDate, HTMLButtonElement>());
    const { locale, t } = useMiaixzLocale();
    const cells = createCalendarMonth(resolvedMonth, firstDayOfWeek);
    const ownerState: CalendarOwnerState = { disabled, readOnly };
    const formatter = useMemo(
      () => new Intl.DateTimeFormat(locale, { dateStyle: "full", timeZone: "UTC" }),
      [locale],
    );
    const monthFormatter = useMemo(
      () => new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }),
      [locale],
    );
    const weekdayFormatter = useMemo(
      () => new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" }),
      [locale],
    );
    const asDate = (date: IsoDate) => {
      const parts = parseIsoDate(date)!;
      return new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
    };
    const setMonth = (month: IsoMonth) => {
      if (visibleMonth === undefined) setUncontrolledMonth(month);
      onVisibleMonthChange?.(month);
    };
    const focusDate = (date: IsoDate) => {
      setFocusedDate(date);
      const nextMonth = monthOf(date);
      if (nextMonth !== resolvedMonth) setMonth(nextMonth);
      queueMicrotask(() => buttonRefs.current.get(date)?.focus());
    };
    const dateDisabled = (date: IsoDate) =>
      disabled || !isIsoDateInRange(date, min, max) || isDateDisabled?.(date) === true;
    const select = (date: IsoDate) => {
      if (readOnly || dateDisabled(date)) return;
      if (value === undefined) setUncontrolledValue(date);
      onValueChange?.(date);
    };
    const moveMonth = (amount: number) => {
      const next = addCalendarMonths(`${resolvedMonth}-01`, amount);
      setMonth(monthOf(next));
      focusDate(next);
    };
    const monthDate = `${resolvedMonth}-01`;
    const weekdays = Array.from({ length: 7 }, (_, index) =>
      addCalendarDays("2023-01-01", (firstDayOfWeek + index) % 7),
    );

    return (
      <div
        {...mergeMiaixzSlotProps<CalendarOwnerState, CalendarRootAttributes, HTMLDivElement>({
          ownerState,
          defaultProps: { className: "miaixz-calendar" },
          componentProps: labelProps,
          slotProps: slotProps?.root,
          forwardedRef,
          internalProps: { "data-ui": "calendar" },
          ownedProps: ["data-ui"],
        })}
      >
        <div className="miaixz-calendar-header">
          <button
            className="miaixz-calendar-navigation"
            type="button"
            disabled={disabled}
            aria-label={t("ui.date.previousMonth")}
            onClick={() => moveMonth(-1)}
          >
            <Icon name="ChevronLeft" size="control" />
          </button>
          <strong className="miaixz-calendar-month">
            {monthFormatter.format(asDate(monthDate))}
          </strong>
          <button
            className="miaixz-calendar-navigation"
            type="button"
            disabled={disabled}
            aria-label={t("ui.date.nextMonth")}
            onClick={() => moveMonth(1)}
          >
            <Icon name="ChevronRight" size="control" />
          </button>
        </div>
        <div className="miaixz-calendar-weekdays" aria-hidden="true">
          {weekdays.map((date) => (
            <span key={date}>{weekdayFormatter.format(asDate(date))}</span>
          ))}
        </div>
        <div className="miaixz-calendar-grid" role="grid">
          {cells.map((cell, index) => {
            const unavailable = dateDisabled(cell.date);
            return (
              <button
                key={cell.date}
                ref={(node) => {
                  if (node === null) buttonRefs.current.delete(cell.date);
                  else buttonRefs.current.set(cell.date, node);
                }}
                className="miaixz-calendar-day"
                type="button"
                role="gridcell"
                aria-label={formatter.format(asDate(cell.date))}
                aria-selected={selectedValue === cell.date}
                aria-disabled={unavailable || undefined}
                data-outside-month={cell.outsideMonth || undefined}
                tabIndex={cell.date === focusedDate ? 0 : -1}
                onClick={() => select(cell.date)}
                onKeyDown={(event) => {
                  let next: IsoDate | undefined;
                  if (event.key === "ArrowLeft") next = addCalendarDays(cell.date, -1);
                  if (event.key === "ArrowRight") next = addCalendarDays(cell.date, 1);
                  if (event.key === "ArrowUp") next = addCalendarDays(cell.date, -7);
                  if (event.key === "ArrowDown") next = addCalendarDays(cell.date, 7);
                  if (event.key === "Home") next = addCalendarDays(cell.date, -(index % 7));
                  if (event.key === "End") next = addCalendarDays(cell.date, 6 - (index % 7));
                  if (event.key === "PageUp")
                    next = event.shiftKey
                      ? addCalendarYears(cell.date, -1)
                      : addCalendarMonths(cell.date, -1);
                  if (event.key === "PageDown")
                    next = event.shiftKey
                      ? addCalendarYears(cell.date, 1)
                      : addCalendarMonths(cell.date, 1);
                  if (next !== undefined) {
                    event.preventDefault();
                    focusDate(next);
                  }
                  if ((event.key === "Enter" || event.key === " ") && !unavailable)
                    select(cell.date);
                }}
              >
                {cell.day}
              </button>
            );
          })}
        </div>
      </div>
    );
  }),
);

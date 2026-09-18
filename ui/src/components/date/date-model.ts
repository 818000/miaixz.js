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

import type {
  CalendarDateParts,
  CalendarMonthCell,
  CalendarTimeParts,
  IsoDate,
  IsoMonth,
  IsoTime,
} from "./date.types.js";

const datePattern = /^(\d{4})-(\d{2})-(\d{2})$/;
const timePattern = /^(\d{2}):(\d{2})(?::(\d{2}))?$/;

/**
 * Parses one strict Gregorian ISO calendar date.
 *
 * @param value - Candidate `YYYY-MM-DD` value.
 * @returns Parsed Gregorian parts, or `null` when the value is invalid.
 */
export function parseIsoDate(value: string): CalendarDateParts | null {
  const match = datePattern.exec(value);
  if (match === null) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) return null;
  return { year, month, day };
}

/**
 * Formats integer Gregorian calendar parts as `YYYY-MM-DD`.
 *
 * @param parts - Gregorian calendar parts to format.
 * @returns Strict ISO calendar date.
 */
export function formatIsoDate(parts: CalendarDateParts): IsoDate {
  return `${String(parts.year).padStart(4, "0")}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

/**
 * Returns the Gregorian day count for a year and one-based month.
 *
 * @param year - Full Gregorian year.
 * @param month - One-based Gregorian month.
 * @returns Number of days in the requested month.
 */
export function daysInMonth(year: number, month: number): number {
  if (month === 2) return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

/**
 * Adds Gregorian calendar days without time-zone conversion.
 *
 * @param value - Strict ISO calendar date.
 * @param amount - Signed number of days to add.
 * @returns Shifted strict ISO calendar date.
 */
export function addCalendarDays(value: IsoDate, amount: number): IsoDate {
  const parts = requireDate(value);
  return formatIsoDate(civilFromDays(daysFromCivil(parts) + amount));
}

/**
 * Adds Gregorian calendar months and clamps the day at month end.
 *
 * @param value - Strict ISO calendar date.
 * @param amount - Signed number of months to add.
 * @returns Shifted strict ISO calendar date.
 */
export function addCalendarMonths(value: IsoDate, amount: number): IsoDate {
  const parts = requireDate(value);
  const total = parts.year * 12 + parts.month - 1 + amount;
  const year = Math.floor(total / 12);
  const month = (((total % 12) + 12) % 12) + 1;
  return formatIsoDate({ year, month, day: Math.min(parts.day, daysInMonth(year, month)) });
}

/**
 * Adds Gregorian calendar years and clamps leap-day values.
 *
 * @param value - Strict ISO calendar date.
 * @param amount - Signed number of years to add.
 * @returns Shifted strict ISO calendar date.
 */
export function addCalendarYears(value: IsoDate, amount: number): IsoDate {
  const parts = requireDate(value);
  const year = parts.year + amount;
  return formatIsoDate({
    year,
    month: parts.month,
    day: Math.min(parts.day, daysInMonth(year, parts.month)),
  });
}

/**
 * Creates a fixed six-week month grid.
 *
 * @param month - Strict ISO year and month.
 * @param firstDayOfWeek - First weekday where Sunday is zero.
 * @returns Forty-two consecutive calendar cells.
 */
export function createCalendarMonth(
  month: IsoMonth,
  firstDayOfWeek = 1,
): readonly CalendarMonthCell[] {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (match === null) return [];
  const year = Number(match[1]);
  const monthNumber = Number(match[2]);
  if (monthNumber < 1 || monthNumber > 12) return [];
  const first = formatIsoDate({ year, month: monthNumber, day: 1 });
  const weekday = (((daysFromCivil({ year, month: monthNumber, day: 1 }) + 3) % 7) + 7) % 7;
  const offset = (weekday - firstDayOfWeek + 7) % 7;
  return Array.from({ length: 42 }, (_, index) => {
    const date = addCalendarDays(first, index - offset);
    const parts = requireDate(date);
    return { ...parts, date, outsideMonth: parts.month !== monthNumber };
  });
}

/**
 * Compares two strict ISO dates.
 *
 * @param left - Left ISO date.
 * @param right - Right ISO date.
 * @returns Negative, zero, or positive ordering value.
 */
export function compareIsoDates(left: IsoDate, right: IsoDate): number {
  return daysFromCivil(requireDate(left)) - daysFromCivil(requireDate(right));
}

/**
 * Reports whether a date is inside optional inclusive bounds.
 *
 * @param value - ISO date to test.
 * @param min - Optional inclusive lower bound.
 * @param max - Optional inclusive upper bound.
 * @returns Whether the value is inside the supplied bounds.
 */
export function isIsoDateInRange(value: IsoDate, min?: IsoDate, max?: IsoDate): boolean {
  return (
    (min === undefined || compareIsoDates(value, min) >= 0) &&
    (max === undefined || compareIsoDates(value, max) <= 0)
  );
}

/**
 * Parses strict 24-hour ISO wall time.
 *
 * @param value - Candidate wall-time value.
 * @param includeSeconds - Whether seconds are required.
 * @returns Parsed time parts, or `null` when invalid.
 */
export function parseIsoTime(
  value: string,
  includeSeconds = value.length === 8,
): CalendarTimeParts | null {
  const match = timePattern.exec(value);
  if (match === null || (includeSeconds ? match[3] === undefined : match[3] !== undefined))
    return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  const second = Number(match[3] ?? 0);
  return hour <= 23 && minute <= 59 && second <= 59 ? { hour, minute, second } : null;
}

/**
 * Formats 24-hour wall time with optional seconds.
 *
 * @param parts - Time parts to format.
 * @param includeSeconds - Whether to include seconds.
 * @returns Strict ISO wall-time value.
 */
export function formatIsoTime(parts: CalendarTimeParts, includeSeconds = false): IsoTime {
  const base = `${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`;
  return includeSeconds ? `${base}:${String(parts.second).padStart(2, "0")}` : base;
}

/**
 * Steps wall time by seconds and clamps to optional bounds.
 *
 * @param value - Strict ISO wall time.
 * @param amountSeconds - Signed seconds to add.
 * @param min - Optional inclusive lower bound.
 * @param max - Optional inclusive upper bound.
 * @returns Stepped and clamped ISO wall time.
 */
export function stepIsoTime(
  value: IsoTime,
  amountSeconds: number,
  min?: IsoTime,
  max?: IsoTime,
): IsoTime {
  const includeSeconds = value.length === 8;
  const parts = parseIsoTime(value, includeSeconds);
  if (parts === null) throw new RangeError("UI_TIME_INVALID");
  const minSeconds = min === undefined ? 0 : timeToSeconds(requireTime(min, includeSeconds));
  const maxSeconds = max === undefined ? 86_399 : timeToSeconds(requireTime(max, includeSeconds));
  const next = Math.min(maxSeconds, Math.max(minSeconds, timeToSeconds(parts) + amountSeconds));
  return formatIsoTime(
    { hour: Math.floor(next / 3600), minute: Math.floor((next % 3600) / 60), second: next % 60 },
    includeSeconds,
  );
}

/**
 * Parses a date or fails the internal invariant.
 *
 * @param value - Strict ISO date expected by the caller.
 * @returns Parsed calendar parts.
 */
function requireDate(value: IsoDate): CalendarDateParts {
  const parts = parseIsoDate(value);
  if (parts === null) throw new RangeError("UI_DATE_INVALID");
  return parts;
}

/**
 * Parses wall time or fails the internal invariant.
 *
 * @param value - Strict ISO wall time expected by the caller.
 * @param includeSeconds - Whether seconds are required.
 * @returns Parsed wall-time parts.
 */
function requireTime(value: IsoTime, includeSeconds: boolean): CalendarTimeParts {
  const parts = parseIsoTime(value, includeSeconds);
  if (parts === null) throw new RangeError("UI_TIME_INVALID");
  return parts;
}

/**
 * Converts wall-time parts to seconds since midnight.
 *
 * @param parts - Valid wall-time parts.
 * @returns Seconds since midnight.
 */
function timeToSeconds(parts: CalendarTimeParts): number {
  return parts.hour * 3600 + parts.minute * 60 + parts.second;
}

/**
 * Converts a Gregorian date to a time-zone-independent serial day.
 *
 * @param parts - Valid Gregorian calendar parts.
 * @returns Serial day on the internal civil calendar epoch.
 */
function daysFromCivil({ year: inputYear, month, day }: CalendarDateParts): number {
  const year = inputYear - (month <= 2 ? 1 : 0);
  const era = Math.floor(year / 400);
  const yearOfEra = year - era * 400;
  const monthPrime = month + (month > 2 ? -3 : 9);
  const dayOfYear = Math.floor((153 * monthPrime + 2) / 5) + day - 1;
  return (
    era * 146097 +
    yearOfEra * 365 +
    Math.floor(yearOfEra / 4) -
    Math.floor(yearOfEra / 100) +
    dayOfYear
  );
}

/**
 * Converts an internal serial day back to Gregorian parts.
 *
 * @param serial - Serial day on the internal civil calendar epoch.
 * @returns Gregorian calendar parts.
 */
function civilFromDays(serial: number): CalendarDateParts {
  const era = Math.floor(serial / 146097);
  const dayOfEra = serial - era * 146097;
  const yearOfEra = Math.floor(
    (dayOfEra -
      Math.floor(dayOfEra / 1460) +
      Math.floor(dayOfEra / 36524) -
      Math.floor(dayOfEra / 146096)) /
      365,
  );
  let year = yearOfEra + era * 400;
  const dayOfYear =
    dayOfEra - (365 * yearOfEra + Math.floor(yearOfEra / 4) - Math.floor(yearOfEra / 100));
  const monthPrime = Math.floor((5 * dayOfYear + 2) / 153);
  const day = dayOfYear - Math.floor((153 * monthPrime + 2) / 5) + 1;
  const month = monthPrime + (monthPrime < 10 ? 3 : -9);
  year += month <= 2 ? 1 : 0;
  return { year, month, day };
}

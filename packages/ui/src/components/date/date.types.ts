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

/**
 * Defines the date public type contracts.
 */

export type IsoDate = string;
/**
 * String carrying the ISO calendar month representation used by date controls.
 */
export type IsoMonth = string;
/**
 * String carrying the local clock-time representation used by time controls.
 */
export type IsoTime = string;

/**
 * Year, month, and day components of a validated calendar date.
 */
export interface CalendarDateParts {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

/**
 * Clock components extracted from a validated local time.
 */
export interface CalendarTimeParts {
  readonly hour: number;
  readonly minute: number;
  readonly second: number;
}

/**
 * Date and display state of one cell in the rendered calendar month grid.
 */
export interface CalendarMonthCell extends CalendarDateParts {
  readonly date: IsoDate;
  readonly outsideMonth: boolean;
}

/**
 * Accessible naming alternatives accepted by calendar and picker controls.
 */
export type DateControlLabel =
  | { readonly "aria-label": string; readonly "aria-labelledby"?: never }
  | { readonly "aria-label"?: never; readonly "aria-labelledby": string };

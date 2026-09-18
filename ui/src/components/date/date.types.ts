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

export type IsoDate = string;
export type IsoMonth = string;
export type IsoTime = string;

export interface CalendarDateParts {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

export interface CalendarTimeParts {
  readonly hour: number;
  readonly minute: number;
  readonly second: number;
}

export interface CalendarMonthCell extends CalendarDateParts {
  readonly date: IsoDate;
  readonly outsideMonth: boolean;
}

export type DateControlLabel =
  | { readonly "aria-label": string; readonly "aria-labelledby"?: never }
  | { readonly "aria-label"?: never; readonly "aria-labelledby": string };

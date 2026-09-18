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

import type { ButtonHTMLAttributes, HTMLAttributes, RefAttributes } from "react";

import type { MiaixzSlotProps } from "../../shared/slots.js";
import type { DateControlLabel, IsoDate, IsoMonth } from "./date.types.js";

export interface CalendarOwnerState {
  readonly disabled: boolean;
  readonly readOnly: boolean;
}

export interface CalendarRootAttributes
  extends HTMLAttributes<HTMLDivElement>, RefAttributes<HTMLDivElement> {
  readonly "data-ui"?: "calendar";
}

export interface CalendarSlotProps {
  readonly root?: MiaixzSlotProps<CalendarOwnerState, CalendarRootAttributes>;
  readonly header?: MiaixzSlotProps<CalendarOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly previous?: MiaixzSlotProps<CalendarOwnerState, ButtonHTMLAttributes<HTMLButtonElement>>;
  readonly next?: MiaixzSlotProps<CalendarOwnerState, ButtonHTMLAttributes<HTMLButtonElement>>;
  readonly monthLabel?: MiaixzSlotProps<CalendarOwnerState, HTMLAttributes<HTMLElement>>;
  readonly weekdays?: MiaixzSlotProps<CalendarOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly weekday?: MiaixzSlotProps<CalendarOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly grid?: MiaixzSlotProps<CalendarOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly day?: MiaixzSlotProps<CalendarOwnerState, ButtonHTMLAttributes<HTMLButtonElement>>;
}

export type CalendarProps = DateControlLabel & {
  readonly referenceDate: IsoDate;
  readonly value?: IsoDate | null;
  readonly defaultValue?: IsoDate | null;
  readonly onValueChange?: (value: IsoDate) => void;
  readonly visibleMonth?: IsoMonth;
  readonly defaultVisibleMonth?: IsoMonth;
  readonly onVisibleMonthChange?: (month: IsoMonth) => void;
  readonly min?: IsoDate;
  readonly max?: IsoDate;
  readonly isDateDisabled?: (date: IsoDate) => boolean;
  readonly firstDayOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  readonly disabled?: boolean;
  readonly readOnly?: boolean;
  readonly slotProps?: CalendarSlotProps;
};

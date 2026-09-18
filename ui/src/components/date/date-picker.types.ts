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

import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes } from "react";

import type { MiaixzSlotProps } from "../../shared/slots.js";
import type { DateControlLabel, IsoDate } from "./date.types.js";

export interface DatePickerOwnerState {
  readonly open: boolean;
  readonly invalid: boolean;
  readonly disabled: boolean;
  readonly readOnly: boolean;
}

export interface DatePickerSlotProps {
  readonly root?: MiaixzSlotProps<DatePickerOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly input?: MiaixzSlotProps<DatePickerOwnerState, InputHTMLAttributes<HTMLInputElement>>;
  readonly trigger?: MiaixzSlotProps<DatePickerOwnerState, ButtonHTMLAttributes<HTMLButtonElement>>;
  readonly clear?: MiaixzSlotProps<DatePickerOwnerState, ButtonHTMLAttributes<HTMLButtonElement>>;
  readonly content?: MiaixzSlotProps<DatePickerOwnerState, HTMLAttributes<HTMLDivElement>>;
}

export type DatePickerProps = DateControlLabel & {
  readonly referenceDate: IsoDate;
  readonly value?: IsoDate | null;
  readonly defaultValue?: IsoDate | null;
  readonly onValueChange?: (value: IsoDate | null) => void;
  readonly open?: boolean;
  readonly defaultOpen?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
  readonly min?: IsoDate;
  readonly max?: IsoDate;
  readonly isDateDisabled?: (date: IsoDate) => boolean;
  readonly firstDayOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  readonly name: string;
  readonly required?: boolean;
  readonly clearable?: boolean;
  readonly disabled?: boolean;
  readonly readOnly?: boolean;
  readonly slotProps?: DatePickerSlotProps;
};

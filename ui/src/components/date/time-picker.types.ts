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
import type { DateControlLabel, IsoTime } from "./date.types.js";

export interface TimePickerOwnerState {
  readonly open: boolean;
  readonly invalid: boolean;
  readonly disabled: boolean;
  readonly readOnly: boolean;
}

export interface TimePickerSlotProps {
  readonly root?: MiaixzSlotProps<TimePickerOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly input?: MiaixzSlotProps<TimePickerOwnerState, InputHTMLAttributes<HTMLInputElement>>;
  readonly trigger?: MiaixzSlotProps<TimePickerOwnerState, ButtonHTMLAttributes<HTMLButtonElement>>;
  readonly clear?: MiaixzSlotProps<TimePickerOwnerState, ButtonHTMLAttributes<HTMLButtonElement>>;
  readonly option?: MiaixzSlotProps<TimePickerOwnerState, ButtonHTMLAttributes<HTMLButtonElement>>;
}

export type TimePickerProps = DateControlLabel & {
  readonly value?: IsoTime | null;
  readonly defaultValue?: IsoTime | null;
  readonly onValueChange?: (value: IsoTime | null) => void;
  readonly open?: boolean;
  readonly defaultOpen?: boolean;
  readonly onOpenChange?: (open: boolean) => void;
  readonly includeSeconds?: boolean;
  readonly min?: IsoTime;
  readonly max?: IsoTime;
  readonly step?: number;
  readonly name?: string;
  readonly required?: boolean;
  readonly clearable?: boolean;
  readonly disabled?: boolean;
  readonly readOnly?: boolean;
  readonly slotProps?: TimePickerSlotProps;
};

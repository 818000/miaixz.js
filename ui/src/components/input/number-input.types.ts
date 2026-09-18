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

import type { ButtonHTMLAttributes } from "react";

import type { MiaixzSlotProps } from "../../shared/slots.js";
import type { InputOwnerState, InputProps, InputSlotProps } from "./input.types.js";

export interface NumberInputChangeDetails {
  readonly reason: "input" | "increment" | "decrement" | "blur" | "reset";
  readonly rawValue: string;
}

export interface NumberInputOwnerState extends InputOwnerState {
  readonly canIncrement: boolean;
  readonly canDecrement: boolean;
}

export interface NumberInputSlotProps extends InputSlotProps {
  readonly decrement?: MiaixzSlotProps<
    NumberInputOwnerState,
    ButtonHTMLAttributes<HTMLButtonElement>
  >;
  readonly increment?: MiaixzSlotProps<
    NumberInputOwnerState,
    ButtonHTMLAttributes<HTMLButtonElement>
  >;
}

export interface NumberInputProps extends Omit<
  InputProps,
  "type" | "inputMode" | "value" | "defaultValue" | "onChange" | "slotProps"
> {
  readonly value?: number | null;
  readonly defaultValue?: number | null;
  readonly onValueChange?: (value: number | null, details: NumberInputChangeDetails) => void;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly precision?: number;
  readonly slotProps?: NumberInputSlotProps;
}

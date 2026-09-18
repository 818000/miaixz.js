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
  HTMLAttributes,
  InputHTMLAttributes,
  OutputHTMLAttributes,
  ReactNode,
  RefAttributes,
} from "react";

import type { MiaixzSlotProps } from "../../shared/slots.js";

export type SliderSlot = "root" | "output" | "marks" | "mark" | "markLabel";

export interface SliderMark {
  readonly value: number;
  readonly label?: ReactNode;
}

export interface SliderOwnerState {
  readonly disabled: boolean;
  readonly invalid: boolean;
  readonly readOnly: boolean;
  readonly orientation: "horizontal" | "vertical";
  readonly showValue: boolean;
}

export interface SliderRootAttributes
  extends InputHTMLAttributes<HTMLInputElement>, RefAttributes<HTMLInputElement> {
  readonly "data-ui"?: "slider";
  readonly "data-disabled"?: boolean;
  readonly "data-invalid"?: boolean;
  readonly "data-readonly"?: boolean;
  readonly "data-orientation"?: "horizontal" | "vertical";
}

export interface SliderSlotProps {
  readonly root?: MiaixzSlotProps<SliderOwnerState, SliderRootAttributes>;
  readonly output?: MiaixzSlotProps<SliderOwnerState, OutputHTMLAttributes<HTMLOutputElement>>;
  readonly marks?: MiaixzSlotProps<SliderOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly mark?: MiaixzSlotProps<SliderOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly markLabel?: MiaixzSlotProps<SliderOwnerState, HTMLAttributes<HTMLSpanElement>>;
}

export interface SliderProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "children" | "defaultValue" | "readOnly" | "size" | "type" | "value"
> {
  readonly value?: number;
  readonly defaultValue?: number;
  readonly invalid?: boolean;
  readonly orientation?: "horizontal" | "vertical";
  readonly readOnly?: boolean;
  readonly showValue?: boolean;
  readonly formatValue?: (value: number) => ReactNode;
  readonly getValueText?: (value: number) => string;
  readonly marks?: readonly SliderMark[];
  readonly slotProps?: SliderSlotProps;
}

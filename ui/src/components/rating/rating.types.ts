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

import type { HTMLAttributes, InputHTMLAttributes, RefAttributes } from "react";

import type { MiaixzSlotProps } from "../../shared/slots.js";

export type RatingPrecision = 1 | 0.5;
export type RatingSize = "small" | "medium" | "large";

export interface RatingOwnerState {
  readonly max: number;
  readonly precision: RatingPrecision;
  readonly size: RatingSize;
  readonly disabled: boolean;
  readonly readOnly: boolean;
}

export interface RatingRootAttributes
  extends HTMLAttributes<HTMLDivElement>, RefAttributes<HTMLDivElement> {
  readonly "data-ui"?: "rating";
  readonly "data-size"?: RatingSize;
}

export interface RatingSlotProps {
  readonly root?: MiaixzSlotProps<RatingOwnerState, RatingRootAttributes>;
  readonly item?: MiaixzSlotProps<RatingOwnerState, HTMLAttributes<HTMLLabelElement>>;
  readonly input?: MiaixzSlotProps<RatingOwnerState, InputHTMLAttributes<HTMLInputElement>>;
  readonly icon?: MiaixzSlotProps<RatingOwnerState, HTMLAttributes<HTMLSpanElement>>;
}

type RatingLabel =
  | { readonly "aria-label": string; readonly "aria-labelledby"?: never }
  | { readonly "aria-label"?: never; readonly "aria-labelledby": string };

export type RatingProps = RatingLabel & {
  readonly value?: number | null;
  readonly defaultValue?: number | null;
  readonly onValueChange?: (value: number | null) => void;
  readonly max?: number;
  readonly precision?: RatingPrecision;
  readonly size?: RatingSize;
  readonly name: string;
  readonly required?: boolean;
  readonly disabled?: boolean;
  readonly readOnly?: boolean;
  readonly allowClear?: boolean;
  readonly getLabelText?: (value: number, max: number) => string;
  readonly slotProps?: RatingSlotProps;
};

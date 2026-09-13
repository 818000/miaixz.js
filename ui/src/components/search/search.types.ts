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

/* eslint-disable jsdoc/require-jsdoc --
 * The closed state and slot unions are self-describing.
 */

import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

import type { MiaixzSlotProps } from "../../shared/slots.js";
import type { InputProps, InputRootAttributes, InputSize } from "../input/input.types.js";

export type SearchChangeReason = "input" | "clear";
export type SearchSlot =
  "root" | "input" | "startAdornment" | "endAdornment" | "clear" | "shortcut";

export interface SearchOwnerState {
  readonly variant: "default" | "header";
  readonly width: "fill" | "medium";
  readonly size: InputSize;
  readonly disabled: boolean;
  readonly readOnly: boolean;
  readonly filled: boolean;
}

export interface SearchSlotProps {
  readonly root?: MiaixzSlotProps<SearchOwnerState, InputRootAttributes>;
  readonly input?: MiaixzSlotProps<SearchOwnerState, InputHTMLAttributes<HTMLInputElement>>;
  readonly startAdornment?: MiaixzSlotProps<SearchOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly endAdornment?: MiaixzSlotProps<SearchOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly clear?: MiaixzSlotProps<SearchOwnerState, ButtonHTMLAttributes<HTMLButtonElement>>;
  readonly shortcut?: MiaixzSlotProps<SearchOwnerState, HTMLAttributes<HTMLSpanElement>>;
}

interface SearchBaseProps extends Omit<
  InputProps,
  | "children"
  | "defaultValue"
  | "endAdornment"
  | "onChange"
  | "slotProps"
  | "startAdornment"
  | "type"
  | "value"
> {
  readonly variant?: "default" | "header";
  readonly width?: "fill" | "medium";
  readonly shortcut?: ReactNode;
  readonly clearable?: boolean;
  readonly clearLabel?: string;
  readonly onClear?: () => void;
  readonly slotProps?: SearchSlotProps;
}

export type SearchValueState =
  | {
      readonly value: string;
      readonly defaultValue?: never;
      readonly onValueChange: (value: string, reason: SearchChangeReason) => void;
    }
  | {
      readonly value?: never;
      readonly defaultValue?: string;
      readonly onValueChange?: (value: string, reason: SearchChangeReason) => void;
    };

/**
 * Configures a controlled or uncontrolled localized search field.
 */
export type SearchProps = SearchBaseProps & SearchValueState;

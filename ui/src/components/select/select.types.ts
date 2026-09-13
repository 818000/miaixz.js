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

/* eslint-disable jsdoc/require-jsdoc -- Slot contracts are a direct native-element mapping.
 */

import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  RefAttributes,
} from "react";

import type { MiaixzSlotProps } from "../../shared/slots.js";

export type SelectSize = "small" | "medium" | "large";

export interface SelectOption {
  readonly kind: "option";
  readonly id: string;
  readonly value: string;
  readonly label: ReactNode;
  readonly textValue: string;
  readonly disabled?: boolean;
}

export interface SelectGroup {
  readonly kind: "group";
  readonly id: string;
  readonly label: ReactNode;
  readonly options: readonly SelectOption[];
}

export type SelectEntry = SelectOption | SelectGroup;

export type SelectSlot =
  | "root"
  | "trigger"
  | "value"
  | "icon"
  | "listbox"
  | "group"
  | "groupLabel"
  | "option"
  | "hiddenInput"
  | "validationMessage";

export interface SelectOwnerState {
  readonly size: SelectSize;
  readonly invalid: boolean;
  readonly disabled: boolean;
  readonly readOnly: boolean;
  readonly open: boolean;
  readonly filled: boolean;
  readonly widthPreset: "fill" | "compact";
}

export interface SelectRootAttributes
  extends HTMLAttributes<HTMLSpanElement>, RefAttributes<HTMLSpanElement> {
  readonly "data-disabled"?: boolean;
  readonly "data-filled"?: boolean;
  readonly "data-invalid"?: boolean;
  readonly "data-readonly"?: boolean;
  readonly "data-size"?: SelectSize;
  readonly "data-state"?: "open" | "closed";
}

export interface SelectOptionAttributes extends HTMLAttributes<HTMLDivElement> {
  readonly "data-disabled"?: boolean;
  readonly "data-state"?: "active" | "idle";
}

export interface SelectSlotProps {
  readonly root?: MiaixzSlotProps<SelectOwnerState, SelectRootAttributes>;
  readonly trigger?: MiaixzSlotProps<
    SelectOwnerState,
    ButtonHTMLAttributes<HTMLButtonElement> & RefAttributes<HTMLButtonElement>
  >;
  readonly value?: MiaixzSlotProps<SelectOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly icon?: MiaixzSlotProps<SelectOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly listbox?: MiaixzSlotProps<
    SelectOwnerState,
    HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>
  >;
  readonly group?: MiaixzSlotProps<SelectOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly groupLabel?: MiaixzSlotProps<SelectOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly option?: MiaixzSlotProps<SelectOwnerState, SelectOptionAttributes>;
  readonly hiddenInput?: MiaixzSlotProps<SelectOwnerState, InputHTMLAttributes<HTMLInputElement>>;
  readonly validationMessage?: MiaixzSlotProps<SelectOwnerState, HTMLAttributes<HTMLSpanElement>>;
}

export type SelectValueState =
  | {
      readonly value: string;
      readonly defaultValue?: never;
      readonly onValueChange?: (value: string) => void;
    }
  | {
      readonly value?: never;
      readonly defaultValue?: string;
      readonly onValueChange?: (value: string) => void;
    };

interface SelectOwnProps {
  readonly items: readonly SelectEntry[];
  readonly size?: SelectSize;
  readonly invalid?: boolean;
  readonly readOnly?: boolean;
  readonly required?: boolean;
  readonly widthPreset?: "fill" | "compact";
  readonly onInvalid?: (reason: "required") => void;
  readonly slotProps?: SelectSlotProps;
}

/**
 * Configures a single-selection listbox with explicit option data.
 *
 * @public
 */
export type SelectProps = SelectOwnProps &
  SelectValueState &
  Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    | "children"
    | "type"
    | "value"
    | "defaultValue"
    | "onChange"
    | "onInvalid"
    | "role"
    | "aria-controls"
    | "aria-expanded"
    | "aria-haspopup"
    | "aria-activedescendant"
    | "aria-required"
    | "aria-readonly"
  >;

/* eslint-enable jsdoc/require-jsdoc
 */

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

/* eslint-disable jsdoc/require-jsdoc -- Closed public models are self-describing native mappings.
 */

import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  RefAttributes,
} from "react";

import type { MiaixzSlotProps } from "../../shared/slots.js";

export interface MiaixzOptionGroup {
  readonly id: string;
  readonly label: string;
}

export interface MiaixzOption<Value extends string = string> {
  readonly value: Value;
  readonly label: ReactNode;
  readonly textValue: string;
  readonly description?: ReactNode;
  readonly disabled?: boolean;
  readonly group?: MiaixzOptionGroup;
}

export interface MiaixzOptionPage<Value extends string = string> {
  readonly options: readonly MiaixzOption<Value>[];
  readonly nextCursor: string | null;
}

export type MiaixzOptionSource<Value extends string = string> =
  | {
      readonly options: readonly MiaixzOption<Value>[];
      readonly loadOptions?: never;
    }
  | {
      readonly options?: never;
      readonly loadOptions: (request: {
        readonly query: string;
        readonly cursor: string | null;
        readonly signal: AbortSignal;
      }) => Promise<MiaixzOptionPage<Value>>;
    };

export type MiaixzComboboxValueState<Value extends string = string> =
  | {
      readonly value: MiaixzOption<Value> | null;
      readonly defaultValue?: never;
      readonly onValueChange?: (option: MiaixzOption<Value> | null) => void;
    }
  | {
      readonly value?: never;
      readonly defaultValue?: MiaixzOption<Value> | null;
      readonly onValueChange?: (option: MiaixzOption<Value> | null) => void;
    };

export type MiaixzComboboxInputState =
  | {
      readonly inputValue: string;
      readonly defaultInputValue?: never;
      readonly onInputValueChange: (value: string) => void;
    }
  | {
      readonly inputValue?: never;
      readonly defaultInputValue?: string;
      readonly onInputValueChange?: (value: string) => void;
    };

export interface MiaixzOptionRenderState {
  readonly selected: boolean;
  readonly active: boolean;
}

export type ComboboxSlot =
  | "root"
  | "label"
  | "control"
  | "input"
  | "clear"
  | "toggle"
  | "surface"
  | "listbox"
  | "group"
  | "groupLabel"
  | "option"
  | "optionCopy"
  | "optionLabel"
  | "optionDescription"
  | "message"
  | "hiddenInput";

export interface ComboboxOwnerState {
  readonly disabled: boolean;
  readonly readOnly: boolean;
  readonly invalid: boolean;
  readonly open: boolean;
  readonly filled: boolean;
  readonly loading: boolean;
}

export interface ComboboxRootAttributes extends HTMLAttributes<HTMLDivElement> {
  readonly "data-disabled"?: boolean;
  readonly "data-filled"?: boolean;
  readonly "data-invalid"?: boolean;
  readonly "data-readonly"?: boolean;
  readonly "data-state"?: "open" | "closed";
}

export interface ComboboxControlAttributes extends HTMLAttributes<HTMLDivElement> {
  readonly "data-disabled"?: boolean;
  readonly "data-filled"?: boolean;
  readonly "data-invalid"?: boolean;
  readonly "data-readonly"?: boolean;
  readonly "data-state"?: "open" | "closed";
}

export interface ComboboxSurfaceAttributes
  extends HTMLAttributes<HTMLDivElement>, RefAttributes<HTMLDivElement> {
  readonly popover?: "manual";
  readonly "data-state"?: "loading" | "error" | "ready" | "limit";
}

export interface ComboboxOptionAttributes extends HTMLAttributes<HTMLDivElement> {
  readonly "data-disabled"?: boolean;
  readonly "data-state"?: "active" | "idle";
}

export interface ComboboxSlotProps {
  readonly root?: MiaixzSlotProps<ComboboxOwnerState, ComboboxRootAttributes>;
  readonly label?: MiaixzSlotProps<ComboboxOwnerState, LabelHTMLAttributes<HTMLLabelElement>>;
  readonly control?: MiaixzSlotProps<ComboboxOwnerState, ComboboxControlAttributes>;
  readonly input?: MiaixzSlotProps<
    ComboboxOwnerState,
    InputHTMLAttributes<HTMLInputElement> & RefAttributes<HTMLInputElement>
  >;
  readonly clear?: MiaixzSlotProps<ComboboxOwnerState, ButtonHTMLAttributes<HTMLButtonElement>>;
  readonly toggle?: MiaixzSlotProps<ComboboxOwnerState, ButtonHTMLAttributes<HTMLButtonElement>>;
  readonly surface?: MiaixzSlotProps<ComboboxOwnerState, ComboboxSurfaceAttributes>;
  readonly listbox?: MiaixzSlotProps<ComboboxOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly group?: MiaixzSlotProps<ComboboxOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly groupLabel?: MiaixzSlotProps<ComboboxOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly option?: MiaixzSlotProps<ComboboxOwnerState, ComboboxOptionAttributes>;
  readonly optionCopy?: MiaixzSlotProps<ComboboxOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly optionLabel?: MiaixzSlotProps<ComboboxOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly optionDescription?: MiaixzSlotProps<ComboboxOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly message?: MiaixzSlotProps<ComboboxOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly hiddenInput?: MiaixzSlotProps<ComboboxOwnerState, InputHTMLAttributes<HTMLInputElement>>;
}

export interface MiaixzComboboxOwnProps<Value extends string = string> {
  readonly label: ReactNode;
  readonly id?: string;
  readonly name?: string;
  readonly form?: string;
  readonly placeholder?: string;
  readonly emptyMessage?: ReactNode;
  readonly loadingMessage?: ReactNode;
  readonly errorMessage?: ReactNode;
  readonly refineMessage?: ReactNode;
  readonly disabled?: boolean;
  readonly readOnly?: boolean;
  readonly invalid?: boolean;
  readonly required?: boolean;
  readonly renderOption?: (
    option: MiaixzOption<Value>,
    state: MiaixzOptionRenderState,
  ) => ReactNode;
  readonly slotProps?: ComboboxSlotProps;
}

/*
 * Configures a searchable single-value WAI-ARIA combobox.
 */
export type ComboboxProps<Value extends string = string> = MiaixzOptionSource<Value> &
  MiaixzComboboxValueState<Value> &
  MiaixzComboboxInputState &
  MiaixzComboboxOwnProps<Value> &
  Omit<
    HTMLAttributes<HTMLDivElement>,
    | keyof MiaixzComboboxOwnProps<Value>
    | "children"
    | "onChange"
    | "aria-invalid"
    | "aria-labelledby"
    | "aria-describedby"
  > & {
    readonly "aria-invalid"?: boolean | "false" | "true" | "grammar" | "spelling";
    readonly "aria-labelledby"?: string;
    readonly "aria-describedby"?: string;
  };

/* eslint-enable jsdoc/require-jsdoc
 */

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

/**
 * Defines the combobox public type contracts.
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

/**
 * Stable grouping identity and visible heading for combobox options.
 */
export interface MiaixzOptionGroup {
  readonly id: string;
  readonly label: string;
}

/**
 * Selectable combobox value with visible content, keyboard-search text, and optional grouping.
 */
export interface MiaixzOption<Value extends string = string> {
  readonly value: Value;
  readonly label: ReactNode;
  readonly textValue: string;
  readonly description?: ReactNode;
  readonly disabled?: boolean;
  readonly group?: MiaixzOptionGroup;
}

/**
 * One asynchronous combobox result page and the cursor for the following page.
 */
export interface MiaixzOptionPage<Value extends string = string> {
  readonly options: readonly MiaixzOption<Value>[];
  readonly nextCursor: string | null;
}

/**
 * Mutually exclusive static options or abortable asynchronous option loading.
 */
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

/**
 * Mutually exclusive controlled value or uncontrolled initial combobox selection.
 */
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

/**
 * Mutually exclusive controlled query text or uncontrolled initial query text.
 */
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

/**
 * Selection and keyboard-active state supplied to an option renderer.
 */
export interface MiaixzOptionRenderState {
  readonly selected: boolean;
  readonly active: boolean;
}

/**
 * Named Combobox parts available for slot and style customization.
 */
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

/**
 * Resolved Combobox state exposed to theme and slot overrides.
 */
export interface ComboboxOwnerState {
  readonly disabled: boolean;
  readonly readOnly: boolean;
  readonly invalid: boolean;
  readonly open: boolean;
  readonly filled: boolean;
  readonly loading: boolean;
}

/**
 * Attributes accepted by the Combobox Root slot.
 */
export interface ComboboxRootAttributes extends HTMLAttributes<HTMLDivElement> {
  readonly "data-disabled"?: boolean;
  readonly "data-filled"?: boolean;
  readonly "data-invalid"?: boolean;
  readonly "data-readonly"?: boolean;
  readonly "data-state"?: "open" | "closed";
}

/**
 * Attributes accepted by the Combobox Control slot.
 */
export interface ComboboxControlAttributes extends HTMLAttributes<HTMLDivElement> {
  readonly "data-disabled"?: boolean;
  readonly "data-filled"?: boolean;
  readonly "data-invalid"?: boolean;
  readonly "data-readonly"?: boolean;
  readonly "data-state"?: "open" | "closed";
}

/**
 * Attributes accepted by the Combobox Surface slot.
 */
export interface ComboboxSurfaceAttributes
  extends HTMLAttributes<HTMLDivElement>, RefAttributes<HTMLDivElement> {
  readonly popover?: "manual";
  readonly "data-state"?: "loading" | "error" | "ready" | "limit";
}

/**
 * Attributes accepted by the Combobox Option slot.
 */
export interface ComboboxOptionAttributes extends HTMLAttributes<HTMLDivElement> {
  readonly "data-disabled"?: boolean;
  readonly "data-state"?: "active" | "idle";
}

/**
 * Per-slot attributes and state-dependent override callbacks for Combobox.
 */
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

/**
 * Component-specific Combobox properties composed with the permitted native attributes.
 */
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

/**
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

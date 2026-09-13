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

import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

import type {
  ComboboxOwnerState,
  ComboboxProps,
  ComboboxSlotProps,
  MiaixzComboboxInputState,
  MiaixzOption,
  MiaixzOptionSource,
} from "../combobox/combobox.types.js";
import type { MiaixzSlotProps } from "../../shared/slots.js";

export type PickerValueState<Value extends string = string> =
  | {
      readonly value: readonly MiaixzOption<Value>[];
      readonly defaultValue?: never;
      readonly onValueChange?: (value: readonly MiaixzOption<Value>[]) => void;
    }
  | {
      readonly value?: never;
      readonly defaultValue?: readonly MiaixzOption<Value>[];
      readonly onValueChange?: (value: readonly MiaixzOption<Value>[]) => void;
    };

export interface PickerRenderValueState<Value extends string = string> {
  readonly remove: (option: MiaixzOption<Value>) => void;
  readonly disabled: boolean;
  readonly readOnly: boolean;
}

export interface PickerSlotProps extends ComboboxSlotProps {
  readonly values?: MiaixzSlotProps<ComboboxOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly value?: MiaixzSlotProps<ComboboxOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly valueLabel?: MiaixzSlotProps<ComboboxOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly remove?: MiaixzSlotProps<ComboboxOwnerState, ButtonHTMLAttributes<HTMLButtonElement>>;
  readonly count?: MiaixzSlotProps<ComboboxOwnerState, HTMLAttributes<HTMLOutputElement>>;
}

export interface MiaixzPickerOwnProps<Value extends string = string> extends Omit<
  ComboboxProps<Value>,
  "value" | "defaultValue" | "onValueChange" | "slotProps"
> {
  readonly selectionLimit?: number;
  readonly removeMessage?: string;
  readonly searchMessage?: string;
  readonly renderValue?: (
    selected: readonly MiaixzOption<Value>[],
    state: PickerRenderValueState<Value>,
  ) => ReactNode;
  readonly slotProps?: PickerSlotProps;
}

/*
 * Configures a searchable multiple-selection picker.
 */
export type PickerProps<Value extends string = string> = MiaixzOptionSource<Value> &
  PickerValueState<Value> &
  MiaixzComboboxInputState &
  Omit<
    MiaixzPickerOwnProps<Value>,
    keyof MiaixzOptionSource<Value> | keyof MiaixzComboboxInputState
  >;

/* eslint-enable jsdoc/require-jsdoc
 */

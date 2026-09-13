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
 * The closed item model owns every group state input.
 */

import type { FieldsetHTMLAttributes, HTMLAttributes, ReactNode, RefAttributes } from "react";

import type { MiaixzSlotProps } from "../../shared/slots.js";

export interface RadioGroupItem {
  readonly id: string;
  readonly value: string;
  readonly label: ReactNode;
  readonly description?: ReactNode;
  readonly disabled?: boolean;
}

export interface RadioGroupOwnerState {
  readonly orientation: "vertical" | "horizontal";
  readonly required: boolean;
  readonly invalid: boolean;
  readonly disabled: boolean;
  readonly readOnly: boolean;
}

export interface RadioGroupSlotProps {
  readonly root?: MiaixzSlotProps<
    RadioGroupOwnerState,
    FieldsetHTMLAttributes<HTMLFieldSetElement> & RefAttributes<HTMLFieldSetElement>
  >;
  readonly legend?: MiaixzSlotProps<RadioGroupOwnerState, HTMLAttributes<HTMLLegendElement>>;
  readonly items?: MiaixzSlotProps<RadioGroupOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly item?: MiaixzSlotProps<RadioGroupOwnerState, HTMLAttributes<HTMLLabelElement>>;
  readonly control?: MiaixzSlotProps<
    RadioGroupOwnerState,
    React.InputHTMLAttributes<HTMLInputElement>
  >;
  readonly label?: MiaixzSlotProps<RadioGroupOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly description?: MiaixzSlotProps<RadioGroupOwnerState, HTMLAttributes<HTMLSpanElement>>;
}

interface RadioGroupBaseProps extends Omit<
  FieldsetHTMLAttributes<HTMLFieldSetElement>,
  "children" | "name" | "onChange"
> {
  readonly name: string;
  readonly label: ReactNode;
  readonly items: readonly RadioGroupItem[];
  readonly orientation?: "vertical" | "horizontal";
  readonly required?: boolean;
  readonly invalid?: boolean;
  readonly disabled?: boolean;
  readonly slotProps?: RadioGroupSlotProps;
}

type RadioGroupValueState =
  | {
      readonly value: string | undefined;
      readonly defaultValue?: never;
      readonly onValueChange?: (value: string, event: React.ChangeEvent<HTMLInputElement>) => void;
    }
  | {
      readonly value?: never;
      readonly defaultValue?: string;
      readonly onValueChange?: (value: string, event: React.ChangeEvent<HTMLInputElement>) => void;
    };

/**
 * Configures a closed native radio group owned by one fieldset.
 *
 * @public
 */
export type RadioGroupProps = RadioGroupBaseProps & RadioGroupValueState;

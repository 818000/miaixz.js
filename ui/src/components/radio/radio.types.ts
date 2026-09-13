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
 * Slot contracts directly map fixed native elements.
 */

import type {
  HTMLAttributes,
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  RefAttributes,
} from "react";

import type { MiaixzSlotProps } from "../../shared/slots.js";

export type RadioSlot = "root" | "input" | "mark" | "content" | "label" | "description";

export interface RadioOwnerState {
  readonly checked: boolean;
  readonly disabled: boolean;
  readonly invalid: boolean;
}

export interface RadioRootAttributes
  extends LabelHTMLAttributes<HTMLLabelElement>, RefAttributes<HTMLLabelElement> {
  readonly "data-disabled"?: boolean;
  readonly "data-filled"?: boolean;
  readonly "data-invalid"?: boolean;
}

export interface RadioSlotProps {
  readonly root?: MiaixzSlotProps<RadioOwnerState, RadioRootAttributes>;
  readonly input?: MiaixzSlotProps<
    RadioOwnerState,
    InputHTMLAttributes<HTMLInputElement> & RefAttributes<HTMLInputElement>
  >;
  readonly mark?: MiaixzSlotProps<RadioOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly content?: MiaixzSlotProps<RadioOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly label?: MiaixzSlotProps<RadioOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly description?: MiaixzSlotProps<RadioOwnerState, HTMLAttributes<HTMLSpanElement>>;
}

/**
 * Configures a labeled native radio control.
 */
export interface RadioProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "children" | "size" | "style" | "type"
> {
  readonly label?: ReactNode;
  readonly description?: ReactNode;
  readonly invalid?: boolean;
  readonly style?: React.CSSProperties;
  readonly slotProps?: RadioSlotProps;
}

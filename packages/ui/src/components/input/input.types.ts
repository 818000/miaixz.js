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
 * Defines the input public type contracts.
 */

import type { HTMLAttributes, InputHTMLAttributes, ReactNode, RefAttributes } from "react";

import type { MiaixzSlotProps } from "../../shared/slots.js";

/**
 * Input size tokens permitted by the component contract.
 */
export type InputSize = "small" | "medium" | "large";

/**
 * Named Input parts available for slot and style customization.
 */
export type InputSlot = "root" | "input" | "startAdornment" | "endAdornment";

/**
 * Resolved Input state exposed to theme and slot overrides.
 */
export interface InputOwnerState {
  readonly size: InputSize;
  readonly invalid: boolean;
  readonly disabled: boolean;
  readonly readOnly: boolean;
  readonly filled: boolean;
}

/**
 * Attributes accepted by the Input Root slot.
 */
export interface InputRootAttributes
  extends HTMLAttributes<HTMLSpanElement>, RefAttributes<HTMLSpanElement> {
  readonly "data-disabled"?: boolean;
  readonly "data-filled"?: boolean;
  readonly "data-invalid"?: boolean;
  readonly "data-readonly"?: boolean;
  readonly "data-size"?: InputSize;
}

/**
 * Per-slot attributes and state-dependent override callbacks for Input.
 */
export interface InputSlotProps {
  readonly root?: MiaixzSlotProps<InputOwnerState, InputRootAttributes>;
  readonly input?: MiaixzSlotProps<
    InputOwnerState,
    InputHTMLAttributes<HTMLInputElement> & RefAttributes<HTMLInputElement>
  >;
  readonly startAdornment?: MiaixzSlotProps<InputOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly endAdornment?: MiaixzSlotProps<InputOwnerState, HTMLAttributes<HTMLSpanElement>>;
}

/**
 * Configures a single-line native input with a separate styled root.
 *
 * @public
 */
export interface InputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "children" | "size" | "style"
> {
  readonly size?: InputSize;
  readonly invalid?: boolean;
  readonly startAdornment?: ReactNode;
  readonly endAdornment?: ReactNode;
  readonly style?: React.CSSProperties;
  readonly slotProps?: InputSlotProps;
}

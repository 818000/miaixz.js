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
 * Defines the checkbox public type contracts.
 */

import type {
  HTMLAttributes,
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  RefAttributes,
} from "react";

import type { MiaixzSlotProps } from "../../shared/slots.js";

/**
 * Named Checkbox parts available for slot and style customization.
 */
export type CheckboxSlot = "root" | "input" | "mark" | "content" | "label" | "description";

/**
 * Resolved Checkbox state exposed to theme and slot overrides.
 */
export interface CheckboxOwnerState {
  readonly checked: boolean;
  readonly indeterminate: boolean;
  readonly disabled: boolean;
  readonly invalid: boolean;
}

/**
 * Attributes accepted by the Checkbox Root slot.
 */
export interface CheckboxRootAttributes
  extends LabelHTMLAttributes<HTMLLabelElement>, RefAttributes<HTMLLabelElement> {
  readonly "data-disabled"?: boolean;
  readonly "data-filled"?: boolean;
  readonly "data-invalid"?: boolean;
}

/**
 * Per-slot attributes and state-dependent override callbacks for Checkbox.
 */
export interface CheckboxSlotProps {
  readonly root?: MiaixzSlotProps<CheckboxOwnerState, CheckboxRootAttributes>;
  readonly input?: MiaixzSlotProps<
    CheckboxOwnerState,
    InputHTMLAttributes<HTMLInputElement> & RefAttributes<HTMLInputElement>
  >;
  readonly mark?: MiaixzSlotProps<CheckboxOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly content?: MiaixzSlotProps<CheckboxOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly label?: MiaixzSlotProps<CheckboxOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly description?: MiaixzSlotProps<CheckboxOwnerState, HTMLAttributes<HTMLSpanElement>>;
}

/**
 * Configures a native checkbox with optional supporting content.
 */
export interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "children" | "size" | "style" | "type"
> {
  readonly label?: ReactNode;
  readonly description?: ReactNode;
  readonly indeterminate?: boolean;
  readonly invalid?: boolean;
  readonly style?: React.CSSProperties;
  readonly slotProps?: CheckboxSlotProps;
}

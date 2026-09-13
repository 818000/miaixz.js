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

export type SwitchSize = "small" | "medium";
export type SwitchSlot = "root" | "input" | "track" | "thumb" | "content" | "label" | "description";

export interface SwitchOwnerState {
  readonly size: SwitchSize;
  readonly checked: boolean;
  readonly disabled: boolean;
  readonly invalid: boolean;
}

export interface SwitchRootAttributes
  extends LabelHTMLAttributes<HTMLLabelElement>, RefAttributes<HTMLLabelElement> {
  readonly "data-disabled"?: boolean;
  readonly "data-filled"?: boolean;
  readonly "data-invalid"?: boolean;
  readonly "data-size"?: SwitchSize;
}

export interface SwitchSlotProps {
  readonly root?: MiaixzSlotProps<SwitchOwnerState, SwitchRootAttributes>;
  readonly input?: MiaixzSlotProps<
    SwitchOwnerState,
    InputHTMLAttributes<HTMLInputElement> & RefAttributes<HTMLInputElement>
  >;
  readonly track?: MiaixzSlotProps<SwitchOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly thumb?: MiaixzSlotProps<SwitchOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly content?: MiaixzSlotProps<SwitchOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly label?: MiaixzSlotProps<SwitchOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly description?: MiaixzSlotProps<SwitchOwnerState, HTMLAttributes<HTMLSpanElement>>;
}

/**
 * Configures an accessible native boolean switch.
 */
export interface SwitchProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "children" | "size" | "style" | "type"
> {
  readonly size?: SwitchSize;
  readonly label?: ReactNode;
  readonly description?: ReactNode;
  readonly invalid?: boolean;
  readonly style?: React.CSSProperties;
  readonly slotProps?: SwitchSlotProps;
}

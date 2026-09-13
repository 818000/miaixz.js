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

import type { HTMLAttributes, RefAttributes, TextareaHTMLAttributes } from "react";

import type { MiaixzSlotProps } from "../../shared/slots.js";

export type TextareaSize = "small" | "medium" | "large";
export type TextareaResize = "none" | "vertical" | "horizontal" | "both";
export type TextareaSlot = "root" | "textarea";

export interface TextareaOwnerState {
  readonly size: TextareaSize;
  readonly resize: TextareaResize;
  readonly invalid: boolean;
  readonly disabled: boolean;
  readonly readOnly: boolean;
  readonly filled: boolean;
}

export interface TextareaRootAttributes
  extends HTMLAttributes<HTMLSpanElement>, RefAttributes<HTMLSpanElement> {
  readonly "data-disabled"?: boolean;
  readonly "data-filled"?: boolean;
  readonly "data-invalid"?: boolean;
  readonly "data-readonly"?: boolean;
  readonly "data-size"?: TextareaSize;
}

export interface TextareaSlotProps {
  readonly root?: MiaixzSlotProps<TextareaOwnerState, TextareaRootAttributes>;
  readonly textarea?: MiaixzSlotProps<TextareaOwnerState, TextareaControlAttributes>;
}

export interface TextareaControlAttributes
  extends TextareaHTMLAttributes<HTMLTextAreaElement>, RefAttributes<HTMLTextAreaElement> {
  readonly "data-resize"?: TextareaResize;
}

/**
 * Configures a multiline native control with a separate styled root.
 *
 * @public
 */
export interface TextareaProps extends Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "children" | "style"
> {
  readonly size?: TextareaSize;
  readonly invalid?: boolean;
  readonly resize?: TextareaResize;
  readonly style?: React.CSSProperties;
  readonly slotProps?: TextareaSlotProps;
}

/* eslint-enable jsdoc/require-jsdoc
 */

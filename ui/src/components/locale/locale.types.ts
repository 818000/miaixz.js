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

/* eslint-disable jsdoc/require-jsdoc -- Closed locale slots are self-describing.
 */

import type { MiaixzLocaleDescriptor } from "@miaixz/sdk/i18n";
import type { HTMLAttributes, RefAttributes } from "react";

import type { MiaixzUiError } from "../../errors/ui-error.js";
import type { MiaixzSlotProps } from "../../shared/slots.js";

export type LocaleSlot = "root" | "search" | "list" | "option" | "empty" | "error";

export interface LocaleOwnerState {
  readonly disabled: boolean;
  readonly pending: boolean;
  readonly hasError: boolean;
}

export type LocaleRootAttributes = HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>;

export interface LocaleSlotProps {
  readonly root?: MiaixzSlotProps<LocaleOwnerState, LocaleRootAttributes>;
  readonly search?: MiaixzSlotProps<LocaleOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly list?: MiaixzSlotProps<LocaleOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly option?: MiaixzSlotProps<LocaleOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly empty?: MiaixzSlotProps<LocaleOwnerState, HTMLAttributes<HTMLParagraphElement>>;
  readonly error?: MiaixzSlotProps<LocaleOwnerState, HTMLAttributes<HTMLDivElement>>;
}

export interface LocaleProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "children" | "onChange" | "onError"
> {
  readonly locales: readonly MiaixzLocaleDescriptor[];
  readonly locale: string;
  readonly onLocaleChange: (locale: string) => void | Promise<void>;
  readonly onError?: (error: MiaixzUiError) => void;
  readonly disabled?: boolean;
  readonly slotProps?: LocaleSlotProps;
}

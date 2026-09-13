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
 * The closed file and slot contracts are self-describing.
 */

import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  RefAttributes,
} from "react";

import type { MiaixzSlotProps } from "../../shared/slots.js";

export type DropzoneRejectionReason = "type" | "size" | "count" | "duplicate";

export interface DropzoneRejection {
  readonly file: File;
  readonly reason: DropzoneRejectionReason;
}

export type DropzoneSlot = "root" | "input" | "trigger" | "content" | "error";

export interface DropzoneOwnerState {
  readonly disabled: boolean;
  readonly dragActive: boolean;
  readonly hasError: boolean;
}

export interface DropzoneRootAttributes
  extends HTMLAttributes<HTMLDivElement>, RefAttributes<HTMLDivElement> {
  readonly "data-disabled"?: boolean;
  readonly "data-state"?: "active" | "idle";
}

export interface DropzoneSlotProps {
  readonly root?: MiaixzSlotProps<DropzoneOwnerState, DropzoneRootAttributes>;
  readonly input?: MiaixzSlotProps<
    DropzoneOwnerState,
    InputHTMLAttributes<HTMLInputElement> & RefAttributes<HTMLInputElement>
  >;
  readonly trigger?: MiaixzSlotProps<DropzoneOwnerState, ButtonHTMLAttributes<HTMLButtonElement>>;
  readonly content?: MiaixzSlotProps<DropzoneOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly error?: MiaixzSlotProps<DropzoneOwnerState, HTMLAttributes<HTMLDivElement>>;
}

export type DropzoneMultiplicity =
  | {
      readonly multiple?: false;
      readonly maxFiles?: never;
    }
  | {
      readonly multiple: true;
      readonly maxFiles?: number;
    };

export interface MiaixzDropzoneOwnProps {
  readonly accept?: string;
  readonly maxSizeBytes?: number;
  readonly disabled?: boolean;
  readonly label: string;
  readonly children: ReactNode;
  readonly onFiles: (files: readonly File[]) => void;
  readonly onReject?: (rejections: readonly DropzoneRejection[]) => void;
  readonly slotProps?: DropzoneSlotProps;
}

/*
 * Configures a request-independent file selection dropzone.
 */
export type DropzoneProps = MiaixzDropzoneOwnProps &
  DropzoneMultiplicity &
  Omit<HTMLAttributes<HTMLDivElement>, keyof MiaixzDropzoneOwnProps | "children">;

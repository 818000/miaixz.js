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

/* eslint-disable jsdoc/require-jsdoc -- Closed public unions and slots are self-describing.
 */

import type { HTMLAttributes, ReactNode, RefAttributes } from "react";

import type { MiaixzSlotProps } from "../../shared/slots.js";
import type { UploadFileRecord } from "../../shared/upload/types.js";

export type {
  LocalUploadFileRecord,
  MiaixzUploadContext,
  MiaixzUploadHandler,
  RemoteUploadFileRecord,
  UploadFileBase,
  UploadFileRecord,
  UploadRetryPolicy,
} from "../../shared/upload/types.js";
import type { MiaixzUploadHandler, UploadRetryPolicy } from "../../shared/upload/types.js";

export interface UploadRemoveConfirmation {
  readonly title: ReactNode;
  readonly description: ReactNode;
  readonly confirmLabel: string;
  readonly cancelLabel: string;
}

export type UploadRemovePolicy =
  | { readonly removePolicy: "immediate"; readonly getRemoveConfirmation?: never }
  | {
      readonly removePolicy?: "confirm";
      readonly getRemoveConfirmation: (file: UploadFileRecord) => UploadRemoveConfirmation;
    };

export type UploadFilesState =
  | {
      readonly files: readonly UploadFileRecord[];
      readonly defaultFiles?: never;
      readonly onFilesChange: (files: readonly UploadFileRecord[]) => void;
    }
  | {
      readonly files?: never;
      readonly defaultFiles?: readonly UploadFileRecord[];
      readonly onFilesChange?: (files: readonly UploadFileRecord[]) => void;
    };

export type UploadMultiplicity =
  | { readonly multiple?: false; readonly maxFiles?: never }
  | { readonly multiple: true; readonly maxFiles?: number };

export type UploadSlot =
  "root" | "dropzone" | "validation" | "list" | "item" | "status" | "actions";

export interface UploadOwnerState {
  readonly disabled: boolean;
  readonly fileCount: number;
  readonly hasError: boolean;
}

export interface UploadRootAttributes
  extends HTMLAttributes<HTMLDivElement>, RefAttributes<HTMLDivElement> {
  readonly "data-disabled"?: boolean;
}

export interface UploadSlotProps {
  readonly root?: MiaixzSlotProps<UploadOwnerState, UploadRootAttributes>;
  readonly dropzone?: MiaixzSlotProps<UploadOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly validation?: MiaixzSlotProps<UploadOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly list?: MiaixzSlotProps<UploadOwnerState, HTMLAttributes<HTMLUListElement>>;
  readonly item?: MiaixzSlotProps<UploadOwnerState, HTMLAttributes<HTMLLIElement>>;
  readonly status?: MiaixzSlotProps<UploadOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly actions?: MiaixzSlotProps<UploadOwnerState, HTMLAttributes<HTMLDivElement>>;
}

export interface MiaixzUploadOwnProps {
  readonly accept?: string;
  readonly maxSizeBytes?: number;
  readonly disabled?: boolean;
  readonly label: string;
  readonly dropLabel: string;
  readonly browseLabel: string;
  readonly upload: MiaixzUploadHandler;
  readonly onComplete: (file: File) => void;
  readonly onError: (file: File, error: unknown) => void;
  readonly concurrency?: number;
  readonly retryPolicy?: UploadRetryPolicy;
  readonly slotProps?: UploadSlotProps;
}

export type UploadProps = MiaixzUploadOwnProps &
  UploadFilesState &
  UploadRemovePolicy &
  UploadMultiplicity &
  Omit<HTMLAttributes<HTMLDivElement>, keyof MiaixzUploadOwnProps | "children">;

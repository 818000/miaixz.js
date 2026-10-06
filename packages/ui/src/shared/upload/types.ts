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
 * Supplies cancellation and progress reporting to one upload request.
 */
export interface MiaixzUploadContext {
  readonly signal: AbortSignal;
  /**
   * Reports upload progress for the current attempt.
   * @param value - Progress percentage normalized by the upload queue.
   * @returns No return value.
   */
  reportProgress(value: number): void;
}

/**
 * Defines the consumer-owned request for one local file.
 */
export type MiaixzUploadHandler = (file: File, context: MiaixzUploadContext) => Promise<void>;

/**
 * Defines metadata shared by local and remote upload records.
 */
export interface UploadFileBase {
  readonly id: string;
  readonly name: string;
  readonly size: number;
  readonly lastModified?: number;
}

/**
 * Defines one locally selected file and its upload lifecycle.
 */
export interface LocalUploadFileRecord extends UploadFileBase {
  readonly source: { readonly kind: "local"; readonly file: File };
  readonly status: "queued" | "uploading" | "succeeded" | "failed";
  readonly progress: number;
}

/**
 * Defines one already-persisted file.
 */
export interface RemoteUploadFileRecord extends UploadFileBase {
  readonly source: { readonly kind: "remote" };
  readonly status: "succeeded";
  readonly progress: 100;
}

/**
 * Defines the sole public upload file model.
 */
export type UploadFileRecord = LocalUploadFileRecord | RemoteUploadFileRecord;

/**
 * Configures automatic retries for local uploads.
 */
export interface UploadRetryPolicy {
  readonly maxRetries: number;
  readonly delayMs: number | ((retryIndex: number, error: unknown) => number);
  readonly shouldRetry?: (error: unknown) => boolean;
}

/**
 * Configures the internal upload queue controller.
 */
export interface UseUploadQueueOptions {
  readonly files?: readonly UploadFileRecord[];
  readonly defaultFiles?: readonly UploadFileRecord[];
  readonly onFilesChange?: (files: readonly UploadFileRecord[]) => void;
  readonly upload: MiaixzUploadHandler;
  readonly onComplete: (file: File) => void;
  readonly onError: (file: File, error: unknown) => void;
  readonly concurrency: number;
  readonly retryPolicy: UploadRetryPolicy;
}

/**
 * Exposes the deterministic queue state and transitions used by Upload.
 */
export interface UploadQueueController {
  readonly files: readonly UploadFileRecord[];
  /**
   * Adds selected local files to the upload queue.
   * @param files - Browser files accepted by the upload component.
   * @returns No return value.
   */
  add(files: readonly File[]): void;
  /**
   * Schedules another upload attempt for the matching failed local record.
   * @param id - Stable upload-record identifier.
   * @returns No return value.
   */
  retry(id: string): void;
  /**
   * Removes a queued record and cancels any owned in-flight attempt.
   * @param id - Stable upload-record identifier.
   * @returns No return value.
   */
  remove(id: string): void;
}

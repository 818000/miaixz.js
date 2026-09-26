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
 * Defines public source descriptors and random-access resource contracts.
 */

/**
 * Describes a remote file without requiring its URL to expose a useful filename.
 */
export interface RemoteFileSource {
  readonly url: string | URL;
  readonly name?: string;
  readonly mimeType?: string;
  readonly size?: number;
  readonly etag?: string;
  readonly headers?: Readonly<Record<string, string>>;
  readonly withCredentials?: boolean;
}

/**
 * Accepts every source supported by the one-line FileView API.
 */
export type FileViewSource = string | URL | Blob | ArrayBuffer | Uint8Array | RemoteFileSource;

/**
 * Adds metadata and authorized request options to a source.
 */
export interface FileViewSourceDescriptor {
  readonly data: FileViewSource;
  readonly name?: string;
  readonly mimeType?: string;
  readonly size?: number;
  readonly etag?: string;
  readonly headers?: Readonly<Record<string, string>>;
  readonly credentials?: RequestCredentials;
}

/**
 * Identifies a related file requested by a format driver.
 */
export interface RelatedResourceRequest {
  readonly documentId: string;
  readonly relation: "companion" | "embedded" | "external";
  readonly path: string;
  readonly mimeType?: string;
  readonly required: boolean;
}

/**
 * Provides bounded, cancellable random access to source bytes.
 */
export interface RandomAccessResource {
  readonly id: string;
  readonly name: string;
  readonly mimeType: string | undefined;
  readonly size: number | undefined;
  readonly etag: string | undefined;
  read(start: number, length: number, signal?: AbortSignal): Promise<Uint8Array>;
  readAll(signal?: AbortSignal): Promise<Uint8Array>;
  createObjectUrl(): Promise<string>;
  dispose(): void;
}

/**
 * Opens primary and related resources through one host-controlled policy boundary.
 */
export interface FileResourceProvider {
  open(
    source: FileViewSource | FileViewSourceDescriptor,
    signal: AbortSignal,
  ): Promise<RandomAccessResource>;
  resolveRelated?(
    request: RelatedResourceRequest,
    signal: AbortSignal,
  ): Promise<RandomAccessResource | undefined>;
}

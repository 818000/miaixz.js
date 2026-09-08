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
 * Describes a file managed by a Miaixz service.
 *
 * @public
 */
export interface MiaixzFileDescriptor {
  /**
   * Unique identifier of the file.
   */
  id: string;

  /**
   * Original or display name of the file.
   */
  name: string;

  /**
   * File size in bytes.
   */
  size: number;

  /**
   * Optional media type of the file content.
   */
  contentType?: string;

  /**
   * Optional checksum used to verify file integrity.
   */
  checksum?: string;

  /**
   * Optional URL from which the file can be downloaded.
   */
  downloadUrl?: string;

  /**
   * Optional ISO 8601 creation time.
   */
  createdAt?: string;
}

/**
 * Describes the files returned by an upload operation.
 *
 * @typeParam TFile - Concrete descriptor type returned for each uploaded file.
 * @public
 */
export interface MiaixzUploadResult<TFile extends MiaixzFileDescriptor = MiaixzFileDescriptor> {
  /**
   * Immutable collection of uploaded files.
   */
  files: readonly TFile[];
}

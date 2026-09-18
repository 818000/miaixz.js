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
 * Identifies every stable public preview contract failure.
 *
 * @public
 */
export type MiaixzViewErrorCode =
  | "VIEW_IMAGE_SCALE_INVALID"
  | "VIEW_PDF_PAGE_INVALID"
  | "VIEW_PDF_SCALE_INVALID"
  | "VIEW_OFFICE_SERVER_URL_INVALID"
  | "VIEW_OFFICE_SERVER_CONFLICT"
  | "VIEW_OFFICE_NONCE_CONFLICT"
  | "VIEW_OFFICE_API_MISSING"
  | "VIEW_OFFICE_API_LOAD_FAILED";

/**
 * Reports a language-neutral preview contract failure without retaining sensitive input.
 *
 * @public
 */
export class MiaixzViewError extends Error {
  /**
   * Stable machine-readable failure code.
   */
  readonly code: MiaixzViewErrorCode;

  /**
   * Creates a preview contract error.
   *
   * @param code - Stable machine-readable failure code.
   */
  constructor(code: MiaixzViewErrorCode) {
    super(`[${code}]`);
    this.name = "MiaixzViewError";
    this.code = code;
  }
}

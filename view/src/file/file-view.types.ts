/**
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

import type { ImageViewProps } from "../image/image-view.types.js";
import type { OfficeViewProps } from "../office/office-view.types.js";
import type { PdfViewProps } from "../pdf/pdf-view.types.js";

interface ImageFileViewProps extends ImageViewProps {
  /**
   * Selects image preview rendering.
   */
  readonly kind: "image";
}

interface PdfFileViewProps extends PdfViewProps {
  /**
   * Selects PDF preview rendering.
   */
  readonly kind: "pdf";
}

interface OfficeFileViewProps extends OfficeViewProps {
  /**
   * Selects ONLYOFFICE preview rendering.
   */
  readonly kind: "office";
}

/**
 * Defines an explicitly classified preview request.
 *
 * Signed URLs may not preserve useful extensions, so the caller selects the viewer kind.
 *
 * @public
 */
export type FileViewProps = ImageFileViewProps | PdfFileViewProps | OfficeFileViewProps;

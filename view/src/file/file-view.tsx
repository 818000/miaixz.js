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

import { ImageView } from "../image/image-view.js";
import { OfficeView } from "../office/office-view.js";
import { PdfView } from "../pdf/pdf-view.js";
import type { FileViewProps } from "./file-view.types.js";

/**
 * Routes one explicitly classified source to its specialized preview component.
 *
 * @param props - Explicitly classified preview properties.
 * @returns Specialized preview element.
 * @public
 */
export function FileView(props: FileViewProps): React.ReactElement {
  if (props.kind === "image") {
    const { kind: _kind, ...imageProps } = props;
    return <ImageView {...imageProps} />;
  }
  if (props.kind === "pdf") {
    const { kind: _kind, ...pdfProps } = props;
    return <PdfView {...pdfProps} />;
  }
  const { kind: _kind, ...officeProps } = props;
  return <OfficeView {...officeProps} />;
}

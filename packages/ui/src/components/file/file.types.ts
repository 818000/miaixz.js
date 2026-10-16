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
 * Defines semantic file icon presentation shared by asset browsers.
 */
import type { HTMLAttributes } from "react";
import type { IconName } from "@miaixz/icons";

/**
 * Stable file categories resolved into the current theme's semantic palette.
 * @public
 */
export type FileTone =
  | "neutral"
  | "pdf"
  | "word"
  | "spreadsheet"
  | "presentation"
  | "drawing"
  | "video"
  | "archive"
  | "image"
  | "audio"
  | "code";

/**
 * Accessible glyph and semantic presentation for a file asset.
 * @public
 */
export interface FileProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  readonly icon: IconName;
  readonly label: string;
  readonly tone?: FileTone;
  readonly presentation?: "badge" | "plain";
}

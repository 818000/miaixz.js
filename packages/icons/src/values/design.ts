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
 * Shared font family.
 */
export const FONT_FAMILY = "Miaixz Icons";
/**
 * Shared variable-font axis bounds.
 */
export const ICON_AXES = Object.freeze({
  FILL: Object.freeze({
    minimum: 0,
    default: 0,
    maximum: 1,
  }),
  opsz: Object.freeze({
    minimum: 12,
    default: 24,
    maximum: 40,
  }),
} as const);
/**
 * Shared semantic size tokens.
 */
export const ICON_SIZES = Object.freeze({
  indicator: Object.freeze({
    pixels: 12,
    opticalSize: 12,
  }),
  inline: Object.freeze({
    pixels: 16,
    opticalSize: 16,
  }),
  control: Object.freeze({
    pixels: 16,
    opticalSize: 16,
  }),
  navigation: Object.freeze({
    pixels: 20,
    opticalSize: 20,
  }),
  feature: Object.freeze({
    pixels: 24,
    opticalSize: 24,
  }),
  display: Object.freeze({
    pixels: 32,
    opticalSize: 32,
  }),
} as const);
/**
 * Semantic size token derived from the generated size records.
 */
export type IconSize = keyof typeof ICON_SIZES;

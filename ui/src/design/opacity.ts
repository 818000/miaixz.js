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
 * Theme-controlled opacity values, independent of the underlying brand palette.
 */
export interface MiaixzThemeOpacity {
  /**
   * Opacity of the brand-colored end of a selected navigation gradient.
   */
  readonly navigationSelected?: number;
}

/**
 * Ordered opacity fields shared by theme validation and serialization.
 */
export const miaixzThemeOpacityFields = ["navigationSelected"] as const;

/**
 * Defaults also applied to existing schema-version-one themes.
 */
export const miaixzThemeOpacityDefaults = Object.freeze({ navigationSelected: 0.35 });

/**
 * Inclusive range for theme opacity values.
 */
export const miaixzThemeOpacityRange = Object.freeze({ min: 0, max: 1 });

/**
 * Serializes opacity and its derived semantic color for static and runtime themes.
 *
 * @param opacity - Resolved opacity configuration.
 * @returns Theme-scoped CSS declarations; brand overrides remain reactive.
 */
export function serializeThemeOpacity(opacity: Required<MiaixzThemeOpacity>): string[] {
  return [
    `--miaixz-opacity-navigation-selected: ${opacity.navigationSelected};`,
    "--miaixz-color-navigation-selected: color-mix(in srgb, var(--miaixz-color-brand) calc(var(--miaixz-opacity-navigation-selected) * 100%), transparent);",
  ];
}

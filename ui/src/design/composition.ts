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
 * Defines registered component composition variants selected by a theme.
 *
 * @public
 */
export interface MiaixzThemeComposition {
  /**
   * Entry-page composition.
   */
  readonly entry?: "split" | "centered";
  /**
   * Application-shell navigation composition.
   */
  readonly shell?: "rail" | "sidebar";
  /**
   * Panel composition.
   */
  readonly panel?: "outlined" | "separated";
}

/**
 * Freezes composition field order.
 *
 * @public
 */
export const miaixzThemeCompositionFields = ["entry", "shell", "panel"] as const;

/**
 * Defines the only registered value set for each composition field.
 *
 * @public
 */
export const miaixzThemeCompositionValues = Object.freeze({
  entry: Object.freeze(["split", "centered"] as const),
  shell: Object.freeze(["rail", "sidebar"] as const),
  panel: Object.freeze(["outlined", "separated"] as const),
});

/**
 * Defines schema-version-one composition defaults.
 *
 * @public
 */
export const miaixzThemeCompositionDefaults = Object.freeze({
  entry: "split",
  shell: "rail",
  panel: "outlined",
} as const satisfies Required<MiaixzThemeComposition>);

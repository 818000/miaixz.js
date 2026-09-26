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
 * Defines one structured shadow level in pixels.
 *
 * @public
 */
export interface MiaixzThemeShadowLevel {
  /**
   * Vertical offset in pixels.
   */
  readonly y: number;
  /**
   * Blur radius in pixels.
   */
  readonly blur: number;
  /**
   * Spread radius in pixels.
   */
  readonly spread: number;
}

/**
 * Defines theme-controlled elevation levels.
 *
 * @public
 */
export interface MiaixzThemeShadow {
  /**
   * Low elevation shadow.
   */
  readonly low?: MiaixzThemeShadowLevel;
  /**
   * Medium elevation shadow.
   */
  readonly medium?: MiaixzThemeShadowLevel;
  /**
   * High elevation shadow.
   */
  readonly high?: MiaixzThemeShadowLevel;
  /**
   * Overlay elevation shadow.
   */
  readonly overlay?: MiaixzThemeShadowLevel;
}

/**
 * Freezes the shadow level order used by validators and serializers.
 *
 * @public
 */
export const miaixzThemeShadowLevels = ["low", "medium", "high", "overlay"] as const;

/**
 * Freezes the fields of a structured shadow level.
 *
 * @public
 */
export const miaixzThemeShadowFields = ["y", "blur", "spread"] as const;

/**
 * Defines the accepted shadow value ranges in pixels.
 *
 * @public
 */
export const miaixzThemeShadowRanges = Object.freeze({
  y: Object.freeze({ min: -32, max: 32 }),
  blur: Object.freeze({ min: 0, max: 96 }),
  spread: Object.freeze({ min: -32, max: 32 }),
});

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

import {
  miaixzThemeColorTokens,
  type MiaixzThemeColorOverrides,
  type MiaixzThemeColors,
  type MiaixzThemeColorToken,
  type MiaixzThemeOverrides,
} from "@miaixz/sdk/appearance";

/**
 * Re-exports the SDK-owned ordered color-token source.
 *
 * @public
 */
export { miaixzThemeColorTokens };

/**
 * Re-exports the SDK-owned color-token contract.
 *
 * @public
 */
export type {
  MiaixzThemeColorOverrides,
  MiaixzThemeColors,
  MiaixzThemeColorToken,
  MiaixzThemeOverrides,
};

/**
 * Maps every SDK color token to its public CSS custom property.
 *
 * @public
 */
export const miaixzThemeColorProperties = Object.freeze(
  Object.fromEntries(miaixzThemeColorTokens.map((token) => [token, `--miaixz-color-${token}`])),
) as Readonly<Record<MiaixzThemeColorToken, `--miaixz-color-${MiaixzThemeColorToken}`>>;

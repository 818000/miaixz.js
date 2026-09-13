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
  isMiaixzAppearanceSettings,
  isMiaixzColorMode,
  isMiaixzDensity,
  miaixzColorModes,
  miaixzDefaultAppearance,
  miaixzDensities,
  miaixzThemeColorTokens,
  parseMiaixzAppearanceSettings,
  type MiaixzAppearancePayload,
  type MiaixzAppearanceSettings,
  type MiaixzColorMode,
  type MiaixzDensity,
  type MiaixzResolvedColorMode,
  type MiaixzThemeColorOverrides,
  type MiaixzThemeColorToken,
  type MiaixzThemeOverrides,
} from "@miaixz/sdk/appearance";

export {
  isMiaixzAppearanceSettings,
  isMiaixzColorMode,
  isMiaixzDensity,
  miaixzColorModes,
  miaixzDefaultAppearance,
  miaixzDensities,
  miaixzThemeColorTokens,
  parseMiaixzAppearanceSettings,
};
export type {
  MiaixzAppearancePayload,
  MiaixzAppearanceSettings,
  MiaixzColorMode,
  MiaixzDensity,
  MiaixzResolvedColorMode,
  MiaixzThemeColorOverrides,
  MiaixzThemeColorToken,
  MiaixzThemeOverrides,
};

/**
 * Watches operating-system color preference changes in supported browsers.
 *
 * @param listener - Callback invoked with each changed concrete color mode.
 * @returns Idempotent function that removes the listener.
 * @public
 */
export function watchMiaixzSystemColorMode(
  listener: (mode: MiaixzResolvedColorMode) => void,
): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => undefined;
  }
  const query = window.matchMedia("(prefers-color-scheme: dark)");
  const handleChange = (event: MediaQueryListEvent) => listener(event.matches ? "dark" : "light");
  query.addEventListener("change", handleChange);
  let listening = true;
  return () => {
    if (!listening) return;
    listening = false;
    query.removeEventListener("change", handleChange);
  };
}

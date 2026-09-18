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

import type { MiaixzColorMode, MiaixzResolvedColorMode } from "@miaixz/sdk/appearance";

/**
 * Resolves a user color-mode preference to light or dark.
 *
 * @param colorMode - Light, dark, or system preference.
 * @param systemDark - Current system dark-mode result.
 * @returns Concrete light or dark mode.
 */
export function resolveMiaixzColorMode(
  colorMode: MiaixzColorMode,
  systemDark = readMiaixzSystemDarkPreference(),
): MiaixzResolvedColorMode {
  return colorMode === "system" ? (systemDark ? "dark" : "light") : colorMode;
}

/**
 * Reads the browser dark-mode preference with an SSR-safe light fallback.
 *
 * @returns Whether the browser currently prefers dark colors.
 */
export function readMiaixzSystemDarkPreference(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

/**
 * Subscribes to browser dark-mode preference changes.
 *
 * @param listener - External-store invalidation listener.
 * @returns Function that removes the media-query listener.
 */
export function subscribeMiaixzSystemDarkPreference(listener: () => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => undefined;
  }
  const query = window.matchMedia("(prefers-color-scheme: dark)");
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}

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

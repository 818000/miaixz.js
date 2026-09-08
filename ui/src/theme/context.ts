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

import { createContext, createElement, useContext, type ReactNode } from "react";
import { MiaixzThemeError } from "./errors.js";
import type { ThemeContextValue } from "./types.js";

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * Configures the internal theme context provider.
 */
export interface ThemeContextProviderProps {
  /**
   * Supplies the immutable public runtime value.
   */
  readonly value: ThemeContextValue;
  /**
   * Supplies the themed subtree.
   */
  readonly children: ReactNode;
}

/**
 * Provides one Theme instance's public runtime value.
 *
 * @param props - Context value and themed subtree.
 * @returns React provider element.
 */
export function ThemeContextProvider(props: ThemeContextProviderProps) {
  return createElement(ThemeContext.Provider, { value: props.value }, props.children);
}

/**
 * Returns the nearest Theme runtime context.
 *
 * @returns Active theme state and transactional operations.
 * @throws MiaixzThemeError When called outside Theme.
 * @public
 */
export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (value !== undefined) return value;
  throw new MiaixzThemeError("UI_THEME_INVALID", {
    details: { reason: "provider-missing" },
  });
}

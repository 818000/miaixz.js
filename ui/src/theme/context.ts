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
import type {
  MiaixzThemeComponent,
  MiaixzThemeComponentRegistry,
  ThemeComponents,
} from "./components.js";
import type { ThemeContextValue } from "./types.js";

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
const emptyThemeComponent = Object.freeze({});
const emptyThemeComponents: Readonly<ThemeComponents> = Object.freeze({});

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

/**
 * Returns runtime component configuration without requiring a Theme provider.
 *
 * @param name - Exact public DOM component name registered by the Theme contract.
 * @returns Active inherited component configuration or an immutable empty object.
 * @internal
 */
export function useMiaixzThemeComponent<Name extends keyof MiaixzThemeComponentRegistry>(
  name: Name,
): MiaixzThemeComponent<Name> {
  return (useContext(ThemeContext)?.components[name] ??
    emptyThemeComponent) as MiaixzThemeComponent<Name>;
}

/**
 * Returns the parent component registry for nested Theme composition.
 *
 * @returns The inherited component registry or an immutable empty registry.
 * @internal
 */
export function useMiaixzParentThemeComponents(): Readonly<ThemeComponents> {
  return useContext(ThemeContext)?.components ?? emptyThemeComponents;
}

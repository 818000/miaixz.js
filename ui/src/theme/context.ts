import { createContext, createElement, useContext, type ReactNode } from "react";
import { MiaixzThemeError } from "./errors.js";
import type { ThemeContextValue } from "./theme.types.js";

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

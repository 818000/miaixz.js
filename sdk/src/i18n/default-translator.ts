import type { MiaixzTranslator } from "./i18n.js";

let activeTranslator: MiaixzTranslator = (key, _params, fallback) => fallback ?? key;

/**
 * Resolves a default SDK message without creating a runtime import cycle.
 *
 * @param key - Translation key to resolve.
 * @param params - Optional interpolation values.
 * @param fallback - Optional explicit fallback text.
 * @returns Message resolved by the currently registered default runtime.
 */
export const translateMiaixzDefaultMessage: MiaixzTranslator = (key, params, fallback) =>
  activeTranslator(key, params, fallback);

/**
 * Registers the translator owned by the fully initialized default runtime.
 *
 * @param translator - Default SDK runtime translator.
 */
export function setMiaixzDefaultTranslator(translator: MiaixzTranslator): void {
  activeTranslator = translator;
}

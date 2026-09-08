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

import type { MiaixzTranslator } from "./i18n.js";

/**
 * Resolves messages before a runtime translator is registered.
 *
 * @param key - Translation key to resolve.
 * @param _params - Optional interpolation values.
 * @param fallback - Optional explicit fallback text.
 * @returns The fallback text or untranslated key.
 */
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

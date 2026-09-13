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

import { ThemeCatalog } from "./catalog.js";
import { serializeThemeStyles } from "./serialize.js";
import type { MiaixzThemeDefinition } from "./types.js";

/**
 * Creates first-paint CSS for trusted application themes using the UI theme pipeline.
 * Render in a nonce-bound style element before the appearance bootstrap script.
 * Pass the same definitions to Theme for runtime switching and persistence.
 *
 * @param themes - Application definitions, including any custom parents.
 * @returns Validated light and dark CSS in the existing theme layer.
 * @public
 */
export function createThemeStyles(themes: readonly MiaixzThemeDefinition[]): string {
  const catalog = new ThemeCatalog(themes);
  if (themes.length === 0) return "";
  return [
    "@layer miaixz-themes {",
    ...themes.flatMap(({ name }) => {
      const theme = catalog.get(name);
      return [serializeThemeStyles(theme, "light"), serializeThemeStyles(theme, "dark")];
    }),
    "}",
    "",
  ].join("\n");
}

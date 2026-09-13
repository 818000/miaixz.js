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

import type { MiaixzThemeScriptOptions } from "./types.js";
import { MiaixzThemeError } from "./errors.js";

const themeIdPattern = /^[a-z][a-z0-9-]{0,63}$/;
const builtInThemeIds = ["miaixz", "neutral", "contrast"] as const;

/**
 * Creates a synchronous CSP-compatible first-paint Appearance script.
 *
 * @param options - Exact storage key, fallback, and allowed theme IDs.
 * @returns Inert JavaScript source that reads only local Appearance persistence.
 * @throws MiaixzThemeError When fallback or allowed theme IDs are invalid.
 * @public
 */
export function createThemeScript(options: MiaixzThemeScriptOptions): string {
  if (typeof options.storageKey !== "string" || options.storageKey.length === 0) {
    throw new MiaixzThemeError("UI_THEME_INVALID", {
      details: { path: "storageKey" },
    });
  }
  const themes = [...(options.themes ?? builtInThemeIds)];
  const fallback = options.fallback ?? "miaixz";
  if (
    themes.length === 0 ||
    themes.some((theme) => !themeIdPattern.test(theme)) ||
    new Set(themes).size !== themes.length ||
    !themes.includes(fallback)
  ) {
    throw new MiaixzThemeError("UI_THEME_FALLBACK_INVALID", { theme: fallback });
  }
  return `(()=>{try{const k=${JSON.stringify(options.storageKey)},a=${JSON.stringify(themes)},f=${JSON.stringify(fallback)},d={theme:f,colorMode:"system",density:"standard"};let s=d;try{const e=JSON.parse(localStorage.getItem(k)||"null");if(e&&e.schemaVersion===2&&e.value&&typeof e.value==="object")s=e.value;else if(e&&e.schemaVersion===1&&e.value&&typeof e.value==="object")s={theme:f,colorMode:e.value.colorMode,density:e.value.density}}catch{}const t=a.includes(s.theme)?s.theme:f,p=["light","dark","system"].includes(s.colorMode)?s.colorMode:"system",m=p==="system"?(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):p,n=["compact","standard","comfortable"].includes(s.density)?s.density:"standard",r=document.documentElement;r.setAttribute("data-miaixz-theme",t);r.setAttribute("data-miaixz-color-mode",m);r.setAttribute("data-miaixz-color-preference",p);r.setAttribute("data-miaixz-density",n)}catch{}})();`;
}

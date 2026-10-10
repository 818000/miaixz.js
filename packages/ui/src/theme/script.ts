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

/**
 * Serializes the first-paint theme bootstrap used before React hydration.
 */

import {
  miaixzBaseFontSizes,
  miaixzDefaultAppearance,
  miaixzRadiusScales,
  miaixzShellLayouts,
} from "@miaixz/sdk/appearance";
import { createMiaixzStorageVersionPredicate } from "@miaixz/sdk/storage";
import type { MiaixzThemeScriptOptions } from "./types.js";
import { MiaixzThemeError } from "./error.js";
import { themePresets } from "./presets/index.js";

const themeIdPattern = /^[a-z][a-z0-9-]{0,63}$/;

/**
 * Serializes configuration for an inline script without permitting an HTML parser breakout.
 *
 * @param value - JSON-compatible configuration value.
 * @returns JSON source with HTML-significant and JavaScript line-separator characters escaped.
 */
function serializeInlineScriptValue(value: unknown): string {
  return JSON.stringify(value).replaceAll(/[<>&\u2028\u2029]/gu, (character) => {
    const codePoint = character.codePointAt(0);
    return `\\u${(codePoint ?? 0).toString(16).padStart(4, "0")}`;
  });
}

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
  const themes = [...(options.themes ?? themePresets.map((theme) => theme.name))];
  const fallback = options.fallback ?? miaixzDefaultAppearance.theme;
  if (
    themes.length === 0 ||
    themes.some((theme) => !themeIdPattern.test(theme)) ||
    new Set(themes).size !== themes.length ||
    !themes.includes(fallback)
  ) {
    throw new MiaixzThemeError("UI_THEME_FALLBACK_INVALID", { theme: fallback });
  }
  return `(()=>{try{const k=${serializeInlineScriptValue(options.storageKey)},c=${createMiaixzStorageVersionPredicate()},a=${serializeInlineScriptValue(themes)},f=${serializeInlineScriptValue(fallback)},L=${serializeInlineScriptValue(miaixzShellLayouts)},R=${serializeInlineScriptValue(miaixzRadiusScales)},F=${serializeInlineScriptValue(miaixzBaseFontSizes)},d={theme:f,colorMode:"system",density:"standard"};let s=d;try{const raw=localStorage.getItem(k)??(/^miaixz:[^:]+:[^:]+:appearance$/.test(k)?localStorage.getItem(k.replace(/^miaixz:/,"miaixz:v1:")):null),e=JSON.parse(raw||"null");if(e&&c(e.schemaVersion)&&e.value&&typeof e.value==="object"&&!Array.isArray(e.value))s={...e.value,theme:e.value.theme||f}}catch{}const t=a.includes(s.theme)?s.theme:f,p=["light","dark","system"].includes(s.colorMode)?s.colorMode:"system",m=p==="system"?(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):p,n=["compact","standard","comfortable"].includes(s.density)?s.density:"standard",l=L.includes(s.shellLayout)?s.shellLayout:"vertical",q=R.includes(s.radiusScale)?s.radiusScale:1,z=F.includes(s.baseFontSize)?s.baseFontSize:14,r=document.documentElement;r.setAttribute("data-miaixz-theme",t);r.setAttribute("data-miaixz-color-mode",m);r.setAttribute("data-miaixz-color-preference",p);r.setAttribute("data-miaixz-density",n);r.setAttribute("data-miaixz-shell-layout",l);r.setAttribute("data-miaixz-radius-scale",String(q));r.setAttribute("data-miaixz-base-font-size",String(z))}catch{}})();`;
}

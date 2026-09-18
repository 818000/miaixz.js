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

import { defineTheme } from "../../define.js";

/**
 * Defines the muted yellow-green Olive palette.
 *
 * @public
 */
export const oliveTheme = defineTheme({
  schemaVersion: 1,
  name: "olive",
  label: "Olive",
  version: "1.0.0",
  extends: "miaixz",
  tokens: {
    surfaces: {
      header: { background: "surface" },
      sidebar: { background: "surface" },
    },
  },
  modes: {
    light: {
      colors: {
        brand: "#65702A",
        "on-brand": "#FFFFFF",
        "brand-hover": "#555F23",
        "brand-active": "#454E1C",
        "brand-strong": "#454E1C",
        "brand-soft": "#EEF0D8",
        "brand-soft-hover": "#E3E6C4",
        background: "#F8F8F1",
        surface: "#FFFFFF",
        "surface-secondary": "#FBFBF6",
        "surface-chrome": "#F8F8F1",
        "surface-hover": "#F1F2E6",
        "surface-active": "#E8E9D7",
        "surface-selected": "#EEF0D8",
        "text-primary": "#252719",
        "text-secondary": "#5C6043",
        "text-muted": "#65694B",
        "text-disabled": "#9A9D82",
        "text-inverse": "#FFFFFF",
        border: "#D7D9C0",
        "border-strong": "#73775A",
        focus: "#555F23",
        backdrop: "#17180E7A",
        shadow: "#25271914",
        "shadow-strong": "#25271929",
        selection: "#E3E6C4",
        "data-1": "#65702A",
        "data-neutral": "#65694B",
      },
    },
    dark: {
      colors: {
        brand: "#C1CD74",
        "on-brand": "#17180E",
        "brand-hover": "#CED98A",
        "brand-active": "#AFBC63",
        "brand-strong": "#E3EAAE",
        "brand-soft": "#33391E",
        "brand-soft-hover": "#444B27",
        background: "#17180E",
        surface: "#222416",
        "surface-secondary": "#2D301D",
        "surface-chrome": "#1B1D11",
        "surface-hover": "#383B24",
        "surface-active": "#45482C",
        "surface-selected": "#33391E",
        "text-primary": "#F5F5EC",
        "text-secondary": "#D2D4B9",
        "text-muted": "#B9BCA0",
        "text-disabled": "#797C65",
        "text-inverse": "#17180E",
        border: "#444834",
        "border-strong": "#92967C",
        focus: "#E3EAAE",
        backdrop: "#000000A3",
        shadow: "#00000047",
        "shadow-strong": "#00000070",
        selection: "#444B27",
        "data-1": "#C1CD74",
        "data-neutral": "#B9BCA0",
      },
    },
  },
});

export default oliveTheme;

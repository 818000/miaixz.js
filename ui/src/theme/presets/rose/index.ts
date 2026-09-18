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
 * Defines the muted pink Rose palette.
 *
 * @public
 */
export const roseTheme = defineTheme({
  schemaVersion: 1,
  name: "rose",
  label: "Rose",
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
        brand: "#A33161",
        "on-brand": "#FFFFFF",
        "brand-hover": "#8A2851",
        "brand-active": "#712142",
        "brand-strong": "#712142",
        "brand-soft": "#F8E1EA",
        "brand-soft-hover": "#F1CFDC",
        background: "#FAF3F7",
        surface: "#FFFFFF",
        "surface-secondary": "#FDF9FB",
        "surface-chrome": "#FAF3F7",
        "surface-hover": "#F7EAF0",
        "surface-active": "#EFDCE5",
        "surface-selected": "#F8E1EA",
        "text-primary": "#2A1B22",
        "text-secondary": "#6A4D5B",
        "text-muted": "#735665",
        "text-disabled": "#AA919D",
        "text-inverse": "#FFFFFF",
        border: "#E1CAD5",
        "border-strong": "#806471",
        focus: "#8A2851",
        backdrop: "#190F147A",
        shadow: "#2A1B2214",
        "shadow-strong": "#2A1B2229",
        selection: "#F1CFDC",
        "data-1": "#A33161",
        "data-neutral": "#735665",
      },
    },
    dark: {
      colors: {
        brand: "#F08DB1",
        "on-brand": "#190F14",
        "brand-hover": "#F5A1C0",
        "brand-active": "#D8789C",
        "brand-strong": "#FFC8DB",
        "brand-soft": "#482239",
        "brand-soft-hover": "#5D2B49",
        background: "#190F14",
        surface: "#261920",
        "surface-secondary": "#332129",
        "surface-chrome": "#1E1318",
        "surface-hover": "#3F2932",
        "surface-active": "#4D323D",
        "surface-selected": "#482239",
        "text-primary": "#FAF0F4",
        "text-secondary": "#D9C2CB",
        "text-muted": "#BFA8B2",
        "text-disabled": "#806C75",
        "text-inverse": "#190F14",
        border: "#4F3541",
        "border-strong": "#9E828E",
        focus: "#FFC8DB",
        backdrop: "#000000A3",
        shadow: "#00000047",
        "shadow-strong": "#00000070",
        selection: "#5D2B49",
        "data-1": "#F08DB1",
        "data-neutral": "#BFA8B2",
      },
    },
  },
});

export default roseTheme;

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
 * Defines the warm yellow Amber palette.
 *
 * @public
 */
export const amberTheme = defineTheme({
  schemaVersion: 1,
  name: "amber",
  label: "Amber",
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
        brand: "#9A5C00",
        "on-brand": "#FFFFFF",
        "brand-hover": "#814C00",
        "brand-active": "#693E00",
        "brand-strong": "#693E00",
        "brand-soft": "#FBECCE",
        "brand-soft-hover": "#F4DDAF",
        background: "#FBF7EF",
        surface: "#FFFFFF",
        "surface-secondary": "#FDFBF7",
        "surface-chrome": "#FBF7EF",
        "surface-hover": "#F7F0E3",
        "surface-active": "#EFE5D2",
        "surface-selected": "#FBECCE",
        "text-primary": "#2A2115",
        "text-secondary": "#645642",
        "text-muted": "#6C5D49",
        "text-disabled": "#A69987",
        "text-inverse": "#FFFFFF",
        border: "#DFD3C0",
        "border-strong": "#7B6B55",
        focus: "#814C00",
        backdrop: "#1B150C7A",
        shadow: "#2A211514",
        "shadow-strong": "#2A211529",
        selection: "#F4DDAF",
        "data-1": "#9A5C00",
        "data-neutral": "#6C5D49",
      },
    },
    dark: {
      colors: {
        brand: "#F3BD5D",
        "on-brand": "#1B150C",
        "brand-hover": "#F8CA76",
        "brand-active": "#DFA94A",
        "brand-strong": "#FFE0A0",
        "brand-soft": "#443019",
        "brand-soft-hover": "#5A4020",
        background: "#1B150C",
        surface: "#261F14",
        "surface-secondary": "#33291A",
        "surface-chrome": "#20190F",
        "surface-hover": "#3E321F",
        "surface-active": "#4A3C26",
        "surface-selected": "#443019",
        "text-primary": "#FAF5EA",
        "text-secondary": "#D8CCB8",
        "text-muted": "#BFB29D",
        "text-disabled": "#7F7463",
        "text-inverse": "#1B150C",
        border: "#4C402E",
        "border-strong": "#9B8C75",
        focus: "#FFE0A0",
        backdrop: "#000000A3",
        shadow: "#00000047",
        "shadow-strong": "#00000070",
        selection: "#5A4020",
        "data-1": "#F3BD5D",
        "data-neutral": "#BFB29D",
      },
    },
  },
});

export default amberTheme;

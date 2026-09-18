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
 * Defines the blue-white Porcelain palette.
 *
 * @public
 */
export const porcelainTheme = defineTheme({
  schemaVersion: 1,
  name: "porcelain",
  label: "Porcelain",
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
        brand: "#1E6091",
        "on-brand": "#FFFFFF",
        "brand-hover": "#184F78",
        "brand-active": "#123F61",
        "brand-strong": "#123F61",
        "brand-soft": "#E4F1F7",
        "brand-soft-hover": "#D7E9F2",
        background: "#F3F9FB",
        surface: "#FFFFFF",
        "surface-secondary": "#F7FBFC",
        "surface-chrome": "#F3F9FB",
        "surface-hover": "#EAF4F8",
        "surface-active": "#DDEBF1",
        "surface-selected": "#E4F1F7",
        "text-primary": "#16242D",
        "text-secondary": "#435C69",
        "text-muted": "#4E6571",
        "text-disabled": "#8EA0A8",
        "text-inverse": "#FFFFFF",
        border: "#C9D9E0",
        "border-strong": "#5E7682",
        focus: "#14547E",
        backdrop: "#0C171D7A",
        shadow: "#16242D14",
        "shadow-strong": "#16242D29",
        selection: "#D7E9F2",
        "data-1": "#1E6091",
        "data-neutral": "#4E6571",
      },
    },
    dark: {
      colors: {
        brand: "#78C8F0",
        "on-brand": "#0C171D",
        "brand-hover": "#8FD3F4",
        "brand-active": "#62B5DD",
        "brand-strong": "#B2E3FA",
        "brand-soft": "#173346",
        "brand-soft-hover": "#1D465C",
        background: "#0C171D",
        surface: "#142229",
        "surface-secondary": "#1B2D35",
        "surface-chrome": "#0F1D23",
        "surface-hover": "#223941",
        "surface-active": "#2B4650",
        "surface-selected": "#173346",
        "text-primary": "#EFF7FA",
        "text-secondary": "#BCD0D8",
        "text-muted": "#A5BBC4",
        "text-disabled": "#687C85",
        "text-inverse": "#0C171D",
        border: "#304650",
        "border-strong": "#7F98A2",
        focus: "#B2E3FA",
        backdrop: "#000000A3",
        shadow: "#00000047",
        "shadow-strong": "#00000070",
        selection: "#1D465C",
        "data-1": "#78C8F0",
        "data-neutral": "#A5BBC4",
      },
    },
  },
});

export default porcelainTheme;

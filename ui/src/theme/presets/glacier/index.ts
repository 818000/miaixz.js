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
 * Defines the cool blue Glacier palette.
 *
 * @public
 */
export const glacierTheme = defineTheme({
  schemaVersion: 1,
  name: "glacier",
  label: "Glacier",
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
        brand: "#2563EB",
        "on-brand": "#FFFFFF",
        "brand-hover": "#1D4ED8",
        "brand-active": "#1E40AF",
        "brand-strong": "#1E40AF",
        "brand-soft": "#E8F0FF",
        "brand-soft-hover": "#DCE8FF",
        background: "#F4F7FC",
        surface: "#FFFFFF",
        "surface-secondary": "#F8FAFD",
        "surface-chrome": "#F4F7FC",
        "surface-hover": "#EEF3FA",
        "surface-active": "#E4EBF5",
        "surface-selected": "#E8F0FF",
        "text-primary": "#182033",
        "text-secondary": "#475569",
        "text-muted": "#536176",
        "text-disabled": "#929EAF",
        "text-inverse": "#FFFFFF",
        border: "#CCD6E4",
        "border-strong": "#65748B",
        focus: "#1E40AF",
        backdrop: "#0D14207A",
        shadow: "#18203314",
        "shadow-strong": "#18203329",
        selection: "#DCE8FF",
        "data-1": "#2563EB",
        "data-neutral": "#536176",
      },
    },
    dark: {
      colors: {
        brand: "#79A7FF",
        "on-brand": "#0D1420",
        "brand-hover": "#91B7FF",
        "brand-active": "#6596F2",
        "brand-strong": "#B6CCFF",
        "brand-soft": "#1B2D4A",
        "brand-soft-hover": "#244064",
        background: "#0D1420",
        surface: "#151E2C",
        "surface-secondary": "#1C2738",
        "surface-chrome": "#101925",
        "surface-hover": "#233044",
        "surface-active": "#2B3A50",
        "surface-selected": "#1B2D4A",
        "text-primary": "#F1F5FC",
        "text-secondary": "#C1CAD8",
        "text-muted": "#AAB6C7",
        "text-disabled": "#6F7C90",
        "text-inverse": "#0D1420",
        border: "#334257",
        "border-strong": "#8493A8",
        focus: "#B6CCFF",
        backdrop: "#000000A3",
        shadow: "#00000047",
        "shadow-strong": "#00000070",
        selection: "#244064",
        "data-1": "#79A7FF",
        "data-neutral": "#AAB6C7",
      },
    },
  },
});

export default glacierTheme;

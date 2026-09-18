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
 * Defines the warm orange Copper palette.
 *
 * @public
 */
export const copperTheme = defineTheme({
  schemaVersion: 1,
  name: "copper",
  label: "Copper",
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
        brand: "#A3471C",
        "on-brand": "#FFFFFF",
        "brand-hover": "#893B17",
        "brand-active": "#703013",
        "brand-strong": "#703013",
        "brand-soft": "#F8E5DC",
        "brand-soft-hover": "#F1D3C5",
        background: "#FCF5F1",
        surface: "#FFFFFF",
        "surface-secondary": "#FEFAF8",
        "surface-chrome": "#FCF5F1",
        "surface-hover": "#F8ECE6",
        "surface-active": "#F0DED5",
        "surface-selected": "#F8E5DC",
        "text-primary": "#2B1D17",
        "text-secondary": "#6B5144",
        "text-muted": "#73594C",
        "text-disabled": "#AA9488",
        "text-inverse": "#FFFFFF",
        border: "#E2CEC4",
        "border-strong": "#80675B",
        focus: "#893B17",
        backdrop: "#1B120E7A",
        shadow: "#2B1D1714",
        "shadow-strong": "#2B1D1729",
        selection: "#F1D3C5",
        "data-1": "#A3471C",
        "data-neutral": "#73594C",
      },
    },
    dark: {
      colors: {
        brand: "#F29A70",
        "on-brand": "#1B120E",
        "brand-hover": "#F7AC88",
        "brand-active": "#DC845D",
        "brand-strong": "#FFD0B8",
        "brand-soft": "#47291B",
        "brand-soft-hover": "#5D3623",
        background: "#1B120E",
        surface: "#271B16",
        "surface-secondary": "#34241D",
        "surface-chrome": "#201611",
        "surface-hover": "#402C23",
        "surface-active": "#4D352A",
        "surface-selected": "#47291B",
        "text-primary": "#FAF2EE",
        "text-secondary": "#DBC7BD",
        "text-muted": "#C0ACA2",
        "text-disabled": "#806F66",
        "text-inverse": "#1B120E",
        border: "#503B31",
        "border-strong": "#9F887D",
        focus: "#FFD0B8",
        backdrop: "#000000A3",
        shadow: "#00000047",
        "shadow-strong": "#00000070",
        selection: "#5D3623",
        "data-1": "#F29A70",
        "data-neutral": "#C0ACA2",
      },
    },
  },
});

export default copperTheme;

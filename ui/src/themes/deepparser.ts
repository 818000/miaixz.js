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

import { defineTheme, miaixzTheme } from "../theme/index.js";

/**
 * Defines DeepParser's blue-violet palette using the shared Miaixz geometry and status colors.
 * Light colors follow dev.deepparser.cn; dark colors are a complementary accessible palette.
 *
 * @public
 */
export const deepparserTheme = defineTheme({
  ...miaixzTheme,
  name: "deepparser",
  extends: "miaixz",
  label: "DeepParser",
  tokens: {
    ...miaixzTheme.tokens,
    opacity: { ...miaixzTheme.tokens?.opacity, navigationSelected: 0.16 },
    surfaces: {
      ...miaixzTheme.tokens?.surfaces,
      header: {
        ...miaixzTheme.tokens?.surfaces?.header,
        background: "surface",
      },
      sidebar: {
        ...miaixzTheme.tokens?.surfaces?.sidebar,
        background: "surface",
      },
    },
  },
  modes: {
    light: {
      colors: {
        ...miaixzTheme.modes.light.colors,
        brand: "#302DF0",
        "on-brand": "#FFFFFF",
        "brand-hover": "#2825D4",
        "brand-active": "#211EBA",
        "brand-strong": "#2825D4",
        "brand-soft": "#F0F4FF",
        "brand-soft-hover": "#E5E9FF",
        background: "#EEF2FF",
        surface: "#FFFFFF",
        "surface-secondary": "#F7F8FA",
        "surface-chrome": "#EEF2FF",
        "surface-hover": "#F7F8FA",
        "surface-active": "#E5E9FF",
        "surface-selected": "#F7F7FE",
        "text-primary": "#1D2129",
        "text-secondary": "#5D5F65",
        "text-muted": "#616875",
        "text-disabled": "#9299A5",
        "text-inverse": "#FFFFFF",
        border: "#E5E6EB",
        "border-strong": "#7C8494",
        focus: "#302DF0",
        backdrop: "#11121A7A",
        shadow: "#1D212914",
        "shadow-strong": "#1D212929",
        selection: "#E5E9FF",
        "data-1": "#302DF0",
        "data-neutral": "#616875",
      },
    },
    dark: {
      colors: {
        ...miaixzTheme.modes.dark.colors,
        brand: "#8B88FF",
        "on-brand": "#141329",
        "brand-hover": "#9D9AFF",
        "brand-active": "#7C79ED",
        "brand-strong": "#B1AEFF",
        "brand-soft": "#29264A",
        "brand-soft-hover": "#35315C",
        background: "#11121A",
        surface: "#191B27",
        "surface-secondary": "#222536",
        "surface-chrome": "#11121A",
        "surface-hover": "#282B3D",
        "surface-active": "#34374B",
        "surface-selected": "#29264A",
        "text-primary": "#F1F2F8",
        "text-secondary": "#B7BDCD",
        "text-muted": "#A2AABD",
        "text-disabled": "#697286",
        "text-inverse": "#141329",
        border: "#34384B",
        "border-strong": "#858EA6",
        focus: "#B1AEFF",
        selection: "#35315C",
        "data-1": "#8B88FF",
        "data-neutral": "#A2AABD",
      },
    },
  },
});

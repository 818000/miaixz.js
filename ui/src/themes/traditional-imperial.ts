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

import { defineTheme } from "../theme/index.js";

/**
 * Defines a palace-wall vermilion palette with gold and mineral accents.
 *
 * @public
 */
export const vermilionTheme = defineTheme({
  schemaVersion: 1,
  name: "vermilion",
  label: "紫禁朱垣",
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
        brand: "#8F2D24",
        "on-brand": "#FFFFFF",
        "brand-hover": "#78241E",
        "brand-active": "#611D18",
        "brand-strong": "#611D18",
        "brand-soft": "#F4E1DD",
        "brand-soft-hover": "#EBCFC9",
        background: "#F8F3ED",
        surface: "#FFFDF9",
        "surface-secondary": "#FBF7F2",
        "surface-chrome": "#FFFDF9",
        "surface-hover": "#F3E9E1",
        "surface-active": "#EADCD1",
        "surface-selected": "#F4E1DD",
        "text-primary": "#2A1D18",
        "text-secondary": "#655047",
        "text-muted": "#6E584F",
        "text-disabled": "#A59289",
        "text-inverse": "#FFFFFF",
        border: "#DDCEC4",
        "border-strong": "#79665D",
        focus: "#78241E",
        selection: "#EBCFC9",
        "data-1": "#8F2D24",
        "data-2": "#8B6823",
        "data-3": "#285D78",
        "data-4": "#356B55",
        "data-5": "#76506F",
        "data-6": "#9C5738",
        "data-7": "#526C7A",
        "data-8": "#6E6A25",
        "data-neutral": "#6E584F",
      },
    },
    dark: {
      colors: {
        brand: "#EF8C80",
        "on-brand": "#1A1210",
        "brand-hover": "#F3A196",
        "brand-active": "#D9786D",
        "brand-strong": "#FFC2BA",
        "brand-soft": "#47221E",
        "brand-soft-hover": "#5C2B26",
        background: "#1A1210",
        surface: "#271A16",
        "surface-secondary": "#33231E",
        "surface-chrome": "#271A16",
        "surface-hover": "#3E2B25",
        "surface-active": "#4B342C",
        "surface-selected": "#47221E",
        "text-primary": "#FAF2ED",
        "text-secondary": "#D9C4B9",
        "text-muted": "#C0AAA0",
        "text-disabled": "#806F67",
        "text-inverse": "#1A1210",
        border: "#4F3A32",
        "border-strong": "#9E867B",
        focus: "#FFC2BA",
        selection: "#5C2B26",
        "data-1": "#EF8C80",
        "data-2": "#D8B55D",
        "data-3": "#7AB9D2",
        "data-4": "#83BFA4",
        "data-5": "#C9A1C2",
        "data-6": "#E6A07E",
        "data-7": "#91A9C0",
        "data-8": "#CBC576",
        "data-neutral": "#C0AAA0",
      },
    },
  },
});

/**
 * Defines a glazed imperial gold palette with red and green accents.
 *
 * @public
 */
export const imperialGoldTheme = defineTheme({
  schemaVersion: 1,
  name: "imperial-gold",
  label: "琉璃金瓦",
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
        brand: "#806000",
        "on-brand": "#FFFFFF",
        "brand-hover": "#6B5000",
        "brand-active": "#554000",
        "brand-strong": "#554000",
        "brand-soft": "#F4EAC8",
        "brand-soft-hover": "#EADDAE",
        background: "#FAF7ED",
        surface: "#FFFFFF",
        "surface-secondary": "#FCFAF4",
        "surface-chrome": "#FFFFFF",
        "surface-hover": "#F4EFE1",
        "surface-active": "#EAE2CF",
        "surface-selected": "#F4EAC8",
        "text-primary": "#292316",
        "text-secondary": "#645A40",
        "text-muted": "#6C6248",
        "text-disabled": "#A49B84",
        "text-inverse": "#FFFFFF",
        border: "#DCD4BF",
        "border-strong": "#786E56",
        focus: "#6B5000",
        selection: "#EADDAE",
        "data-1": "#806000",
        "data-2": "#8F2D24",
        "data-3": "#356B55",
        "data-4": "#285D78",
        "data-5": "#76506F",
        "data-6": "#9C5738",
        "data-7": "#526C7A",
        "data-8": "#5F6536",
        "data-neutral": "#6C6248",
      },
    },
    dark: {
      colors: {
        brand: "#E4C35F",
        "on-brand": "#18150D",
        "brand-hover": "#ECD174",
        "brand-active": "#CFAD4E",
        "brand-strong": "#F7E3A0",
        "brand-soft": "#413619",
        "brand-soft-hover": "#554720",
        background: "#18150D",
        surface: "#242015",
        "surface-secondary": "#302A1B",
        "surface-chrome": "#242015",
        "surface-hover": "#3B3320",
        "surface-active": "#48402A",
        "surface-selected": "#413619",
        "text-primary": "#FAF6EA",
        "text-secondary": "#D9CEB2",
        "text-muted": "#C0B595",
        "text-disabled": "#807762",
        "text-inverse": "#18150D",
        border: "#4D442E",
        "border-strong": "#9C9074",
        focus: "#F7E3A0",
        selection: "#554720",
        "data-1": "#E4C35F",
        "data-2": "#EF8C80",
        "data-3": "#83BFA4",
        "data-4": "#7AB9D2",
        "data-5": "#C9A1C2",
        "data-6": "#E6A07E",
        "data-7": "#91A9C0",
        "data-8": "#A9C79C",
        "data-neutral": "#C0B595",
      },
    },
  },
});

/**
 * Defines a mineral blue palette with green and gold accents.
 *
 * @public
 */
export const mineralBlueTheme = defineTheme({
  schemaVersion: 1,
  name: "mineral-blue",
  label: "石青丹碧",
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
        brand: "#285D78",
        "on-brand": "#FFFFFF",
        "brand-hover": "#204D64",
        "brand-active": "#193E50",
        "brand-strong": "#193E50",
        "brand-soft": "#E2EDF1",
        "brand-soft-hover": "#D2E2E8",
        background: "#F2F7F8",
        surface: "#FFFFFF",
        "surface-secondary": "#F7FAFB",
        "surface-chrome": "#FFFFFF",
        "surface-hover": "#EAF1F3",
        "surface-active": "#DDE8EC",
        "surface-selected": "#E2EDF1",
        "text-primary": "#17262D",
        "text-secondary": "#455E69",
        "text-muted": "#506973",
        "text-disabled": "#91A1A8",
        "text-inverse": "#FFFFFF",
        border: "#CAD9DE",
        "border-strong": "#607782",
        focus: "#204D64",
        selection: "#D2E2E8",
        "data-1": "#285D78",
        "data-2": "#356B55",
        "data-3": "#8B6823",
        "data-4": "#8F2D24",
        "data-5": "#76506F",
        "data-6": "#9C5738",
        "data-7": "#526C7A",
        "data-8": "#6E6A25",
        "data-neutral": "#506973",
      },
    },
    dark: {
      colors: {
        brand: "#7AB9D2",
        "on-brand": "#0D171C",
        "brand-hover": "#90C6DB",
        "brand-active": "#66A6BF",
        "brand-strong": "#B5DCEB",
        "brand-soft": "#193541",
        "brand-soft-hover": "#204755",
        background: "#0D171C",
        surface: "#15242A",
        "surface-secondary": "#1D3037",
        "surface-chrome": "#15242A",
        "surface-hover": "#253C44",
        "surface-active": "#2E4952",
        "surface-selected": "#193541",
        "text-primary": "#EFF7F9",
        "text-secondary": "#BDD0D6",
        "text-muted": "#A6BBC2",
        "text-disabled": "#697D84",
        "text-inverse": "#0D171C",
        border: "#324951",
        "border-strong": "#82979E",
        focus: "#B5DCEB",
        selection: "#204755",
        "data-1": "#7AB9D2",
        "data-2": "#83BFA4",
        "data-3": "#D8B55D",
        "data-4": "#EF8C80",
        "data-5": "#C9A1C2",
        "data-6": "#E6A07E",
        "data-7": "#91A9C0",
        "data-8": "#CBC576",
        "data-neutral": "#A6BBC2",
      },
    },
  },
});

/**
 * Defines a mineral green palette with blue and ochre accents.
 *
 * @public
 */
export const mineralGreenTheme = defineTheme({
  schemaVersion: 1,
  name: "mineral-green",
  label: "石绿斗拱",
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
        brand: "#356B55",
        "on-brand": "#FFFFFF",
        "brand-hover": "#2B5A47",
        "brand-active": "#234939",
        "brand-strong": "#234939",
        "brand-soft": "#E1EEE8",
        "brand-soft-hover": "#D1E3DA",
        background: "#F3F8F5",
        surface: "#FFFFFF",
        "surface-secondary": "#F8FBF9",
        "surface-chrome": "#FFFFFF",
        "surface-hover": "#EBF2EE",
        "surface-active": "#DEE9E3",
        "surface-selected": "#E1EEE8",
        "text-primary": "#192720",
        "text-secondary": "#485F54",
        "text-muted": "#526A5E",
        "text-disabled": "#93A39B",
        "text-inverse": "#FFFFFF",
        border: "#CCDAD3",
        "border-strong": "#62796E",
        focus: "#2B5A47",
        selection: "#D1E3DA",
        "data-1": "#356B55",
        "data-2": "#285D78",
        "data-3": "#8B6823",
        "data-4": "#8F2D24",
        "data-5": "#76506F",
        "data-6": "#9C5738",
        "data-7": "#526C7A",
        "data-8": "#6E6A25",
        "data-neutral": "#526A5E",
      },
    },
    dark: {
      colors: {
        brand: "#83BFA4",
        "on-brand": "#0D1713",
        "brand-hover": "#98CCB4",
        "brand-active": "#70AD91",
        "brand-strong": "#BDE2D0",
        "brand-soft": "#1C382D",
        "brand-soft-hover": "#254A3B",
        background: "#0D1713",
        surface: "#16241E",
        "surface-secondary": "#1E3028",
        "surface-chrome": "#16241E",
        "surface-hover": "#273C33",
        "surface-active": "#30493D",
        "surface-selected": "#1C382D",
        "text-primary": "#EFF7F2",
        "text-secondary": "#BFD2C8",
        "text-muted": "#A8BDB2",
        "text-disabled": "#6B7E74",
        "text-inverse": "#0D1713",
        border: "#344A40",
        "border-strong": "#84998F",
        focus: "#BDE2D0",
        selection: "#254A3B",
        "data-1": "#83BFA4",
        "data-2": "#7AB9D2",
        "data-3": "#D8B55D",
        "data-4": "#EF8C80",
        "data-5": "#C9A1C2",
        "data-6": "#E6A07E",
        "data-7": "#91A9C0",
        "data-8": "#CBC576",
        "data-neutral": "#A8BDB2",
      },
    },
  },
});

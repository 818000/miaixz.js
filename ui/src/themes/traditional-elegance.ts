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
 * Defines a clear-sky blue palette with restrained botanical accents.
 *
 * @public
 */
export const clearSkyTheme = defineTheme({
  schemaVersion: 1,
  name: "clear-sky",
  label: "霁青",
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
        brand: "#1D4F73",
        "on-brand": "#FFFFFF",
        "brand-hover": "#18425F",
        "brand-active": "#12354D",
        "brand-strong": "#12354D",
        "brand-soft": "#E1EAF2",
        "brand-soft-hover": "#D2DFEB",
        background: "#F1F5F8",
        surface: "#FFFFFF",
        "surface-secondary": "#F7F9FB",
        "surface-chrome": "#FFFFFF",
        "surface-hover": "#E8EEF3",
        "surface-active": "#DDE6EC",
        "surface-selected": "#E1EAF2",
        "text-primary": "#18232D",
        "text-secondary": "#485B6B",
        "text-muted": "#526575",
        "text-disabled": "#93A0AB",
        "text-inverse": "#FFFFFF",
        border: "#CBD5DE",
        "border-strong": "#627282",
        focus: "#18425F",
        selection: "#D2DFEB",
        "data-1": "#1D4F73",
        "data-2": "#55704D",
        "data-3": "#8A6112",
        "data-4": "#943653",
        "data-5": "#76506F",
        "data-6": "#8A4B34",
        "data-7": "#526C7A",
        "data-8": "#6E6A25",
        "data-neutral": "#526575",
      },
    },
    dark: {
      colors: {
        brand: "#74A9D4",
        "on-brand": "#0B1420",
        "brand-hover": "#8AB9DE",
        "brand-active": "#6097C2",
        "brand-strong": "#B3D4EE",
        "brand-soft": "#1A3048",
        "brand-soft-hover": "#22415F",
        background: "#0B1420",
        surface: "#141E2A",
        "surface-secondary": "#1C2937",
        "surface-chrome": "#141E2A",
        "surface-hover": "#243444",
        "surface-active": "#2D4053",
        "surface-selected": "#1A3048",
        "text-primary": "#F0F4F8",
        "text-secondary": "#C0CAD5",
        "text-muted": "#A8B4C1",
        "text-disabled": "#6C7885",
        "text-inverse": "#0B1420",
        border: "#334353",
        "border-strong": "#82909F",
        focus: "#B3D4EE",
        selection: "#22415F",
        "data-1": "#74A9D4",
        "data-2": "#A9C79C",
        "data-3": "#E3BD68",
        "data-4": "#EB8DA8",
        "data-5": "#C9A1C2",
        "data-6": "#E3A083",
        "data-7": "#91A9C0",
        "data-8": "#CBC576",
        "data-neutral": "#A8B4C1",
      },
    },
  },
});

/**
 * Defines a mountain-dai blue-gray palette with muted mineral accents.
 *
 * @public
 */
export const mountainDaiTheme = defineTheme({
  schemaVersion: 1,
  name: "mountain-dai",
  label: "远山黛",
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
        brand: "#354A5F",
        "on-brand": "#FFFFFF",
        "brand-hover": "#2B3D4F",
        "brand-active": "#223140",
        "brand-strong": "#223140",
        "brand-soft": "#E5EAF0",
        "brand-soft-hover": "#D8E0E8",
        background: "#F3F5F7",
        surface: "#FFFFFF",
        "surface-secondary": "#F8F9FA",
        "surface-chrome": "#FFFFFF",
        "surface-hover": "#EBEFF2",
        "surface-active": "#E0E5EA",
        "surface-selected": "#E5EAF0",
        "text-primary": "#1C242C",
        "text-secondary": "#505D69",
        "text-muted": "#5B6874",
        "text-disabled": "#959EA7",
        "text-inverse": "#FFFFFF",
        border: "#CED4DA",
        "border-strong": "#6B7680",
        focus: "#2B3D4F",
        selection: "#D8E0E8",
        "data-1": "#354A5F",
        "data-2": "#8F2D24",
        "data-3": "#806000",
        "data-4": "#356B55",
        "data-5": "#76506F",
        "data-6": "#9C5738",
        "data-7": "#285D78",
        "data-8": "#6E6A25",
        "data-neutral": "#5B6874",
      },
    },
    dark: {
      colors: {
        brand: "#91A9C0",
        "on-brand": "#10151B",
        "brand-hover": "#A5B9CC",
        "brand-active": "#7E97AF",
        "brand-strong": "#CBD9E5",
        "brand-soft": "#293542",
        "brand-soft-hover": "#364656",
        background: "#10151B",
        surface: "#192129",
        "surface-secondary": "#232D37",
        "surface-chrome": "#192129",
        "surface-hover": "#2D3945",
        "surface-active": "#394754",
        "surface-selected": "#293542",
        "text-primary": "#F2F4F6",
        "text-secondary": "#C8CED5",
        "text-muted": "#B0B8C0",
        "text-disabled": "#727B84",
        "text-inverse": "#10151B",
        border: "#3A4652",
        "border-strong": "#87919B",
        focus: "#CBD9E5",
        selection: "#364656",
        "data-1": "#91A9C0",
        "data-2": "#EF8C80",
        "data-3": "#E4C35F",
        "data-4": "#83BFA4",
        "data-5": "#C9A1C2",
        "data-6": "#E6A07E",
        "data-7": "#7AB9D2",
        "data-8": "#CBC576",
        "data-neutral": "#B0B8C0",
      },
    },
  },
});

/**
 * Defines a rouge palette with restrained blue, green, and gold accents.
 *
 * @public
 */
export const rougeTheme = defineTheme({
  schemaVersion: 1,
  name: "rouge",
  label: "胭脂",
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
        brand: "#943653",
        "on-brand": "#FFFFFF",
        "brand-hover": "#7C2C45",
        "brand-active": "#642337",
        "brand-strong": "#642337",
        "brand-soft": "#F4E2E8",
        "brand-soft-hover": "#EBCFD9",
        background: "#FAF3F5",
        surface: "#FFFFFF",
        "surface-secondary": "#FDF9FA",
        "surface-chrome": "#FFFFFF",
        "surface-hover": "#F5E9ED",
        "surface-active": "#ECDCE2",
        "surface-selected": "#F4E2E8",
        "text-primary": "#2A1B21",
        "text-secondary": "#684D58",
        "text-muted": "#725762",
        "text-disabled": "#AA929B",
        "text-inverse": "#FFFFFF",
        border: "#E0CAD2",
        "border-strong": "#7E646E",
        focus: "#7C2C45",
        selection: "#EBCFD9",
        "data-1": "#943653",
        "data-2": "#285D78",
        "data-3": "#806000",
        "data-4": "#356B55",
        "data-5": "#76506F",
        "data-6": "#9C5738",
        "data-7": "#526C7A",
        "data-8": "#6E6A25",
        "data-neutral": "#725762",
      },
    },
    dark: {
      colors: {
        brand: "#EB8DA8",
        "on-brand": "#190F14",
        "brand-hover": "#F1A0B8",
        "brand-active": "#D77996",
        "brand-strong": "#FFC6D5",
        "brand-soft": "#472337",
        "brand-soft-hover": "#5B2C46",
        background: "#190F14",
        surface: "#26191F",
        "surface-secondary": "#332129",
        "surface-chrome": "#26191F",
        "surface-hover": "#3F2932",
        "surface-active": "#4D333D",
        "surface-selected": "#472337",
        "text-primary": "#FAF0F3",
        "text-secondary": "#D9C2CA",
        "text-muted": "#BFA8B1",
        "text-disabled": "#806C74",
        "text-inverse": "#190F14",
        border: "#4F3540",
        "border-strong": "#9E828C",
        focus: "#FFC6D5",
        selection: "#5B2C46",
        "data-1": "#EB8DA8",
        "data-2": "#7AB9D2",
        "data-3": "#E4C35F",
        "data-4": "#83BFA4",
        "data-5": "#C9A1C2",
        "data-6": "#E6A07E",
        "data-7": "#91A9C0",
        "data-8": "#CBC576",
        "data-neutral": "#BFA8B1",
      },
    },
  },
});

/**
 * Defines a muted lotus-root purple palette with soft mineral accents.
 *
 * @public
 */
export const lotusRootTheme = defineTheme({
  schemaVersion: 1,
  name: "lotus-root",
  label: "藕荷",
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
        brand: "#76506F",
        "on-brand": "#FFFFFF",
        "brand-hover": "#63435D",
        "brand-active": "#50364B",
        "brand-strong": "#50364B",
        "brand-soft": "#EEE4EC",
        "brand-soft-hover": "#E3D4E0",
        background: "#F8F3F7",
        surface: "#FFFFFF",
        "surface-secondary": "#FBF8FA",
        "surface-chrome": "#FFFFFF",
        "surface-hover": "#F2EAEF",
        "surface-active": "#E8DDE5",
        "surface-selected": "#EEE4EC",
        "text-primary": "#261E25",
        "text-secondary": "#62515F",
        "text-muted": "#6C5B69",
        "text-disabled": "#A398A1",
        "text-inverse": "#FFFFFF",
        border: "#D9CED6",
        "border-strong": "#756873",
        focus: "#63435D",
        selection: "#E3D4E0",
        "data-1": "#76506F",
        "data-2": "#356B55",
        "data-3": "#806000",
        "data-4": "#285D78",
        "data-5": "#943653",
        "data-6": "#9C5738",
        "data-7": "#526C7A",
        "data-8": "#6E6A25",
        "data-neutral": "#6C5B69",
      },
    },
    dark: {
      colors: {
        brand: "#C9A1C2",
        "on-brand": "#181219",
        "brand-hover": "#D4B2CE",
        "brand-active": "#B58DAD",
        "brand-strong": "#EBD2E6",
        "brand-soft": "#3B2A38",
        "brand-soft-hover": "#4D3749",
        background: "#181219",
        surface: "#241B23",
        "surface-secondary": "#30242E",
        "surface-chrome": "#241B23",
        "surface-hover": "#3B2D39",
        "surface-active": "#483745",
        "surface-selected": "#3B2A38",
        "text-primary": "#F7F1F6",
        "text-secondary": "#D4C6D1",
        "text-muted": "#BAACB7",
        "text-disabled": "#7A6F78",
        "text-inverse": "#181219",
        border: "#493A46",
        "border-strong": "#92838F",
        focus: "#EBD2E6",
        selection: "#4D3749",
        "data-1": "#C9A1C2",
        "data-2": "#83BFA4",
        "data-3": "#E4C35F",
        "data-4": "#7AB9D2",
        "data-5": "#EB8DA8",
        "data-6": "#E6A07E",
        "data-7": "#91A9C0",
        "data-8": "#CBC576",
        "data-neutral": "#BAACB7",
      },
    },
  },
});

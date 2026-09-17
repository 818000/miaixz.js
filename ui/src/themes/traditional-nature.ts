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
 * Defines a Ru-celadon palette with quiet green-blue surfaces.
 *
 * @public
 */
export const ruCeladonTheme = defineTheme({
  schemaVersion: 1,
  name: "ru-celadon",
  label: "汝瓷天青",
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
        brand: "#4C716D",
        "on-brand": "#FFFFFF",
        "brand-hover": "#3E5F5B",
        "brand-active": "#324D49",
        "brand-strong": "#324D49",
        "brand-soft": "#E3EDEA",
        "brand-soft-hover": "#D5E3DF",
        background: "#F3F7F5",
        surface: "#FFFFFF",
        "surface-secondary": "#F8FAF9",
        "surface-chrome": "#FFFFFF",
        "surface-hover": "#EBF1EE",
        "surface-active": "#DFE8E4",
        "surface-selected": "#E3EDEA",
        "text-primary": "#1B2725",
        "text-secondary": "#4D615E",
        "text-muted": "#586C69",
        "text-disabled": "#96A4A1",
        "text-inverse": "#FFFFFF",
        border: "#CEDAD6",
        "border-strong": "#687B78",
        focus: "#3E5F5B",
        selection: "#D5E3DF",
        "data-1": "#4C716D",
        "data-2": "#806000",
        "data-3": "#285D78",
        "data-4": "#943653",
        "data-5": "#76506F",
        "data-6": "#9C5738",
        "data-7": "#55704D",
        "data-8": "#6E6A25",
        "data-neutral": "#586C69",
      },
    },
    dark: {
      colors: {
        brand: "#A5C9C1",
        "on-brand": "#0E1715",
        "brand-hover": "#B6D4CD",
        "brand-active": "#91B7AE",
        "brand-strong": "#D5E9E4",
        "brand-soft": "#293E39",
        "brand-soft-hover": "#36514B",
        background: "#0E1715",
        surface: "#17231F",
        "surface-secondary": "#202F2A",
        "surface-chrome": "#17231F",
        "surface-hover": "#2A3B35",
        "surface-active": "#34483F",
        "surface-selected": "#293E39",
        "text-primary": "#F0F7F4",
        "text-secondary": "#C4D2CE",
        "text-muted": "#ACBDB8",
        "text-disabled": "#6E7D79",
        "text-inverse": "#0E1715",
        border: "#374943",
        "border-strong": "#879894",
        focus: "#D5E9E4",
        selection: "#36514B",
        "data-1": "#A5C9C1",
        "data-2": "#E4C35F",
        "data-3": "#7AB9D2",
        "data-4": "#EB8DA8",
        "data-5": "#C9A1C2",
        "data-6": "#E6A07E",
        "data-7": "#A9C79C",
        "data-8": "#CBC576",
        "data-neutral": "#ACBDB8",
      },
    },
  },
});

/**
 * Defines a pine-pollen green palette with celadon and gold accents.
 *
 * @public
 */
export const pinePollenTheme = defineTheme({
  schemaVersion: 1,
  name: "pine-pollen",
  label: "松花",
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
        brand: "#55704D",
        "on-brand": "#FFFFFF",
        "brand-hover": "#475F40",
        "brand-active": "#394D34",
        "brand-strong": "#394D34",
        "brand-soft": "#E7EEE3",
        "brand-soft-hover": "#D9E4D4",
        background: "#F5F7F2",
        surface: "#FFFFFF",
        "surface-secondary": "#F9FAF7",
        "surface-chrome": "#FFFFFF",
        "surface-hover": "#EDF1E9",
        "surface-active": "#E3E9DE",
        "surface-selected": "#E7EEE3",
        "text-primary": "#20281D",
        "text-secondary": "#53634E",
        "text-muted": "#5E6E59",
        "text-disabled": "#99A494",
        "text-inverse": "#FFFFFF",
        border: "#D2DBCE",
        "border-strong": "#6D7C68",
        focus: "#475F40",
        selection: "#D9E4D4",
        "data-1": "#55704D",
        "data-2": "#806000",
        "data-3": "#285D78",
        "data-4": "#943653",
        "data-5": "#76506F",
        "data-6": "#9C5738",
        "data-7": "#4C716D",
        "data-8": "#6E6A25",
        "data-neutral": "#5E6E59",
      },
    },
    dark: {
      colors: {
        brand: "#A9C79C",
        "on-brand": "#11170F",
        "brand-hover": "#B9D2AF",
        "brand-active": "#96B58A",
        "brand-strong": "#D6E6D0",
        "brand-soft": "#2D3E28",
        "brand-soft-hover": "#3B5134",
        background: "#11170F",
        surface: "#1A2317",
        "surface-secondary": "#242F20",
        "surface-chrome": "#1A2317",
        "surface-hover": "#2E3B29",
        "surface-active": "#394833",
        "surface-selected": "#2D3E28",
        "text-primary": "#F2F7EF",
        "text-secondary": "#C8D4C3",
        "text-muted": "#B0BEAB",
        "text-disabled": "#727E6E",
        "text-inverse": "#11170F",
        border: "#3B4937",
        "border-strong": "#8B9986",
        focus: "#D6E6D0",
        selection: "#3B5134",
        "data-1": "#A9C79C",
        "data-2": "#E4C35F",
        "data-3": "#7AB9D2",
        "data-4": "#EB8DA8",
        "data-5": "#C9A1C2",
        "data-6": "#E6A07E",
        "data-7": "#A5C9C1",
        "data-8": "#CBC576",
        "data-neutral": "#B0BEAB",
      },
    },
  },
});

/**
 * Defines an autumn-incense yellow-green palette with mineral accents.
 *
 * @public
 */
export const autumnIncenseTheme = defineTheme({
  schemaVersion: 1,
  name: "autumn-incense",
  label: "秋香",
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
        brand: "#6E6A25",
        "on-brand": "#FFFFFF",
        "brand-hover": "#5C591F",
        "brand-active": "#494719",
        "brand-strong": "#494719",
        "brand-soft": "#EFEDD5",
        "brand-soft-hover": "#E5E2C1",
        background: "#F8F7EF",
        surface: "#FFFFFF",
        "surface-secondary": "#FBFAF6",
        "surface-chrome": "#FFFFFF",
        "surface-hover": "#F2F0E4",
        "surface-active": "#E9E6D6",
        "surface-selected": "#EFEDD5",
        "text-primary": "#272619",
        "text-secondary": "#606045",
        "text-muted": "#69694E",
        "text-disabled": "#9E9E84",
        "text-inverse": "#FFFFFF",
        border: "#DAD9C3",
        "border-strong": "#77775D",
        focus: "#5C591F",
        selection: "#E5E2C1",
        "data-1": "#6E6A25",
        "data-2": "#76506F",
        "data-3": "#356B55",
        "data-4": "#285D78",
        "data-5": "#943653",
        "data-6": "#9C5738",
        "data-7": "#4C716D",
        "data-8": "#806000",
        "data-neutral": "#69694E",
      },
    },
    dark: {
      colors: {
        brand: "#CBC576",
        "on-brand": "#18170E",
        "brand-hover": "#D6D087",
        "brand-active": "#B8B164",
        "brand-strong": "#E9E5AD",
        "brand-soft": "#39371D",
        "brand-soft-hover": "#4B4826",
        background: "#18170E",
        surface: "#232216",
        "surface-secondary": "#2F2E1D",
        "surface-chrome": "#232216",
        "surface-hover": "#3A3925",
        "surface-active": "#47452C",
        "surface-selected": "#39371D",
        "text-primary": "#F6F5EC",
        "text-secondary": "#D4D2B9",
        "text-muted": "#BBB9A0",
        "text-disabled": "#7B7965",
        "text-inverse": "#18170E",
        border: "#484735",
        "border-strong": "#95937C",
        focus: "#E9E5AD",
        selection: "#4B4826",
        "data-1": "#CBC576",
        "data-2": "#C9A1C2",
        "data-3": "#83BFA4",
        "data-4": "#7AB9D2",
        "data-5": "#EB8DA8",
        "data-6": "#E6A07E",
        "data-7": "#A5C9C1",
        "data-8": "#E4C35F",
        "data-neutral": "#BBB9A0",
      },
    },
  },
});

/**
 * Defines a xuan-ink monochrome palette with traditional color accents.
 *
 * @public
 */
export const xuanInkTheme = defineTheme({
  schemaVersion: 1,
  name: "xuan-ink",
  label: "玄墨",
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
        brand: "#34373D",
        "on-brand": "#FFFFFF",
        "brand-hover": "#292C31",
        "brand-active": "#1F2125",
        "brand-strong": "#1F2125",
        "brand-soft": "#E7E8E9",
        "brand-soft-hover": "#DADCDD",
        background: "#F4F4F2",
        surface: "#FFFFFF",
        "surface-secondary": "#F8F8F7",
        "surface-chrome": "#FFFFFF",
        "surface-hover": "#ECECEA",
        "surface-active": "#E2E2DF",
        "surface-selected": "#E7E8E9",
        "text-primary": "#1C1D20",
        "text-secondary": "#55585D",
        "text-muted": "#606368",
        "text-disabled": "#989A9E",
        "text-inverse": "#FFFFFF",
        border: "#D0D1D2",
        "border-strong": "#6D7075",
        focus: "#292C31",
        selection: "#DADCDD",
        "data-1": "#34373D",
        "data-2": "#8F2D24",
        "data-3": "#806000",
        "data-4": "#285D78",
        "data-5": "#356B55",
        "data-6": "#76506F",
        "data-7": "#9C5738",
        "data-8": "#6E6A25",
        "data-neutral": "#606368",
      },
    },
    dark: {
      colors: {
        brand: "#C8CDD3",
        "on-brand": "#101114",
        "brand-hover": "#D6DADE",
        "brand-active": "#B4BBC3",
        "brand-strong": "#E9ECEF",
        "brand-soft": "#30343A",
        "brand-soft-hover": "#3E444C",
        background: "#101114",
        surface: "#191B1F",
        "surface-secondary": "#23262B",
        "surface-chrome": "#191B1F",
        "surface-hover": "#2D3137",
        "surface-active": "#383D44",
        "surface-selected": "#30343A",
        "text-primary": "#F4F4F5",
        "text-secondary": "#CFD1D4",
        "text-muted": "#B6B8BC",
        "text-disabled": "#777A80",
        "text-inverse": "#101114",
        border: "#3B3F45",
        "border-strong": "#8B8F96",
        focus: "#E9ECEF",
        selection: "#3E444C",
        "data-1": "#C8CDD3",
        "data-2": "#EF8C80",
        "data-3": "#E4C35F",
        "data-4": "#7AB9D2",
        "data-5": "#83BFA4",
        "data-6": "#C9A1C2",
        "data-7": "#E6A07E",
        "data-8": "#CBC576",
        "data-neutral": "#B6B8BC",
      },
    },
  },
});

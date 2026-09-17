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

/**
 * Defines the blue-green Tidal palette.
 *
 * @public
 */
export const tidalTheme = defineTheme({
  schemaVersion: 1,
  name: "tidal",
  label: "Tidal",
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
        brand: "#087E8B",
        "on-brand": "#FFFFFF",
        "brand-hover": "#066B76",
        "brand-active": "#055861",
        "brand-strong": "#055861",
        "brand-soft": "#DDF3F4",
        "brand-soft-hover": "#CDEBEC",
        background: "#F2FAFA",
        surface: "#FFFFFF",
        "surface-secondary": "#F7FCFC",
        "surface-chrome": "#F2FAFA",
        "surface-hover": "#E9F5F5",
        "surface-active": "#DDECEC",
        "surface-selected": "#DDF3F4",
        "text-primary": "#142728",
        "text-secondary": "#405E61",
        "text-muted": "#4B696C",
        "text-disabled": "#8BA0A2",
        "text-inverse": "#FFFFFF",
        border: "#C6DCDC",
        "border-strong": "#5B787B",
        focus: "#066B76",
        backdrop: "#0B17197A",
        shadow: "#14272814",
        "shadow-strong": "#14272829",
        selection: "#CDEBEC",
        "data-1": "#087E8B",
        "data-neutral": "#4B696C",
      },
    },
    dark: {
      colors: {
        brand: "#65D3DC",
        "on-brand": "#0B1719",
        "brand-hover": "#7ADDE4",
        "brand-active": "#51C0C9",
        "brand-strong": "#A5EBF0",
        "brand-soft": "#16383C",
        "brand-soft-hover": "#1C4A4F",
        background: "#0B1719",
        surface: "#132326",
        "surface-secondary": "#1A2E31",
        "surface-chrome": "#0E1C1F",
        "surface-hover": "#213A3D",
        "surface-active": "#29464A",
        "surface-selected": "#16383C",
        "text-primary": "#EEF8F8",
        "text-secondary": "#B8D0D2",
        "text-muted": "#A1BCBE",
        "text-disabled": "#657C7E",
        "text-inverse": "#0B1719",
        border: "#2E494C",
        "border-strong": "#789295",
        focus: "#A5EBF0",
        backdrop: "#000000A3",
        shadow: "#00000047",
        "shadow-strong": "#00000070",
        selection: "#1C4A4F",
        "data-1": "#65D3DC",
        "data-neutral": "#A1BCBE",
      },
    },
  },
});

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

/**
 * Defines the blue-gray Ink palette.
 *
 * @public
 */
export const inkTheme = defineTheme({
  schemaVersion: 1,
  name: "ink",
  label: "Ink",
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
        brand: "#40516E",
        "on-brand": "#FFFFFF",
        "brand-hover": "#34425A",
        "brand-active": "#293548",
        "brand-strong": "#293548",
        "brand-soft": "#E6EAF0",
        "brand-soft-hover": "#D8DEE7",
        background: "#F4F6F9",
        surface: "#FFFFFF",
        "surface-secondary": "#F8F9FB",
        "surface-chrome": "#F4F6F9",
        "surface-hover": "#EDF0F4",
        "surface-active": "#E2E6EC",
        "surface-selected": "#E6EAF0",
        "text-primary": "#1B2029",
        "text-secondary": "#505967",
        "text-muted": "#5B6472",
        "text-disabled": "#929AA6",
        "text-inverse": "#FFFFFF",
        border: "#CDD3DC",
        "border-strong": "#697382",
        focus: "#34425A",
        backdrop: "#10141B7A",
        shadow: "#1B202914",
        "shadow-strong": "#1B202929",
        selection: "#D8DEE7",
        "data-1": "#40516E",
        "data-neutral": "#5B6472",
      },
    },
    dark: {
      colors: {
        brand: "#A8B9D8",
        "on-brand": "#10141B",
        "brand-hover": "#B9C8E2",
        "brand-active": "#95A7C8",
        "brand-strong": "#D9E3F5",
        "brand-soft": "#2B3342",
        "brand-soft-hover": "#384357",
        background: "#10141B",
        surface: "#191F29",
        "surface-secondary": "#232B37",
        "surface-chrome": "#141923",
        "surface-hover": "#2D3745",
        "surface-active": "#394555",
        "surface-selected": "#2B3342",
        "text-primary": "#F2F4F8",
        "text-secondary": "#CAD0DB",
        "text-muted": "#B2BAC7",
        "text-disabled": "#737B88",
        "text-inverse": "#10141B",
        border: "#394351",
        "border-strong": "#8791A0",
        focus: "#D9E3F5",
        backdrop: "#000000A3",
        shadow: "#00000047",
        "shadow-strong": "#00000070",
        selection: "#384357",
        "data-1": "#A8B9D8",
        "data-neutral": "#B2BAC7",
      },
    },
  },
});

/**
 * Lists the recommended application palettes in the appearance menu order.
 *
 * @public
 */
export const recommendedThemes = Object.freeze([
  glacierTheme,
  porcelainTheme,
  tidalTheme,
  oliveTheme,
  amberTheme,
  copperTheme,
  roseTheme,
  inkTheme,
]);

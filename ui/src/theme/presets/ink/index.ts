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

export default inkTheme;

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

export default tidalTheme;

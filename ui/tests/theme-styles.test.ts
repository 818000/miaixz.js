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

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ThemeCatalog } from "../src/theme/catalog.js";
import { defineTheme } from "../src/theme/define.js";
import { createThemeStyles } from "../src/theme/styles.js";
import { createThemeScript } from "../src/theme/script.js";
import { serializeThemeStyles } from "../src/theme/serialize.js";

const customer = defineTheme({
  schemaVersion: 1,
  name: "customer",
  label: "Customer",
  version: "1.0.0",
  extends: "miaixz",
  modes: { light: { colors: { brand: "#123456" } }, dark: { colors: { brand: "#ABCDEF" } } },
});

describe("application theme first paint", () => {
  it("keeps business themes out of the built-in catalog and registers them in order", () => {
    expect(new ThemeCatalog().descriptors().map(({ name }) => name)).toEqual([
      "miaixz",
      "neutral",
      "contrast",
    ]);
    const descriptors = new ThemeCatalog([customer]).descriptors();
    expect(descriptors.at(-1)).toMatchObject({
      name: "customer",
      label: "Customer",
      source: "registered",
    });
  });

  it("shares the static built-in declaration contract without binding a runtime or density", () => {
    const catalog = new ThemeCatalog();
    for (const name of ["miaixz", "neutral", "contrast"]) {
      const source = readFileSync(`src/theme/${name}.css`, "utf8")
        .replace(/\s+/g, "")
        .toLowerCase();
      for (const mode of ["light", "dark"] as const) {
        expect(source).toContain(
          serializeThemeStyles(catalog.get(name), mode).replace(/\s+/g, "").toLowerCase(),
        );
      }
    }
    const css = createThemeStyles([customer]);
    expect(css).toContain("--miaixz-color-brand: #123456;");
    expect(css).toContain("--miaixz-color-brand: #ABCDEF;");
    expect(css).not.toContain("data-miaixz-theme-instance");
    expect(css).not.toContain("--miaixz-density-control-height:");
    expect(css).toContain("--miaixz-geometry-compact-control-height:");
    expect(createThemeStyles([])).toBe("");
  });

  it("validates all definitions and restores a registered theme before runtime mounts", () => {
    expect(() => createThemeStyles([customer, customer])).toThrow();
    expect(() => createThemeStyles([{ ...customer, extends: "missing" }])).toThrow();
    expect(() => createThemeStyles([{ ...customer, name: "</style>" }])).toThrow();
    const key = "customer-first-paint";
    localStorage.setItem(
      key,
      JSON.stringify({
        schemaVersion: 2,
        value: { theme: "customer", colorMode: "dark", density: "compact" },
      }),
    );
    try {
      new Function(
        "matchMedia",
        createThemeScript({ storageKey: key, themes: ["miaixz", customer.name] }),
      )(() => ({ matches: false }));
      expect(document.documentElement.dataset.miaixzTheme).toBe("customer");
      expect(document.documentElement.dataset.miaixzColorMode).toBe("dark");
      expect(document.documentElement.dataset.miaixzDensity).toBe("compact");
    } finally {
      localStorage.removeItem(key);
    }
  });
});

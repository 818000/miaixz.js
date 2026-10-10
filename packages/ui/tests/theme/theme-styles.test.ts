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

/**
 * Verifies theme styles behavior in the UI package.
 */

import { VERSION } from "../../src/version.js";

import { readFileSync } from "node:fs";
import { miaixzDefaultAppearance } from "@miaixz/sdk/appearance";
import { describe, expect, it } from "vitest";
import { miaixzBuiltInThemes, ThemeCatalog } from "../../src/theme/catalog.js";
import { defineTheme } from "../../src/theme/define.js";
import { themePresets } from "../../src/theme/presets/index.js";
import { createThemeStyles } from "../../src/theme/styles.js";
import { createThemeScript } from "../../src/theme/script.js";
import { serializeThemeStyles } from "../../src/theme/serialize.js";

const customer = defineTheme({
  schemaVersion: VERSION,
  name: "customer",
  label: "Customer",
  extends: miaixzDefaultAppearance.theme,
  modes: { light: { colors: { brand: "#123456" } }, dark: { colors: { brand: "#ABCDEF" } } },
});

describe("application theme first paint", () => {
  it("reads legacy keys and earlier releases but never applies future or malformed versions", () => {
    const key = "miaixz:global:first-paint:appearance";
    const legacyKey = key.replace(/^miaixz:/, "miaixz:v1:");
    const run = () =>
      new Function(
        "matchMedia",
        createThemeScript({
          storageKey: key,
          themes: [miaixzDefaultAppearance.theme, customer.name],
        }),
      )(() => ({ matches: false }));
    try {
      for (const schemaVersion of [1, 2, "0.0.0", VERSION, `${VERSION.split("-")[0]}-0`]) {
        localStorage.setItem(
          legacyKey,
          JSON.stringify({
            schemaVersion,
            value: {
              theme: customer.name,
              colorMode: "dark",
              density: "compact",
            },
          }),
        );
        run();
        expect(document.documentElement.dataset.miaixzTheme).toBe(customer.name);
        expect(document.documentElement.dataset.miaixzColorMode).toBe("dark");
      }
      for (const schemaVersion of [
        3,
        "999999.0.0",
        "invalid",
        "01.0.0",
        "0.0.0+metadata",
        "0.0.0-01",
      ]) {
        localStorage.setItem(
          legacyKey,
          JSON.stringify({
            schemaVersion,
            value: {
              theme: customer.name,
              colorMode: "dark",
            },
          }),
        );
        run();
        expect(document.documentElement.dataset.miaixzTheme).toBe(miaixzDefaultAppearance.theme);
        expect(document.documentElement.dataset.miaixzColorMode).toBe("light");
      }
      localStorage.setItem(
        key,
        JSON.stringify({
          schemaVersion: VERSION,
          value: {
            theme: miaixzDefaultAppearance.theme,
            colorMode: "light",
          },
        }),
      );
      run();
      expect(document.documentElement.dataset.miaixzTheme).toBe(miaixzDefaultAppearance.theme);
    } finally {
      localStorage.removeItem(key);
      localStorage.removeItem(legacyKey);
    }
  });

  it("advertises lazy presets and appends registered themes in order", () => {
    const presetDescriptors = new ThemeCatalog().descriptors();
    expect(presetDescriptors).toEqual(themePresets);
    expect(
      presetDescriptors.filter(({ source }) => source === "builtin").map(({ name }) => name),
    ).toEqual(miaixzBuiltInThemes.map(({ name }) => name));
    const descriptors = new ThemeCatalog([customer]).descriptors();
    expect(descriptors.at(-1)).toMatchObject({
      name: "customer",
      label: "Customer",
      source: "registered",
    });
  });

  it("shares the static built-in declaration contract without binding a runtime or density", () => {
    const catalog = new ThemeCatalog();
    for (const { name } of miaixzBuiltInThemes) {
      const source = readFileSync(`src/theme/presets/${name}/styles.css`, "utf8")
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
    expect(() => defineTheme({ ...customer, version: VERSION } as typeof customer)).toThrow();
    const key = "customer-first-paint";
    localStorage.setItem(
      key,
      JSON.stringify({
        schemaVersion: VERSION,
        value: {
          theme: "customer",
          colorMode: "dark",
          density: "compact",
          shellLayout: "hybrid-vertical",
          radiusScale: 1.5,
          baseFontSize: 17,
        },
      }),
    );
    try {
      new Function(
        "matchMedia",
        createThemeScript({
          storageKey: key,
          themes: [miaixzDefaultAppearance.theme, customer.name],
        }),
      )(() => ({ matches: false }));
      expect(document.documentElement.dataset.miaixzTheme).toBe("customer");
      expect(document.documentElement.dataset.miaixzColorMode).toBe("dark");
      expect(document.documentElement.dataset.miaixzDensity).toBe("compact");
      expect(document.documentElement.dataset.miaixzShellLayout).toBe("hybrid-vertical");
      expect(document.documentElement.dataset.miaixzRadiusScale).toBe("1.5");
      expect(document.documentElement.dataset.miaixzBaseFontSize).toBe("17");
    } finally {
      localStorage.removeItem(key);
    }
  });

  it("escapes inline-script breakouts without restricting valid custom storage keys", () => {
    const key = "</script><script>globalThis.__themeInjected=true</script>\u2028&";
    const script = createThemeScript({
      storageKey: key,
      themes: [miaixzDefaultAppearance.theme],
    });
    expect(script.toLowerCase()).not.toContain("</script");
    expect(script).not.toContain("\u2028");
    expect(script).toContain("\\u003c/script\\u003e");
    expect(() => new Function("matchMedia", script)(() => ({ matches: false }))).not.toThrow();
  });
});

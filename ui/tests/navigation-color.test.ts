import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { defineTheme } from "../src/theme/define.js";
import { resolveThemeDefinitions } from "../src/theme/resolve.js";
import { serializeThemeApplication } from "../src/theme/serialize.js";
import { miaixzBuiltInThemes } from "../src/themes/index.js";
import { serializeThemeOpacity } from "../src/tokens/opacity.js";

describe("navigation selected theme opacity", () => {
  for (const definition of miaixzBuiltInThemes) {
    const theme = resolveThemeDefinitions(new Map([[definition.name, definition]])).get(
      definition.name,
    )!;
    it(`${theme.name} defaults to 35% without changing other colors`, () => {
      expect(theme.tokens.opacity.navigationSelected).toBe(0.35);
      expect(theme.modes).toEqual(definition.modes);
      const { opacity: _opacity, ...tokens } = definition.tokens!;
      const legacy = { ...definition, tokens };
      const restored = resolveThemeDefinitions(new Map([[legacy.name, legacy]])).get(legacy.name)!;
      expect(restored.tokens.opacity.navigationSelected).toBe(0.35);
      expect(restored.modes).toEqual(theme.modes);
    });
    for (const mode of ["light", "dark"] as const) {
      it(`${theme.name} ${mode} shares derived declarations between static and runtime CSS`, () => {
        const staticCss = readFileSync(
          resolve("src/styles/themes", `${theme.name}.tokens.css`),
          "utf8",
        ).replace(/\s+/g, " ");
        const runtime = serializeThemeApplication(
          theme,
          mode,
          mode,
          "standard",
          { brand: "#123456" },
          "navigation-test",
        ).cssText;
        for (const declaration of serializeThemeOpacity(theme.tokens.opacity)) {
          expect(staticCss.replace(/\s/g, "")).toContain(declaration.replace(/\s/g, ""));
          expect(runtime).toContain(declaration);
        }
        expect(runtime).toContain("--miaixz-color-brand: #123456;");
        expect(runtime).toContain(
          `--miaixz-color-brand-soft: ${theme.modes[mode].colors["brand-soft"]};`,
        );
        expect(runtime).toContain(
          `--miaixz-color-surface-selected: ${theme.modes[mode].colors["surface-selected"]};`,
        );
      });
    }
  }

  it("honors inherited theme opacity without overwriting the parent", () => {
    const parent = miaixzBuiltInThemes[0]!;
    const child = defineTheme({
      schemaVersion: 1,
      name: "navigation-child",
      label: "Navigation child",
      version: "1.0.0",
      extends: parent.name,
      tokens: { opacity: { navigationSelected: 0.5 } },
      modes: { light: {}, dark: {} },
    });
    const resolved = resolveThemeDefinitions(
      new Map([
        [parent.name, parent],
        [child.name, child],
      ]),
    );
    expect(resolved.get(child.name)!.tokens.opacity.navigationSelected).toBe(0.5);
    expect(resolved.get(parent.name)!.tokens.opacity.navigationSelected).toBe(0.35);
  });

  for (const value of [-0.1, 1.1, NaN, Infinity, "0.35"]) {
    it(`rejects invalid opacity ${String(value)}`, () => {
      const theme = miaixzBuiltInThemes[0]!;
      expect(() =>
        defineTheme({
          ...theme,
          tokens: { ...theme.tokens, opacity: { navigationSelected: value as number } },
        }),
      ).toThrow();
    });
  }
});

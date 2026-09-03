import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { miaixzBuiltInThemes } from "../src/themes/index.js";

function luminance(hex: string) {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)!
    .map((channel) => {
      const value = Number.parseInt(channel, 16) / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
  return channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722;
}

function contrast(foreground: string, background: string) {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0]! + 0.05) / (values[1]! + 0.05);
}

function rule(file: string, selector: string) {
  const css = readFileSync(
    new URL(`../src/styles/components/${file}.css`, import.meta.url),
    "utf8",
  );
  const start = css.indexOf(selector);
  expect(start).toBeGreaterThanOrEqual(0);
  return css.slice(css.indexOf("{", start), css.indexOf("}", start) + 1);
}

describe("brand foreground semantics", () => {
  for (const theme of miaixzBuiltInThemes) {
    for (const mode of ["light", "dark"] as const) {
      it(`${theme.name} ${mode} keeps brand text readable across interactive surfaces`, () => {
        const colors = theme.modes[mode].colors;
        for (const background of ["brand", "brand-hover", "brand-active"] as const) {
          expect(contrast(colors["on-brand"], colors[background])).toBeGreaterThanOrEqual(4.5);
        }
        for (const background of [
          "background",
          "surface",
          "surface-secondary",
          "surface-chrome",
          "surface-hover",
          "surface-active",
          "surface-selected",
          "brand-soft",
          "brand-soft-hover",
        ] as const) {
          expect(contrast(colors["brand-strong"], colors[background])).toBeGreaterThanOrEqual(4.5);
        }
      });
    }
  }

  it("uses semantic foregrounds without changing branded backgrounds or indicators", () => {
    for (const selector of [".miaixz-avatar-account {", ".miaixz-avatar-account:hover,"]) {
      expect(rule("avatar", selector)).toContain("color: var(--miaixz-color-on-brand);");
    }
    for (const selector of [
      ".miaixz-button-link {",
      '.miaixz-button-link:focus-visible:not(:disabled, [aria-disabled="true"]) {',
      '.miaixz-button-link:hover:not(:disabled, [aria-disabled="true"]) {',
    ]) {
      expect(rule("button", selector)).toContain("color: var(--miaixz-color-brand);");
    }
    const navigation = rule(
      "navigation",
      '.miaixz-navigation-horizontal > .miaixz-navigation-item[aria-current="page"] {',
    );
    expect(navigation).toContain("color: var(--miaixz-color-text-primary);");
    expect(navigation).toContain("0 var(--miaixz-color-brand);");
    expect(
      rule("button", '.miaixz-button-refresh:hover:not(:disabled, [aria-disabled="true"]) {'),
    ).toContain("color: var(--miaixz-color-text-primary);");
  });
});

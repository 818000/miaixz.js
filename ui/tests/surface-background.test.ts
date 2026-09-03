import { describe, expect, it } from "vitest";

import { miaixzBuiltInThemes } from "../src/themes/index.js";

describe("neutral surface backgrounds", () => {
  for (const theme of miaixzBuiltInThemes) {
    it(`${theme.name} uses white light surfaces without removing state colors or dark mode`, () => {
      const light = theme.modes.light.colors;
      for (const token of ["background", "surface", "surface-secondary", "surface-chrome"] as const)
        expect(light[token]).toBe("#FFFFFF");
      for (const role of ["page", "header", "sidebar", "panel", "control", "overlay"] as const)
        expect(light[theme.tokens.surfaces[role].background]).toBe("#FFFFFF");
      for (const token of [
        "surface-hover",
        "surface-active",
        "surface-selected",
        "danger-soft",
      ] as const)
        expect(light[token]).not.toBe("#FFFFFF");
      for (const token of ["background", "surface", "surface-secondary"] as const)
        expect(theme.modes.dark.colors[token]).not.toBe("#FFFFFF");
    });
  }
});

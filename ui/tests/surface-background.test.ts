import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { miaixzBuiltInThemes } from "../src/theme/catalog.js";
import { miaixzTheme, parseTheme } from "../src/theme/index.js";

describe("neutral surface backgrounds", () => {
  it("keeps transparent component surfaces composited against their actual ancestor", () => {
    for (const [file, selector] of [
      ["src/styles/components/panel.css", "miaixz-panel-transparent"],
      ["src/styles/components/table.css", "miaixz-table-container-transparent"],
      ["src/styles/components/metric-group.css", "miaixz-metric-group-transparent"],
    ] as const) {
      const css = readFileSync(file, "utf8");
      const rule = css.match(new RegExp(`\\.${selector}\\s*\\{([^}]*)\\}`, "u"))?.[1];
      expect(rule, `${selector} must have an explicit rule`).toBeDefined();
      expect(rule).toMatch(/background(?:-color)?:\s*transparent/u);
      expect(rule).not.toMatch(/background(?:-color)?:\s*var\(--miaixz-(?:color|surface-role)-/u);
    }
  });

  it("rejects unknown surface background roles instead of remapping them", () => {
    expect(() =>
      parseTheme({
        ...miaixzTheme,
        name: "unknown-surface-background",
        tokens: {
          ...miaixzTheme.tokens,
          surfaces: {
            ...miaixzTheme.tokens?.surfaces,
            panel: {
              ...miaixzTheme.tokens?.surfaces?.panel,
              background: "unknown-background",
            },
          },
        },
      }),
    ).toThrow();
  });

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

import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { miaixzTheme } from "../src/themes/miaixz.js";
import { ThemeCatalog } from "../src/theme/catalog.js";
import { validateResolvedTheme } from "../src/theme/validate.js";
// Shared with the standalone CSS audit.
// @ts-expect-error The audit entry point is a plain JavaScript module.
import { inspectComponentColors } from "./color-policy.mjs";

describe("color ownership", () => {
  it("keeps brand and link colors while filled green controls share white foregrounds", () => {
    expect(miaixzTheme.modes.light.colors.brand).toBe("#62B52F");
    expect(miaixzTheme.modes.light.colors["brand-strong"]).toBe("#266B1B");
    expect(miaixzTheme.modes.dark.colors.brand).toBe("#7BCB52");
    expect(miaixzTheme.modes.dark.colors["brand-strong"]).toBe("#A3E37F");
    expect(miaixzTheme.modes.light.colors["on-brand"]).toBe("#FFFFFF");
    expect(miaixzTheme.modes.dark.colors["on-brand"]).toBe("#FFFFFF");
  });

  it("keeps neutral light paint free of green tint", () => {
    for (const token of [
      "surface-hover",
      "surface-active",
      "surface-selected",
      "text-primary",
      "text-secondary",
      "text-muted",
      "border",
      "border-strong",
    ] as const) {
      const channels = miaixzTheme.modes.light.colors[token]!.slice(1).match(/../g)!;
      expect(new Set(channels).size, token).toBe(1);
    }
  });

  it("keeps public text links on the primary without adornment color overrides", () => {
    const foundation = readFileSync("src/styles/foundation/link.css", "utf8");
    expect(foundation.match(/color: var\(--miaixz-color-brand\);/g)).toHaveLength(2);
    expect(foundation).not.toContain("brand-strong");
    const input = readFileSync("src/styles/components/input.css", "utf8");
    for (const rule of input.matchAll(/[^{}]*\.miaixz-button-link[^{}]*\{([^}]+)\}/g)) {
      expect(rule[1]).not.toMatch(/(?:^|[;\s])color\s*:/);
    }
    const button = readFileSync("src/styles/components/button.css", "utf8");
    expect(button).not.toContain("brand-strong");
    expect(button).toMatch(
      /\.miaixz-button-link\[aria-disabled="true"\] \{\s*color: var\(--miaixz-color-text-disabled\);/,
    );
  });

  it("loads authored brand foregrounds without weakening content contrast validation", () => {
    const theme = new ThemeCatalog().get("miaixz");
    expect(theme.modes.light.colors["on-brand"]).toBe("#FFFFFF");
    expect(() =>
      validateResolvedTheme({
        ...theme,
        modes: {
          ...theme.modes,
          light: {
            colors: { ...theme.modes.light.colors, "text-primary": "#FFFFFF" },
          },
        },
      }),
    ).toThrow("The theme color contrast is insufficient");
  });

  it("fills summary icon circles with their tone and theme foreground on hover or focus", () => {
    const css = readFileSync("src/styles/components/metric.css", "utf8");
    const base = css.match(/\.miaixz-metric-summary \.miaixz-metric-icon \{([^}]+)\}/)![1]!;
    expect(base).toContain("color: var(--miaixz-metric-tone);");
    expect(base).toContain("border: 1px solid var(--miaixz-color-border);");
    const interactive = css.match(
      /\.miaixz-metric-summary:hover \.miaixz-metric-icon,\s*\.miaixz-metric-summary:focus-visible \.miaixz-metric-icon \{([^}]+)\}/,
    )![1]!;
    expect(interactive).toContain("color: var(--miaixz-color-on-brand);");
    expect(interactive).toContain("background: var(--miaixz-metric-tone);");
    expect(interactive).toContain("border-color: var(--miaixz-metric-tone);");
    expect(interactive).toContain("transform: scale(1.06);");
  });

  it("uses the primary for shared control bottom focus lines without changing invalid states", () => {
    const css = readFileSync("src/styles/foundation/controls.css", "utf8");
    const focus = css.match(/--miaixz-control-focus-shadow:([^;]+);/)![1]!;
    expect(focus).toContain("var(--miaixz-color-brand)");
    expect(focus).not.toMatch(/color-focus|brand-strong/);
    expect(focus).toContain("inset 0 calc(-1 * var(--miaixz-control-focus-width)) 0");
    expect(css.match(/--miaixz-control-invalid-shadow:([^;]+);/)![1]).toContain(
      "var(--miaixz-color-danger)",
    );
    for (const state of ["readonly", "disabled"]) {
      const rule = css.match(
        new RegExp(`[^{}]*\\[data-preview-state="${state}"\\][^{}]*\\{([^}]+)\\}`),
      )![1]!;
      expect(rule).toContain("box-shadow: none;");
    }
  });

  it("keeps selection borders branded while ordinary control text is neutral", () => {
    const css = readFileSync("src/styles/components/pressable.css", "utf8");
    const rule = css.match(
      /(?:^|\n\n)\.miaixz-pressable-pill\[aria-pressed="true"\] \{([^}]+)\}/,
    )![1]!;
    expect(rule).toContain("border-color: var(--miaixz-color-brand);");
    expect(rule).toContain("color: var(--miaixz-color-text-primary);");
  });

  it("rejects new recipes even inside a chart and disallows semantic misuse", () => {
    expect(inspectComponentColors("button.css", ".x { color: CanvasText; }")).not.toEqual([]);
    expect(
      inspectComponentColors(
        "button.css",
        "@media (forced-colors: active) { .x { color: CanvasText; background: Canvas; } }",
      ),
    ).toEqual([]);
    expect(inspectComponentColors("button.css", ".x { color: red; }")).not.toEqual([]);
    expect(
      inspectComponentColors("button.css", ".x { border: 1px solid greenyellow; }"),
    ).not.toEqual([]);
    expect(inspectComponentColors("button.css", ".x { color: #62B52F; }")).not.toEqual([]);
    expect(
      inspectComponentColors(
        "heatmap.css",
        ".x { background: color-mix(in srgb, var(--miaixz-heatmap-tone) 17%, var(--miaixz-color-surface)); }",
      ),
    ).not.toEqual([]);
    expect(
      inspectComponentColors("switch.css", ".x { background: var(--miaixz-color-brand-strong); }"),
    ).not.toEqual([]);
    expect(
      inspectComponentColors("button.css", ".x { color: var(--miaixz-color-brand-hover); }"),
    ).not.toEqual([]);
  });

  it("audits all public component styles", () => {
    for (const layer of ["components", "foundation"]) {
      const directory = resolve("src/styles", layer);
      for (const file of readdirSync(directory).filter((name) => name.endsWith(".css"))) {
        expect(
          inspectComponentColors(file, readFileSync(resolve(directory, file), "utf8")),
          file,
        ).toEqual([]);
      }
    }
  });
});

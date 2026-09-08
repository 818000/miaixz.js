import { expect, test } from "@playwright/test";

import { miaixzTheme, MiaixzThemeError, parseTheme } from "../src/theme/index.js";
import { resolveThemeDefinitions } from "../src/theme/resolve.js";
import { serializeThemeApplication } from "../src/theme/serialize.js";

const compactTypography = {
  "--miaixz-text-compact-body-size": "12px",
  "--miaixz-text-compact-body-line-height": "14px",
  "--miaixz-text-compact-caption-size": "10px",
  "--miaixz-text-compact-caption-line-height": "14px",
  "--miaixz-text-compact-section-title-size": "11px",
  "--miaixz-text-compact-section-title-line-height": "15px",
  "--miaixz-text-compact-metric-size": "22px",
  "--miaixz-text-compact-metric-line-height": "26px",
} as const;

const nonColorRoles = [
  "--miaixz-opacity-navigation-selected",
  "--miaixz-radius-control",
  "--miaixz-shadow-low",
  "--miaixz-geometry-compact-control-height",
  "--miaixz-layout-page-gutter-min",
  "--miaixz-surface-role-panel-background",
] as const;

for (const theme of ["miaixz", "neutral", "contrast"] as const) {
  for (const colorMode of ["light", "dark"] as const) {
    test(`${theme} ${colorMode} exposes the complete semantic typography contract`, async ({
      page,
    }) => {
      await page.goto(`/tests/?theme=${theme}&colorMode=${colorMode}&density=standard`);
      const root = page.locator("html");
      await expect(root).toHaveAttribute("data-miaixz-theme", theme);
      await expect(root).toHaveAttribute("data-miaixz-color-mode", colorMode);
      await expect(root).toHaveAttribute("data-miaixz-density", "standard");
      await expect(page.getByRole("main", { name: "Miaixz UI 浏览器契约夹具" })).toBeVisible();
      await expect(page.getByRole("button", { name: "正在保存" })).toBeDisabled();

      const values = await root.evaluate((element, properties) => {
        const styles = getComputedStyle(element);
        return Object.fromEntries(
          properties.map((property) => [property, styles.getPropertyValue(property).trim()]),
        );
      }, Object.keys(compactTypography));
      expect(values).toEqual(compactTypography);
      for (const property of nonColorRoles) {
        await expect(root).not.toHaveCSS(property, "");
      }
    });
  }
}

for (const density of ["compact", "standard", "comfortable"] as const) {
  test(`${density} density is applied without changing component ownership`, async ({ page }) => {
    await page.goto(`/tests/?theme=miaixz&colorMode=light&density=${density}`);
    await expect(page.locator("html")).toHaveAttribute("data-miaixz-density", density);
    await expect(page.getByRole("group", { name: "四项指标" })).toBeVisible();
    await expect(page.getByRole("table", { name: "固定成员数据" })).toBeVisible();
  });
}

test("a schema-one custom theme inherits newly added compact typography defaults", async ({
  page,
}) => {
  await page.goto("/tests/?theme=legacy-custom&colorMode=dark&density=compact");
  const root = page.locator("html");
  await expect(root).toHaveAttribute("data-miaixz-theme", "legacy-custom");
  await expect(root).toHaveAttribute("data-miaixz-color-mode", "dark");
  await expect(root).toHaveCSS("font-size", "15px");
  await expect(root).toHaveCSS("--miaixz-text-compact-body-size", "12px");
  await expect(page.getByRole("button", { name: "打开长内容抽屉" })).toBeVisible();
});

test("schema-one non-color roles parse, resolve and serialize through one contract", () => {
  const definition = parseTheme({
    schemaVersion: 1,
    name: "legacy-non-color",
    label: "Legacy non-color",
    version: "1.0.0",
    extends: "miaixz",
    tokens: {
      opacity: { navigationSelected: 0.42 },
      typography: { bodySize: 15 },
      geometry: { standard: { controlHeight: 42 } },
    },
    modes: { light: {}, dark: {} },
  });
  const resolved = resolveThemeDefinitions(
    new Map([
      [miaixzTheme.name, miaixzTheme],
      [definition.name, definition],
    ]),
  ).get(definition.name)!;
  const application = serializeThemeApplication(
    resolved,
    "light",
    "light",
    "standard",
    undefined,
    "theme_spec",
  );

  expect(resolved.tokens.typography.compactBodySize).toBe(12);
  expect(application.cssText).toContain("--miaixz-opacity-navigation-selected: 0.42;");
  expect(application.cssText).toContain("--miaixz-text-body-size: 15px;");
  expect(application.cssText).toContain("--miaixz-geometry-standard-control-height: 42px;");
  expect(application.cssText).toContain(
    "--miaixz-density-control-height: var(--miaixz-geometry-standard-control-height);",
  );

  expect(() =>
    parseTheme({
      ...definition,
      tokens: { opacity: { navigationSelected: 2 } },
    }),
  ).toThrow(MiaixzThemeError);
});

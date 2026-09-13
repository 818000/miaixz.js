import { expect, test } from "@playwright/test";

import { DRAWER_WIDTHS } from "../src/components/drawer/drawer-widths.js";

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
      const loadingButton = page.locator('button.miaixz-button[data-loading="true"]').last();
      await expect(loadingButton).toBeDisabled();
      await expect(loadingButton.getByRole("status")).toHaveText("正在保存");

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

test("theme delegates pointer and keyboard ripple feedback to semantic actions", async ({
  page,
}) => {
  await page.goto("/tests/?theme=miaixz&colorMode=light&density=standard");
  const button = page.getByRole("button", { name: "默认按钮" });

  const pointerFeedback = await button.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    element.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        button: 0,
        clientX: rect.left + rect.width / 4,
        clientY: rect.top + rect.height / 2,
      }),
    );
    const layer = element.querySelector<HTMLElement>(".miaixz-interaction-ripple-layer");
    return {
      interactive: element.classList.contains("miaixz-interactive"),
      origin: layer?.dataset.origin,
      ripple: layer?.querySelector(".miaixz-interaction-ripple") !== null,
    };
  });
  expect(pointerFeedback).toEqual({ interactive: true, origin: "pointer", ripple: true });

  const keyboardFeedback = await button.evaluate((element) => {
    element.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }));
    return Array.from(
      element.querySelectorAll<HTMLElement>(".miaixz-interaction-ripple-layer"),
    ).some((layer) => layer.dataset.origin === "keyboard");
  });
  expect(keyboardFeedback).toBe(true);
});

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

for (const viewportWidth of [1440, 390]) {
  test(`drawer width presets and custom widths clamp at ${viewportWidth}px`, async ({ page }) => {
    await page.setViewportSize({ width: viewportWidth, height: 900 });
    await page.goto("/tests/?drawerWidth=350");
    await page.getByRole("button", { name: "打开长内容抽屉" }).click();
    const drawer = page.getByRole("dialog", { name: "外层抽屉" });
    const footer = drawer.locator(".miaixz-drawer-footer");
    const fontSize = await drawer.evaluate((element) => getComputedStyle(element).fontSize);
    const padding = await drawer
      .locator(".miaixz-drawer-body")
      .evaluate((element) => getComputedStyle(element).padding);
    for (const width of [...DRAWER_WIDTHS, 435.5]) {
      await drawer.getByLabel("抽屉宽度").selectOption(String(width));
      const box = (await drawer.boundingBox())!;
      expect(box.width).toBeCloseTo(Math.min(width, viewportWidth), 0);
      expect(box.x + box.width).toBeCloseTo(viewportWidth, 0);
      expect(box.y).toBe(0);
      expect(box.height).toBe(900);
      await expect(drawer).toHaveCSS("font-size", fontSize);
      await expect(drawer.locator(".miaixz-drawer-body")).toHaveCSS("padding", padding);
      const footerBox = (await footer.boundingBox())!;
      expect(footerBox.y + footerBox.height).toBeCloseTo(900, 0);
    }
    await page.setViewportSize({ width: 320, height: 700 });
    await expect.poll(async () => (await drawer.boundingBox())!.width).toBe(320);
    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
    await expect(page.getByRole("button", { name: "打开长内容抽屉" })).toBeFocused();
  });
}

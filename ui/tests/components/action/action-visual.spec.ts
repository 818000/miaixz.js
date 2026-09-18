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

import { expect, test, type Locator, type Page } from "@playwright/test";

const actionLayouts = [
  ["page-header", 3],
  ["card-header", 2],
  ["table-row", 3],
  ["icon-actions", 4],
  ["form-actions", 8],
  ["state-matrix", 8],
] as const;

/**
 * Waits until the asynchronous theme preset has been applied to the document root.
 *
 * @param page - Active browser page.
 * @param colorMode - Expected resolved color mode.
 * @param density - Expected density.
 */
async function waitForTheme(
  page: Page,
  colorMode: "light" | "dark",
  density: "compact" | "standard",
): Promise<void> {
  const root = page.locator("html");
  await expect(root).toHaveAttribute("data-miaixz-theme-instance", /.+/u);
  await expect(root).toHaveAttribute("data-miaixz-theme", "miaixz");
  await expect(root).toHaveAttribute("data-miaixz-color-mode", colorMode);
  await expect(root).toHaveAttribute("data-miaixz-density", density);
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
  });
}

/**
 * Asserts that an action surface remains inside its panel without clipping.
 *
 * @param panel - Action panel under test.
 * @param minimumControlHeight - Smallest permitted action control height.
 */
async function expectStableActionLayout(
  panel: Locator,
  minimumControlHeight: number,
): Promise<void> {
  await expect(panel).toBeVisible();
  await expect(panel).toHaveCSS("border-top-style", "solid");
  await expect(panel).toHaveCSS("border-top-width", "1px");
  await expect(panel).toHaveCSS("border-top-left-radius", "4px");
  await expect(panel.locator(".miaixz-panel-header")).toHaveCSS("display", "flex");
  await expect
    .poll(() =>
      panel.evaluate((element) => ({
        horizontal: element.scrollWidth <= element.clientWidth,
        vertical: element.scrollHeight <= element.clientHeight,
      })),
    )
    .toEqual({ horizontal: true, vertical: true });
  const controls = panel.locator("a.miaixz-button, button.miaixz-button");
  for (let index = 0; index < (await controls.count()); index += 1) {
    const control = controls.nth(index);
    await expect(control).toBeVisible();
    await expect(control).toHaveCSS("font-size", "14px");
    expect((await control.boundingBox())!.height).toBeGreaterThanOrEqual(minimumControlHeight);
  }
}

for (const [testId, actionCount] of actionLayouts) {
  test(`keeps the ${testId} action layout stable`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/tests/?theme=miaixz&colorMode=light&density=standard");
    await waitForTheme(page, "light", "standard");
    await page.locator(".miaixz-appearance-floating").evaluate((element) => {
      (element as HTMLElement).hidden = true;
    });
    const panel = page.getByTestId(`action-baseline-${testId}`);
    await expect(panel.locator("a.miaixz-button, button.miaixz-button")).toHaveCount(actionCount);
    await expect(panel).toHaveCSS("background-color", "rgb(255, 255, 255)");
    await expect(panel.locator(".miaixz-panel-header")).toHaveCSS("padding", "16px");
    await expectStableActionLayout(panel, 40);
  });
}

test("keeps the state matrix legible in dark compact mobile mode", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/tests/?theme=miaixz&colorMode=dark&density=compact");
  await waitForTheme(page, "dark", "compact");
  await page.locator(".miaixz-appearance-floating").evaluate((element) => {
    (element as HTMLElement).hidden = true;
  });
  const panel = page.getByTestId("action-baseline-state-matrix");
  await expect(panel.locator("a.miaixz-button, button.miaixz-button")).toHaveCount(8);
  await expect(panel).toHaveCSS("background-color", "rgb(32, 36, 31)");
  await expect(panel).toHaveCSS("border-top-color", "rgb(57, 65, 55)");
  await expect(panel.locator(".miaixz-panel-header")).toHaveCSS("padding", "12px");
  await expectStableActionLayout(panel, 32);
});

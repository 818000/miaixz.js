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
 * Verifies editor containment at narrow surfaces inside both wide and small viewports.
 */

import { expect, test } from "@playwright/test";

for (const viewport of [390, 1440]) {
  for (const width of viewport === 390 ? [357] : [357, 600, 960]) {
    for (const mode of ["light", "dark"]) {
      test(`${viewport}px viewport, ${width}px editor, ${mode}: fields remain usable`, async ({
        page,
      }, info) => {
        await page.setViewportSize({ width: viewport, height: 900 });
        await page.goto(`/tests/?editorResponsive=1&editorWidth=${width}&colorMode=${mode}`);
        const name = page.getByRole("textbox", { name: "Identity name", exact: true });
        const account = page.getByRole("textbox", { name: "Identity account", exact: true });
        await expect(name).toBeVisible();
        const summary = await page.getByText("Editor summary", { exact: true }).boundingBox();
        const first = await name.boundingBox();
        const second = await account.boundingBox();
        expect(first!.width).toBeGreaterThan(100);
        expect(second!.width).toBeGreaterThan(100);
        if (width < 768) {
          expect(first!.y).toBeGreaterThan(summary!.y + summary!.height);
          expect(second!.y).toBeGreaterThan(first!.y + first!.height);
        } else {
          expect(first!.x).toBeGreaterThan(summary!.x + summary!.width);
          expect(first!.y).toBeCloseTo(second!.y, 0);
        }
        await name.fill("Updated name");
        await expect(name).toHaveValue("Updated name");
        await account.press("X");
        await expect(account).toHaveValue("kimi");
        await page.getByRole("tab", { name: "Security", exact: true }).click();
        await expect(
          page.getByRole("textbox", { name: "Security status", exact: true }),
        ).toBeDisabled();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        await page.screenshot({ path: info.outputPath("editor-responsive.png") });
      });
    }
  }
}

test("vertical toolbar tabs retain their header and action layout", async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/tests/?editorResponsive=1&editorWidth=960&editorActions=1");
  const header = page.locator(".miaixz-tabs-header");
  await expect(header).toHaveCSS("min-height", "60px");
  await expect(header).toHaveCSS("padding-inline-start", "16px");
  await expect(header.getByRole("tab", { name: "Identity", exact: true })).toHaveCSS(
    "border-radius",
    "0px",
  );
  await expect(header.locator(".miaixz-cluster")).toHaveCSS("flex-wrap", "nowrap");
  await expect(header.getByRole("button", { name: "Export editor", exact: true })).toBeVisible();
  await header.getByRole("tab", { name: "Security", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Security status", exact: true })).toBeDisabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("vertical-toolbar-tabs.png") });
});

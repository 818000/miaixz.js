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

import { expect, test } from "@playwright/test";

const baselines = [
  ["page-header", "01-page-header.png"],
  ["card-header", "02-card-header.png"],
  ["table-row", "03-table-row.png"],
  ["icon-actions", "04-icon-actions.png"],
  ["form-actions", "05-form-actions.png"],
  ["state-matrix", "06-state-matrix.png"],
] as const;

for (const [testId, snapshot] of baselines) {
  test(`freezes the ${testId} action baseline`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/tests/?theme=miaixz&colorMode=light&density=standard");
    await page.locator(".miaixz-appearance-floating").evaluate((element) => {
      (element as HTMLElement).hidden = true;
    });
    const panel = page.getByTestId(`action-baseline-${testId}`);
    await expect(panel).toBeVisible();
    await expect(panel).toHaveScreenshot(snapshot, { animations: "disabled" });
  });
}

test("keeps the state matrix legible in dark compact mobile mode", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/tests/?theme=miaixz&colorMode=dark&density=compact");
  await page.locator(".miaixz-appearance-floating").evaluate((element) => {
    (element as HTMLElement).hidden = true;
  });
  const panel = page.getByTestId("action-baseline-state-matrix");
  await expect(panel).toBeVisible();
  await expect(panel).toHaveScreenshot("06-state-matrix-dark-compact-mobile.png", {
    animations: "disabled",
  });
});

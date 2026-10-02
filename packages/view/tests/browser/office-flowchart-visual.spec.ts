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
 * Locks Word and PowerPoint flowcharts to fixed browser page geometry.
 */

import { expect, test } from "@playwright/test";

for (const format of ["pptx", "docx"] as const) {
  test(`${format} keeps its fixed page and flowchart scene`, async ({ browserName, page }) => {
    const crossOriginRequests: string[] = [];
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (url.protocol !== "blob:" && url.hostname !== "127.0.0.1") {
        crossOriginRequests.push(request.url());
      }
    });
    await page.goto(`/tests/browser/support/index.html?format=${format}`);
    await expect(page.locator("html")).toHaveAttribute("data-office-ready", "complete", {
      timeout: 20_000,
    });
    await expect(page.locator(".miaixz-preview-page")).toHaveCount(1);
    await expect(page.locator(".miaixz-preview-page-drawing")).toHaveCount(1);
    await expect(page.locator(".miaixz-preview-page-text")).toHaveCount(0);
    await expect(page.locator("[data-scene-background=true]")).toHaveCount(1);
    await expect(page.locator("[data-drawing-id]")).toHaveCount(format === "pptx" ? 3 : 4);
    const pageBox = await page.locator(".miaixz-preview-page").boundingBox();
    expect(pageBox).not.toBeNull();
    if (format === "pptx") {
      expect((pageBox?.width ?? 0) / (pageBox?.height ?? 1)).toBeCloseTo(16 / 9, 1);
      await expect(page.getByText("Approved?", { exact: true })).toHaveCount(1);
    } else {
      expect((pageBox?.width ?? 0) / (pageBox?.height ?? 1)).toBeCloseTo(816 / 1056, 1);
      await expect(page.getByText("Approval flow", { exact: true })).toHaveCount(1);
    }
    expect(crossOriginRequests).toEqual([]);
    if (browserName === "chromium") {
      await expect(page).toHaveScreenshot(`${format}-flowchart.png`, {
        animations: "disabled",
        caret: "hide",
        maxDiffPixels: 0,
        threshold: 0.02,
      });
    }
  });
}

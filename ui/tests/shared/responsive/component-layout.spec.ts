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

test("responsive metric and table owners adapt without alternate component APIs", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/tests/");
  const metricGrid = page
    .getByRole("group", { name: "四项指标" })
    .locator(".miaixz-metrics-scroll");
  await expect
    .poll(() => metricGrid.evaluate((element) => getComputedStyle(element).gridTemplateColumns))
    .not.toContain(" ");

  const tableContainer = page.locator("#tables");
  expect(
    await tableContainer.evaluate((element) => element.scrollWidth >= element.clientWidth),
  ).toBe(true);
});

test("Masonry keeps 4/2/1 columns, DOM order, dynamic height, RTL, and zoom without overflow", async ({
  page,
}) => {
  const expectedColumns = [
    { width: 1280, columns: "4" },
    { width: 800, columns: "2" },
    { width: 600, columns: "1" },
  ] as const;
  for (const { width, columns } of expectedColumns) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/tests/");
    const masonry = page.getByTestId("masonry-layout");
    await expect
      .poll(() => masonry.evaluate((node) => getComputedStyle(node).columnCount))
      .toBe(columns);
    expect(await masonry.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
  }

  const masonry = page.getByTestId("masonry-layout");
  await expect(masonry.locator("article")).toHaveCount(8);
  expect(await masonry.locator("article").allTextContents()).toEqual([
    "卡片 1不等高内容行 1",
    "卡片 2不等高内容行 1不等高内容行 2",
    "卡片 3不等高内容行 1不等高内容行 2不等高内容行 3",
    "卡片 4不等高内容行 1",
    "卡片 5不等高内容行 1不等高内容行 2",
    "卡片 6不等高内容行 1不等高内容行 2不等高内容行 3",
    "卡片 7不等高内容行 1",
    "卡片 8不等高内容行 1不等高内容行 2",
  ]);
  const before = await page
    .getByTestId("masonry-item-1")
    .evaluate((node) => node.getBoundingClientRect().height);
  await page.getByTestId("masonry-item-1").evaluate((node) => {
    const block = document.createElement("p");
    block.textContent = "动态高度内容";
    node.append(block);
  });
  await expect
    .poll(() =>
      page.getByTestId("masonry-item-1").evaluate((node) => node.getBoundingClientRect().height),
    )
    .toBeGreaterThan(before);
  await masonry.evaluate((node) => node.setAttribute("dir", "rtl"));
  await expect.poll(() => masonry.evaluate((node) => getComputedStyle(node).direction)).toBe("rtl");
  await page.evaluate(() => {
    document.documentElement.style.zoom = "2";
  });
  expect(await masonry.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
});

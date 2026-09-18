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

test("Tabs, Toolbar, Tree, and Graph expose one deterministic keyboard path", async ({ page }) => {
  await page.goto("/tests/");

  const overview = page.getByRole("tab", { name: "概览" });
  await overview.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "详情" })).toHaveAttribute("aria-selected", "true");

  const firstTool = page.getByRole("button", { name: "第一个工具" });
  await firstTool.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("button", { name: "第二个工具" })).toBeFocused();

  const platform = page.getByRole("treeitem", { name: "平台" });
  await platform.focus();
  await page.keyboard.press("ArrowRight");
  await expect(platform).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("treeitem", { name: "服务" })).toBeFocused();

  const api = page.getByRole("button", { name: "API" });
  await api.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("button", { name: "Database" })).toBeFocused();
});

test("Segmented, Tag, Disclosure, Rating, and Slider expose their keyboard contracts", async ({
  page,
}) => {
  await page.goto("/tests/");

  const list = page.getByRole("button", { name: "列表", pressed: true });
  await list.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("button", { name: "网格", pressed: true })).toBeFocused();

  const tag = page.getByRole("button", { name: "当前筛选" });
  await tag.focus();
  await page.keyboard.press("Delete");
  await expect(page.getByRole("button", { name: "移除筛选" })).toBeEnabled();

  const disclosure = page.getByRole("button", { name: "浏览器高级选项" });
  await disclosure.focus();
  await page.keyboard.press("Enter");
  await expect(disclosure).toHaveAttribute("aria-expanded", "true");

  const keyboardContracts = page.getByTestId("keyboard-contracts");
  const rating = keyboardContracts.getByRole("radio", { name: "2 of 5" });
  await rating.focus();
  await page.keyboard.press("ArrowRight");
  await expect(keyboardContracts.getByRole("radio", { name: "3 of 5" })).toBeChecked();
  await page.keyboard.press("Delete");
  await expect(keyboardContracts.getByRole("radio", { name: "3 of 5" })).not.toBeChecked();

  const slider = page.getByRole("slider", { name: "键盘比例" });
  await slider.focus();
  await page.keyboard.press("ArrowRight");
  await expect(slider).toHaveValue("51");
});

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

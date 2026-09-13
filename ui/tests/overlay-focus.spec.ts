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

test("nested Drawers restore focus one modal level at a time", async ({ page }) => {
  await page.goto("/tests/?drawerWidth=350");
  const outerTrigger = page.getByRole("button", { name: "打开长内容抽屉" });
  await outerTrigger.click();
  const outer = page.getByRole("dialog", { name: "外层抽屉" });
  const outerClose = outer.locator(".miaixz-drawer-close");
  await expect(outerClose).toHaveRole("button");
  await expect(outerClose).toBeFocused();

  const innerTrigger = outer.getByRole("button", { name: "打开内层抽屉" });
  await innerTrigger.focus();
  await page.keyboard.press("Enter");
  const inner = page.getByRole("dialog", { name: "内层抽屉" });
  const innerClose = inner.locator(".miaixz-drawer-close");
  await expect(innerClose).toHaveRole("button");
  await expect(innerClose).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(inner).toBeHidden();
  await expect(innerTrigger).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(outer).toBeHidden();
  await expect(outerTrigger).toBeFocused();
});

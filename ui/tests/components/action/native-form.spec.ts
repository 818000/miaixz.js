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

test("FormActions preserves native validation and submit behavior", async ({ page }) => {
  await page.goto("/tests/");
  const form = page.getByRole("form", { name: "原生提交表单" });
  const input = form.getByRole("textbox", { name: "必填名称" });

  await form.getByRole("button", { name: "提交原生表单" }).click();
  await expect(input).toBeFocused();
  await expect(form.getByText("尚未提交")).toBeVisible();

  await input.fill("Miaixz");
  await form.getByRole("button", { name: "提交原生表单" }).click();
  await expect(form.getByText("已提交")).toBeVisible();

  await expect(form.getByRole("textbox", { name: "发布日期" })).toHaveValue("2026-09-18");
  await expect(form.getByRole("radio", { name: "3.5 of 5" })).toBeChecked();
  await expect(form.getByRole("slider", { name: "发布比例" })).toHaveValue("40");
  await expect(form.getByRole("textbox", { name: "发布说明" })).toHaveValue("固定说明");
  await expect
    .poll(() =>
      form.evaluate((element) => Object.fromEntries(new FormData(element as HTMLFormElement))),
    )
    .toEqual({
      name: "Miaixz",
      releaseDate: "2026-09-18",
      releaseNotes: "固定说明",
      releasePercent: "40",
      serviceRating: "3.5",
    });
});

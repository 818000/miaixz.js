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
 * Verifies fixed field titles, control ownership and overlay layout in real browsers.
 */

import { expect, test, type Locator } from "@playwright/test";

/**
 * Checks normal-flow titles and their exact distance from the control frame.
 *
 * @param field - Field root with one registered control.
 * @returns Verified browser geometry.
 */
async function expectFixedTitle(field: Locator) {
  const geometry = await field.evaluate((element) => {
    const row = element.querySelector(".miaixz-field-label-row")!;
    const label = element.querySelector("label")!;
    const control = element.querySelector(".miaixz-field-control")!.firstElementChild!;
    const rowRect = row.getBoundingClientRect();
    const controlRect = control.getBoundingClientRect();
    const labelStyle = getComputedStyle(label);
    const rowStyle = getComputedStyle(row);
    return {
      gap: controlRect.top - rowRect.bottom,
      position: rowStyle.position,
      transform: rowStyle.transform,
      fontSize: labelStyle.fontSize,
      color: labelStyle.color,
      normalColor: getComputedStyle(element).getPropertyValue("--miaixz-color-text-primary").trim(),
      background: labelStyle.backgroundColor,
      labels: element.querySelectorAll("label").length,
    };
  });
  expect(geometry.gap).toBeCloseTo(8, 1);
  expect(geometry.position).toBe("static");
  expect(geometry.transform).toBe("none");
  expect(geometry.fontSize).toBe("14px");
  expect(geometry.background).toBe("rgba(0, 0, 0, 0)");
  expect(geometry.labels).toBe(1);
  return geometry;
}

test.beforeEach(async ({ page }) => {
  await page.goto("/tests/?formLabels=1");
});

test("all field controls keep one title above the frame", async ({ page }) => {
  const fields = page.getByRole("form", { name: "字段布局表单" }).locator(".miaixz-field");
  for (const field of await fields.all()) await expectFixedTitle(field);
  await expect(page.getByText("内部负责人", { exact: true })).toHaveCount(0);
  await expect(page.getByText("内部成员", { exact: true })).toHaveCount(0);
  for (const id of ["standalone-combobox", "standalone-picker"]) {
    const root = page.getByTestId(id);
    await expect(root.locator("label")).toHaveCount(1);
    const gap = await root.evaluate((element) => {
      const label = element.querySelector("label")!;
      const control = element.querySelector(".miaixz-combobox-control, .miaixz-picker-control")!;
      return control.getBoundingClientRect().top - label.getBoundingClientRect().bottom;
    });
    expect(gap).toBeCloseTo(8, 1);
  }
  const spacing = await page
    .getByTestId("label-fieldset")
    .evaluate((element) => getComputedStyle(element).rowGap);
  expect(spacing).toBe("16px");
});

test("title and placeholder remain stable through focus, value, error, readonly and disabled", async ({
  page,
}) => {
  const field = page.getByTestId("label-text");
  const input = field.getByRole("textbox", { name: "名称" });
  const initial = await expectFixedTitle(field);
  await expect(input).toHaveAttribute("placeholder", "输入完整名称");
  const placeholderOpacity = await input.evaluate(
    (element) => getComputedStyle(element, "::placeholder").opacity,
  );
  expect(Number(placeholderOpacity)).toBe(1);
  await field.locator("label").click();
  await expect(input).toBeFocused();
  expect((await expectFixedTitle(field)).color).toBe(initial.color);
  await input.fill("Miaixz");
  await expectFixedTitle(field);
  await page.getByRole("button", { name: "切换错误" }).click();
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await expect(field.getByRole("alert")).toHaveText("名称不能为空");
  expect((await expectFixedTitle(field)).color).toBe(initial.color);
  const errorBelow = await field.evaluate((element) => {
    const control = element.querySelector(".miaixz-field-control")!.firstElementChild!;
    return (
      element.querySelector('[role="alert"]')!.getBoundingClientRect().top >=
      control.getBoundingClientRect().bottom
    );
  });
  expect(errorBelow).toBe(true);
  await page.getByRole("button", { name: "切换只读" }).click();
  await expect(input).toHaveAttribute("readonly", "");
  await expectFixedTitle(field);
  await page.getByRole("button", { name: "切换禁用" }).click();
  await expect(input).toBeDisabled();
  await expectFixedTitle(field);
  await page.getByRole("button", { name: "切换禁用" }).click();
  await page.getByRole("button", { name: "切换只读" }).click();
  await page.getByRole("button", { name: "重置字段" }).click();
  await expect(input).toHaveValue("");
  await expect(input.locator("..")).not.toHaveAttribute("data-filled");
  await expectFixedTitle(field);
});

test("collection controls retain selection, wrapping and control-anchored popups", async ({
  page,
}) => {
  const field = page.getByTestId("label-combobox");
  const input = field.getByRole("combobox", { name: "负责人" });
  await input.click();
  const popup = page.getByRole("listbox");
  await expect(popup).toBeVisible();
  const popupBox = await popup.boundingBox();
  const controlBox = await field.locator(".miaixz-combobox-control").boundingBox();
  expect(popupBox!.y).toBeGreaterThanOrEqual(controlBox!.y + controlBox!.height - 9);
  await popup.getByRole("option", { name: "Beta" }).click();
  await expect(input).toHaveValue("Beta");
  await expectFixedTitle(field);
  const picker = page.getByTestId("label-picker");
  await picker.getByRole("combobox", { name: "成员" }).click();
  await page.getByRole("option", { name: "Alpha" }).click();
  await expect(picker.getByText("Alpha", { exact: true })).toBeVisible();
  await picker.getByRole("combobox").press("Escape");
  await expectFixedTitle(picker);
});

test("required controls replace browser bubbles with inline Field feedback", async ({ page }) => {
  await page.goto("/tests/");
  const form = page.getByRole("form", { name: "原生提交表单" });
  const input = form.getByRole("textbox", { name: "必填名称" });
  await expect(form).toHaveAttribute("novalidate", "");

  await form.getByRole("button", { name: "提交原生表单" }).click();

  await expect(input).toBeFocused();
  await expect(input).toHaveAttribute("aria-invalid", "true");
  const feedback = form.getByRole("alert");
  await expect(feedback).toHaveText("Please fill in this field");
  await expect(form.getByText("尚未提交", { exact: true })).toBeVisible();
  const feedbackBelowControl = await form.locator(".miaixz-field").evaluate((element) => {
    const control = element.querySelector(".miaixz-field-control")!;
    const error = element.querySelector('[role="alert"]')!;
    return error.getBoundingClientRect().top >= control.getBoundingClientRect().bottom;
  });
  expect(feedbackBelowControl).toBe(true);

  await input.fill("高级工程师");
  await expect(feedback).toHaveCount(0);
  await form.getByRole("button", { name: "提交原生表单" }).click();
  await expect(form.getByText("已提交", { exact: true })).toBeVisible();
});

test("narrow layouts show complete long titles and scrollable drawers", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  const long = page.getByTestId("label-long");
  await expectFixedTitle(long);
  const metrics = await long.locator("label").evaluate((element) => ({
    height: element.getBoundingClientRect().height,
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth,
    whiteSpace: getComputedStyle(element).whiteSpace,
  }));
  expect(metrics.height).toBeGreaterThan(20);
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth + 1);
  expect(metrics.whiteSpace).toBe("normal");
  await expect(long.getByText("选填")).toBeVisible();
  await page.getByRole("button", { name: "打开字段抽屉" }).click();
  const drawer = page.getByRole("dialog", { name: "字段抽屉" });
  await expect(drawer).toBeVisible();
  const lastInput = drawer.getByRole("textbox", { name: "抽屉字段 16", exact: true });
  await lastInput.scrollIntoViewIfNeeded();
  await expect(lastInput).toBeInViewport();
  const footer = drawer.getByRole("button", { name: "完成字段编辑" });
  await expect(footer).toBeInViewport();
  await footer.click();
  await expect(drawer).not.toBeVisible();
});

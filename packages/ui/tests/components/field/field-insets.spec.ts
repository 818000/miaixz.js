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
 * Verifies that visible trailing icons share the text inset without losing their click targets.
 */

import { expect, test } from "@playwright/test";

for (const direction of ["ltr", "rtl"] as const) {
  for (const width of [390, 1280]) {
    for (const surface of ["page", "drawer"] as const) {
      test(`${surface} field frames and icon insets match at ${width}px in ${direction}`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(
          `/tests/?fieldGeometry=1&direction=${direction}${surface === "drawer" ? "&fieldDrawer=1&uniformFields=1" : ""}`,
        );
        await expect(page.getByRole("heading", { name: "Field inset geometry" })).toBeVisible();
        const rows = await page.locator('[data-testid^="geometry-"]').evaluateAll((fields) =>
          fields.map((field) => {
            const frame = field.querySelector<HTMLElement>(".miaixz-control")!;
            const style = getComputedStyle(frame);
            const rtl = style.direction === "rtl";
            const bounds = frame.getBoundingClientRect();
            const icon = field.querySelector<HTMLElement>(
              ".miaixz-select-indicator .miaixz-icon, .miaixz-search-clear .miaixz-icon, .miaixz-combobox-toggle .miaixz-icon, .miaixz-picker-toggle .miaixz-icon, .miaixz-date-picker-trigger .miaixz-icon, .miaixz-time-picker-trigger .miaixz-icon, .miaixz-input-end-adornment .miaixz-icon-button .miaixz-icon",
            );
            const rect = icon?.getBoundingClientRect();
            const text = field.querySelector<HTMLElement>(
              ".miaixz-input-element, .miaixz-select-value, .miaixz-textarea",
            );
            const leading = frame.querySelector<HTMLElement>(
              ".miaixz-input-start-adornment, .miaixz-select-value, .miaixz-picker-content, .miaixz-combobox-input, .miaixz-input-element, .miaixz-textarea",
            );
            const leadingIcon = frame.querySelector<HTMLElement>(
              ".miaixz-input-start-adornment .miaixz-icon",
            );
            const leadingIconRect = leadingIcon?.getBoundingClientRect();
            const leadingRect = leading?.getBoundingClientRect();
            const leadingStyle = leading ? getComputedStyle(leading) : null;
            const textRect = text?.getBoundingClientRect();
            const textStyle = text ? getComputedStyle(text) : null;
            const border = parseFloat(rtl ? style.borderLeftWidth : style.borderRightWidth);
            const inset = parseFloat(style.getPropertyValue("--miaixz-control-padding-inline"));
            return {
              id: field.getAttribute("data-testid")!,
              expected: inset + border,
              leadingIconCenter: leadingIconRect
                ? leadingIconRect.top + leadingIconRect.height / 2 - bounds.top - bounds.height / 2
                : null,
              leading:
                leadingRect && leadingStyle
                  ? rtl
                    ? bounds.right - leadingRect.right + parseFloat(leadingStyle.paddingRight)
                    : leadingRect.left - bounds.left + parseFloat(leadingStyle.paddingLeft)
                  : null,
              height: bounds.height,
              expectedHeight: parseFloat(style.getPropertyValue("--miaixz-control-block-size")),
              overflow: frame.scrollWidth - frame.clientWidth,
              iconEnd: rect ? (rtl ? rect.left - bounds.left : bounds.right - rect.right) : null,
              centerDelta: rect
                ? rect.top + rect.height / 2 - bounds.top - bounds.height / 2
                : null,
              textStart:
                textRect && textStyle
                  ? rtl
                    ? bounds.right - textRect.right + parseFloat(textStyle.paddingRight)
                    : textRect.left - bounds.left + parseFloat(textStyle.paddingLeft)
                  : null,
            };
          }),
        );
        expect(rows.filter((row) => row.iconEnd !== null)).toHaveLength(17);
        for (const row of rows) {
          expect(row.overflow, row.id).toBeLessThanOrEqual(0);
          if (row.leadingIconCenter !== null)
            expect(Math.abs(row.leadingIconCenter), row.id).toBeLessThan(0.5);
          if (row.leading !== null)
            expect(Math.abs(row.leading - row.expected), row.id).toBeLessThan(0.5);
          if (!/textarea|wrapped-picker/u.test(row.id)) {
            expect(Math.abs(row.height - row.expectedHeight), row.id).toBeLessThan(0.5);
          }
          if (row.iconEnd !== null) {
            expect(Math.abs(row.iconEnd - row.expected), row.id).toBeLessThan(0.5);
            expect(Math.abs(row.centerDelta!), row.id).toBeLessThan(0.5);
          }
          if (/geometry-(input|select|textarea|number)/u.test(row.id)) {
            expect(Math.abs(row.textStart! - row.expected), row.id).toBeLessThan(0.5);
          }
        }
        const narrowEditor = page.getByTestId("geometry-narrow-number").getByRole("spinbutton");
        expect(
          await narrowEditor.evaluate((input) => input.getBoundingClientRect().width),
        ).toBeGreaterThan(20);
        await narrowEditor.press("ArrowUp");
        await expect(narrowEditor).toHaveValue("41");
        await expect(
          page.getByTestId("geometry-number-unit").locator(".miaixz-number-input-suffix"),
        ).toHaveAttribute("title", "万 Token/月");
      });
    }
  }
}

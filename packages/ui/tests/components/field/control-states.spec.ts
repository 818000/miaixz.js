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
import { mkdir } from "node:fs/promises";
import path from "node:path";

test.describe.configure({ mode: "parallel" });

const themes = [
  "miaixz",
  "neutral",
  "contrast",
  "glacier",
  "porcelain",
  "tidal",
  "olive",
  "amber",
  "copper",
  "rose",
  "ink",
] as const;
const extraTheme = process.env.MIAIXZ_STATE_EXTRA_THEME
  ? JSON.parse(process.env.MIAIXZ_STATE_EXTRA_THEME)
  : null;
const checkedThemes: readonly string[] = extraTheme ? [...themes, extraTheme.name] : themes;
const labels = [
  "Input",
  "Textarea",
  "NumberInput",
  "Select",
  "Combobox",
  "Picker",
  "DatePicker",
  "TimePicker",
] as const;

/**
 * Resolves a semantic color inside the current field's theme scope.
 * @param frame Shared control frame.
 * @param token Theme color or surface role.
 * @returns Normalized browser color.
 */
async function color(frame: Locator, token: string) {
  return frame.evaluate((element, name) => {
    const probe = document.createElement("span");
    probe.style.color = `var(${name})`;
    element.append(probe);
    const value = getComputedStyle(probe).color;
    probe.remove();
    return value;
  }, token);
}

for (const theme of checkedThemes)
  for (const mode of ["light", "dark"] as const)
    test(`${theme} ${mode}: every public field retains consistent six-state surfaces`, async ({
      page,
    }) => {
      test.setTimeout(90_000);
      await page.goto(
        `/tests/?controlStates=1&theme=${theme}&colorMode=${mode}${extraTheme && theme === extraTheme.name ? "&extraTheme=" + encodeURIComponent(JSON.stringify(extraTheme)) : ""}`,
      );
      const folder = path.resolve(
        process.env.MIAIXZ_STATE_AUDIT_DIR ?? "tests/.artifacts/control-states",
        `${theme}-${mode}`,
      );
      await mkdir(folder, { recursive: true });
      for (const state of [
        "normal",
        "hover",
        "focus",
        "readonly",
        "disabled",
        "invalid",
      ] as const) {
        await page
          .getByRole("button", {
            name:
              state === "readonly"
                ? "只读"
                : state === "disabled"
                  ? "禁用"
                  : state === "invalid"
                    ? "错误"
                    : "普通",
            exact: true,
          })
          .click();
        for (const label of labels) {
          const field = page.getByTestId(`state-${label}`);
          const control = field
            .locator('input:not([type="hidden"]), textarea, button[role="combobox"]')
            .first();
          const frame = field.locator(".miaixz-control").first();
          const expected = await color(
            frame,
            state === "invalid"
              ? "--miaixz-color-danger"
              : ["hover", "focus", "readonly"].includes(state)
                ? "--miaixz-surface-role-selected-border"
                : "--miaixz-color-border",
          );
          if (state === "hover") await control.hover();
          if (["focus", "readonly", "invalid"].includes(state)) {
            await control.focus();
            await expect(control).toBeFocused();
            await expect(control).toHaveCSS("outline-width", "0px");
            await expect(frame).toHaveCSS("outline-width", "0px");
          }
          if (state === "readonly") {
            await expect(frame).toHaveAttribute("data-readonly", "true");
            const before = await control.evaluate((element) =>
              "value" in element ? String(element.value) : element.textContent,
            );
            await control.press("X");
            await control.press("ArrowUp");
            expect(
              await control.evaluate((element) =>
                "value" in element ? String(element.value) : element.textContent,
              ),
            ).toBe(before);
            await expect(frame).toHaveCSS("box-shadow", "none");
          }
          if (state === "disabled") {
            await expect(control).toBeDisabled();
            await frame.hover();
            await expect(frame).toHaveCSS("box-shadow", "none");
          }
          if (state === "invalid") await control.hover();
          await expect(frame).toHaveCSS("border-top-color", expected);
          for (const auxiliary of await field.locator(".miaixz-field-action").all()) {
            await expect(auxiliary).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
            await expect(auxiliary).toHaveCSS("border-top-width", "0px");
            if (state === "focus" && (await auxiliary.isEnabled())) {
              await auxiliary.focus();
              await expect(auxiliary).toHaveCSS("outline-width", "0px");
            }
          }
          await field.screenshot({ path: path.join(folder, `${label}-${state}.png`) });
          if (await control.isEnabled()) {
            await control.focus();
            await control.press("Escape");
          }
          await page.getByRole("heading", { name: "Shared control states", exact: true }).click();
        }
        await page.screenshot({ path: path.join(folder, `${state}.png`), fullPage: true });
      }
    });

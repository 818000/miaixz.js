/**
 * Verifies table effects behavior in the UI package.
 */

import { expect, test } from "@playwright/test";

for (const theme of [
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
])
  for (const colorMode of ["light", "dark"]) {
    test(`${theme} ${colorMode}: searchable options keep the same visible selected surface`, async ({
      page,
    }) => {
      await page.goto(`/tests/?formLabels=1&theme=${theme}&colorMode=${colorMode}`);
      for (const component of ["combobox", "picker"]) {
        const input = page.getByTestId(`standalone-${component}`).getByRole("combobox");
        await input.click();
        const option = page.getByRole("option", { name: "Alpha", exact: true });
        const expected = await option.evaluate((element) => {
          const probe = document.createElement("span");
          probe.style.backgroundColor = "var(--miaixz-surface-role-selected-background)";
          element.append(probe);
          const color = getComputedStyle(probe).backgroundColor;
          probe.remove();
          return color;
        });
        await option.hover();
        await expect(option).toHaveCSS("background-color", expected);
        await page.mouse.down();
        await expect(option).toHaveCSS("background-color", expected);
        await page.mouse.up();
        if (component === "combobox") await input.click();
        await expect(option).toHaveAttribute("aria-selected", "true");
        await page.mouse.move(10, 10);
        await expect(option).toHaveCSS("background-color", expected);
        await expect(option).toHaveCSS("opacity", "1");
        await option.hover();
        await expect(option).toHaveCSS("background-color", expected);
        await page.keyboard.press("Escape");
      }
    });
  }

import { expect, test } from "@playwright/test";

test("Masonry uses CSS columns without wrapping or reordering its children", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/tests/");
  const masonry = page.getByTestId("masonry-layout");
  await expect(masonry).toHaveAttribute("data-columns", "4");
  await expect(masonry).toHaveAttribute("data-gap", "compact");
  await expect.poll(() => masonry.evaluate((node) => getComputedStyle(node).columnCount)).toBe("4");
  expect(await masonry.locator(":scope > article").count()).toBe(8);
  expect(
    await masonry
      .locator(":scope > *")
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-testid"))),
  ).toEqual(Array.from({ length: 8 }, (_, index) => `masonry-item-${index + 1}`));
});

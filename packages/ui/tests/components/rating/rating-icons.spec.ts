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
 * Checks the actual public Rating half-star fixture with native font pixels, without records.
 */
import { expect, test, type Locator } from "@playwright/test";
import { Icon, type IconName } from "@miaixz/icons";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { devNull } from "node:os";

const font = await readFile(createRequire(import.meta.url).resolve("@miaixz/icons/font.woff2"));

/**
 * Gets the character from the public component, not an internal mapping or codepoint snapshot.
 * @param name - Public icon name.
 * @returns Publicly rendered font character.
 */
function character(name: IconName): string {
  const match = /data-miaixz-icon-glyph="([^"]+)"/u.exec(
    renderToStaticMarkup(createElement(Icon, { name, size: "feature" })),
  );
  if (!match?.[1]) throw new Error("Public Icon emitted no glyph.");
  return match[1];
}

/**
 * Measures the production fill against the same star with only that fill hidden.
 * @param star - Real Rating star with its ordinary outline still present.
 * @returns Native fill pixel counts in the left and right halves.
 */
async function fillPixels(star: Locator): Promise<{ left: number; right: number }> {
  const before = await star.screenshot({ animations: "disabled" });
  const fill = star.locator(".miaixz-rating-fill");
  const original = await fill.evaluate((element) => {
    const target = element as HTMLElement,
      value = target.style.visibility;
    target.style.visibility = "hidden";
    return value;
  });
  let hidden: Buffer;
  try {
    hidden = await star.screenshot({ animations: "disabled" });
  } finally {
    await fill.evaluate((element, value) => {
      (element as HTMLElement).style.visibility = value;
    }, original);
  }
  return star.evaluate(
    async (_element, pictures) => {
      const rasters = [];
      for (const picture of pictures) {
        const image = new Image();
        image.src = "data:image/png;base64," + picture;
        await image.decode();
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Native image decoder unavailable.");
        context.drawImage(image, 0, 0);
        rasters.push({
          width: image.width,
          height: image.height,
          data: context.getImageData(0, 0, image.width, image.height).data,
        });
      }
      const a = rasters[0]!,
        b = rasters[1]!;
      if (a.width !== b.width || a.height !== b.height)
        throw new Error("Rating layout changed while observing fill.");
      let left = 0,
        right = 0;
      for (let y = 0; y < a.height; y++)
        for (let x = 0; x < a.width; x++) {
          const index = (y * a.width + x) * 4;
          if (
            [0, 1, 2, 3].some(
              (channel) => Math.abs(a.data[index + channel]! - b.data[index + channel]!) > 1,
            )
          ) {
            if (x < a.width / 2) left++;
            else right++;
          }
        }
      return { left, right };
    },
    [before.toString("base64"), hidden!.toString("base64")],
  );
}

test.beforeEach(({ browserName }, info) => {
  void browserName;
  if (process.env.MIAIXZ_ICON_NO_RECORDS === "1") info.outputPath = () => devNull;
});

test("真实3.5评分显示第四项半星，选择4后使用完整星形", async ({ page }) => {
  const fonts: Buffer[] = [];
  page.on("response", async (response) => {
    if (response.ok() && response.url().includes(".woff2")) fonts.push(await response.body());
  });
  await page.goto("/tests/?a11y=rating");
  const rating = page.getByTestId("a11y-rating");
  await expect(rating).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const stars = rating.locator(".miaixz-rating-star"),
    fourth = stars.nth(3);
  await expect(stars).toHaveCount(5);
  await expect(rating.locator('[data-fill="half"]')).toHaveCount(1);
  await expect(fourth).toHaveAttribute("data-fill", "half");
  /**
   * The shared browser fixture uses the SDK's English default, unlike the Chinese unit fixture.
   */
  const halfRating = rating.getByRole("radio", { name: "3.5 of 5", exact: true }),
    fullRating = rating.getByRole("radio", { name: "4 of 5", exact: true });
  await expect(halfRating).toHaveValue("3.5");
  await expect(halfRating).toBeChecked();
  await expect(rating.locator('input[type="radio"]:checked')).toHaveCount(1);
  await expect(rating.getByRole("radio", { name: "5 分中的 3.5 分", exact: true })).toHaveCount(0);
  await expect(fourth.locator(".miaixz-rating-icon .miaixz-icon-glyph")).toHaveAttribute(
    "data-miaixz-icon-glyph",
    character("star"),
  );
  await expect(fourth.locator(".miaixz-rating-fill .miaixz-icon-glyph")).toHaveAttribute(
    "data-miaixz-icon-glyph",
    character("star-half"),
  );
  const production = await fourth.evaluate(async (element) => {
    const icon = element.querySelector(".miaixz-rating-icon .miaixz-icon-glyph")!;
    const fill = element.querySelector(".miaixz-rating-fill")!,
      styles = getComputedStyle(icon);
    const faces = await document.fonts.load(
      styles.fontSize + ' "Miaixz Icons"',
      icon.getAttribute("data-miaixz-icon-glyph") ?? "",
    );
    return {
      loaded: faces.length > 0,
      size: parseFloat(styles.fontSize),
      variation: styles.fontVariationSettings,
      width: element.getBoundingClientRect().width,
      fillWidth: fill.getBoundingClientRect().width,
      overflow: getComputedStyle(fill).overflow,
    };
  });
  expect(production.loaded).toBe(true);
  expect(production.width).toBe(production.size);
  expect(production.variation).toContain('"opsz" ' + production.size);
  expect(production.fillWidth).toBe(production.width / 2);
  expect(production.overflow).toBe("hidden");
  await expect.poll(() => fonts.some((bytes) => bytes.equals(font))).toBe(true);
  const half = await fillPixels(fourth);
  expect(half.left).toBeGreaterThan(0);
  expect(half.right).toBe(0);

  await expect(fullRating).toHaveValue("4");
  await fullRating.check();
  await expect(fullRating).toBeChecked();
  await expect(halfRating).not.toBeChecked();
  await expect(rating.locator('input[type="radio"]:checked')).toHaveCount(1);
  await expect(rating.locator('[data-fill="half"]')).toHaveCount(0);
  await expect(rating.locator('[data-fill="full"]')).toHaveCount(4);
  await expect(fourth.locator(".miaixz-rating-fill .miaixz-icon-glyph")).toHaveAttribute(
    "data-miaixz-icon-glyph",
    character("star"),
  );
  const full = await fillPixels(fourth);
  expect(full.left).toBeGreaterThan(0);
  expect(full.right).toBeGreaterThan(0);
});

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
 * Tests public Icon markup with production CSS and the actual release WOFF2 in three engines.
 * Static markup checks display only; client loading/failure behavior remains covered by runtime tests.
 */
import { createHash } from "node:crypto";
import { devNull } from "node:os";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test, type Page } from "@playwright/test";
import type { IconName } from "../src/index.js";
import { startFontTestServer, type FontTestServer } from "./assets/fonts/font-server.helper.js";

const { loadIconSource } = await import(
  pathToFileURL(resolve(process.cwd(), "../../.github/scripts/modules/icons/source.mjs")).href
);
const { PNG } = await import(pathToFileURL(createRequire(import.meta.url).resolve("pngjs")).href);
const { coverageRaster, surface, cropRaster, compareRasters } = await import(
  pathToFileURL(resolve(process.cwd(), "tests/assets/fonts/render-catalog.helper.mjs")).href
);
const source = await loadIconSource();
const { Icon } = (await import(pathToFileURL(resolve(process.cwd(), "dist/index.js")).href)) as {
  Icon: typeof import("../src/index.js").Icon;
};
const fontPath = "/assets/miaixz-icons.woff2";
const fontBytes = await readFile(
  resolve(process.cwd(), "dist/assets/fonts", source.design.font.outputFile),
);
const fonts = Object.freeze({ [fontPath]: new Uint8Array(fontBytes) });
const productionCss = await readFile(resolve(process.cwd(), "dist/styles.css"), "utf8");
const family = source.design.font.familyName;
const pilots: IconName[] = [
  "layout-dashboard",
  "folder",
  "building",
  "shield-check",
  "workflow",
  "scroll-text",
  "server-cog",
  "settings",
  "loader",
  "star-half",
  "command",
  "shield-x",
];

/**
 * Keeps failures visible in the terminal without saving error-context files.
 */
test.beforeEach(({ browserName }, testInfo) => {
  void browserName;
  testInfo.outputPath = () => devNull;
});
const firstName = source.icons[0].name as IconName,
  lastName = source.icons.at(-1).name as IconName;

test("captures the complete 40px grid at fixed native dimensions despite blank line-box overflow", async ({
  browser,
}) => {
  const entries = [
    ...source.icons.map((icon: { rtl: string }) => ({ ...icon, direction: "ltr" })),
    ...source.icons
      .filter((icon: { rtl: string }) => icon.rtl === "mirror")
      .map((icon: { rtl: string }) => ({ ...icon, direction: "rtl" })),
  ];
  const css = productionCss.replace(
    /url\([^)]*miaixz-icons\.woff2[^)]*\)/gu,
    'url("data:font/woff2;base64,' + fontBytes.toString("base64") + '")',
  );
  const padding = source.design.visual.comparison.paddingCssPixels,
    cell = 40 + 2 * padding,
    width = 32 * cell,
    height = Math.ceil(entries.length / 32) * cell;
  for (const dpr of [1, 2]) {
    const context = await browser.newContext({
      deviceScaleFactor: dpr,
      viewport: { width, height },
    });
    try {
      const page = await context.newPage();
      await page.setContent(
        surface({ entries, sourcePaths: [], css, size: 40, fill: 0, padding, layer: "font" }),
      );
      await page.evaluate(
        async ({ family, glyph }) => {
          const faces = await document.fonts.load('40px "' + family + '"', glyph);
          if (!faces.length) throw new Error("Actual release font face is absent.");
          await document.fonts.ready;
          await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
        },
        { family, glyph: String.fromCodePoint(source.icons[0].codepoint) },
      );
      const sheet = coverageRaster(PNG.sync.read(await page.screenshot({ fullPage: false })));
      expect([sheet.width, sheet.height]).toEqual([width * dpr, height * dpr]);
      const last = cropRaster(sheet, entries.length - 1, cell * dpr);
      const measured = compareRasters(last, last, source.design.visual.comparison);
      expect(measured.sourceEmpty).toBe(false);
      expect(measured.clipped).toBe(false);
    } finally {
      await context.close();
    }
  }
});

/**
 * Mounts real public component output without rebuilding its glyph DOM or animation CSS.
 * @param page - Actual browser test page.
 * @param server - Isolated actual release-font server.
 * @param names - Public canonical icon names.
 * @param size - Native CSS pixel size.
 * @param motion - Public component motion policy.
 * @param direction - Actual document direction.
 * @param fill - Public continuous FILL value.
 * @returns Completion after the actual production font loads.
 */
async function mount(
  page: Page,
  server: FontTestServer,
  names: IconName[],
  size = 24,
  motion: "auto" | "none" = "auto",
  direction = "ltr",
  fill = 0,
) {
  const css = productionCss.replace(
    /url\([^)]*miaixz-icons\.woff2[^)]*\)/gu,
    'url("' + server.origin + fontPath + '")',
  );
  const markup = names
    .map((name, index) => {
      const properties = {
        name,
        size,
        motion,
        fill,
        className: "sample",
        ...(index === 0 ? { label: "Public icon sample" } : {}),
        "data-testid": "icon-" + index,
      };
      return renderToStaticMarkup(createElement(Icon, properties));
    })
    .join("");
  await page.setContent(
    '<!doctype html><html dir="' +
      direction +
      '"><head><style>' +
      css +
      "\nhtml,body{margin:0;background:#fff;color:#000}.sample{margin:2px}</style></head><body>" +
      markup +
      "</body></html>",
  );
  await page.evaluate(async (name) => {
    const glyph = document
      .querySelector(".miaixz-icon-glyph")
      ?.getAttribute("data-miaixz-icon-glyph");
    if (!glyph) throw new Error("Actual public glyph is absent.");
    const faces = await document.fonts.load('24px "' + name + '"', glyph);
    if (!faces.length) throw new Error("Actual production font did not load.");
    await document.fonts.ready;
  }, family);
}

/**
 * Requires real foreground pixels and transparent exterior, without threshold relaxation or scaling.
 * @param page - Browser page containing actual component output.
 * @param index - Public component sample index.
 * @returns Completion after nonempty and unclipped pixel assertions.
 */
async function assertForeground(page: Page, index: number) {
  const icon = page.getByTestId("icon-" + index);
  await expect(icon).toBeVisible();
  const box = await icon.boundingBox();
  if (!box) throw new Error("Actual public icon has no layout box.");
  const padding = source.design.visual.comparison.paddingCssPixels;
  const png = coverageRaster(
    PNG.sync.read(
      await page.screenshot({
        clip: {
          x: box.x - padding,
          y: box.y - padding,
          width: box.width + 2 * padding,
          height: box.height + 2 * padding,
        },
      }),
    ),
  );
  let pixels = 0,
    clipped = false;
  for (let y = 0; y < png.height; y++)
    for (let x = 0; x < png.width; x++) {
      const alpha = png.data[(y * png.width + x) * 4 + 3]!;
      if (alpha > 0) {
        pixels++;
        if (x === 0 || y === 0 || x === png.width - 1 || y === png.height - 1) clipped = true;
      }
    }
  expect(pixels).toBeGreaterThan(0);
  expect(clipped).toBe(false);
}

test("keeps root and catalog public boundaries separate", async () => {
  const root = await import(pathToFileURL(resolve(process.cwd(), "dist/index.js")).href);
  const catalog = await import(
    pathToFileURL(resolve(process.cwd(), "dist/values/metadata.js")).href
  );
  expect(Object.keys(root).sort()).toEqual([
    "Icon",
    "VERSION",
    "isIconName",
    "parseIconName",
    "preloadIconFont",
  ]);
  expect(Object.keys(catalog)).toEqual(["ICON_CATALOG"]);
  expect(catalog.ICON_CATALOG.map((entry: { name: string }) => entry.name)).toEqual(
    source.icons.map((i: { name: string }) => i.name),
  );
  for (const entry of catalog.ICON_CATALOG)
    expect(Object.keys(entry)).toEqual(["name", "category"]);
  expect(root.isIconName("toString")).toBe(false);
  expect(() => root.parseIconName("__proto__")).toThrow(TypeError);
});

/**
 * Reads native device pixels for one unmodified public CSS box.
 * Rejects invalid or out-of-sheet addressing instead of treating missing bytes as transparent.
 * @param raster - Actual RGBA coverage sheet.
 * @param box - Actual CSS-pixel layout rectangle.
 * @param padding - Unchanged design padding in CSS pixels.
 * @param dpr - Actual browser device pixel ratio.
 * @returns Actual nonempty-pixel count and sampling-edge contact.
 */
function publicCellRaster(
  raster: { width: number; height: number; data: Uint8Array },
  box: { x: number; y: number; width: number; height: number },
  padding: number,
  dpr: number,
) {
  const x0 = (box.x - padding) * dpr,
    y0 = (box.y - padding) * dpr,
    width = (box.width + 2 * padding) * dpr,
    height = (box.height + 2 * padding) * dpr;
  if (
    ![1, 2].includes(dpr) ||
    !Number.isFinite(padding) ||
    padding < 0 ||
    ![raster.width, raster.height, x0, y0, width, height].every(Number.isSafeInteger) ||
    width <= 0 ||
    height <= 0 ||
    x0 < 0 ||
    y0 < 0 ||
    x0 + width > raster.width ||
    y0 + height > raster.height ||
    raster.data.length !== raster.width * raster.height * 4
  )
    throw new Error("Invalid native public-cell addressing.");
  let ink = 0,
    clipped = false;
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      if (raster.data[((y0 + y) * raster.width + x0 + x) * 4 + 3]! > 0) {
        ink++;
        if (x === 0 || y === 0 || x === width - 1 || y === height - 1) clipped = true;
      }
    }
  return { ink, clipped };
}

test("maps independent CSS boxes to actual native pixels and rejects real clipping", () => {
  const box = { x: 10, y: 10, width: 20, height: 20 },
    padding = 4;
  for (const dpr of [1, 2]) {
    const side = 64 * dpr,
      data = new Uint8Array(side * side * 4),
      raster = { width: side, height: side, data };
    for (let y = 14 * dpr; y < 26 * dpr; y++)
      for (let x = 14 * dpr; x < 26 * dpr; x++) data[(y * side + x) * 4 + 3] = 255;
    expect(publicCellRaster(raster, box, padding, dpr)).toEqual({
      ink: 144 * dpr * dpr,
      clipped: false,
    });
    if (dpr === 2) expect(publicCellRaster(raster, box, padding, 1).clipped).toBe(true);
    expect(
      publicCellRaster({ ...raster, data: new Uint8Array(data.length) }, box, padding, dpr),
    ).toEqual({ ink: 0, clipped: false });
    const clipped = data.slice();
    clipped[(6 * dpr * side + 10 * dpr) * 4 + 3] = 255;
    expect(publicCellRaster({ ...raster, data: clipped }, box, padding, dpr).clipped).toBe(true);
    expect(() => publicCellRaster({ ...raster, data: data.slice(4) }, box, padding, dpr)).toThrow(
      "addressing",
    );
    expect(() => publicCellRaster(raster, { ...box, x: -1 }, padding, dpr)).toThrow("addressing");
    expect(() => publicCellRaster(raster, { ...box, x: 63 }, padding, dpr)).toThrow("addressing");
    expect(() => publicCellRaster(raster, { ...box, x: 10.25 }, padding, dpr)).toThrow(
      "addressing",
    );
    expect(() => publicCellRaster(raster, box, padding, 3)).toThrow("addressing");
  }
});

test("renders every catalog name through the public Icon at 20px in outline and filled", async ({
  page,
}) => {
  const server = await startFontTestServer({ fonts });
  try {
    const names = source.icons.map((icon: { name: IconName }) => icon.name);
    for (const fill of [0, 1]) {
      await mount(page, server, names, 20, "none", "ltr", fill);
      await page.evaluate(() => {
        Object.assign(document.body.style, {
          display: "grid",
          gridTemplateColumns: "repeat(32, max-content)",
          gap: "4px",
          padding: "8px",
          width: "max-content",
        });
      });
      const cells = await page.locator(".sample").evaluateAll((elements) =>
        elements.map((element) => {
          const box = element.getBoundingClientRect(),
            glyph = element.querySelector(".miaixz-icon-glyph")!;
          return {
            x: box.x,
            y: box.y,
            width: box.width,
            height: box.height,
            character: glyph.getAttribute("data-miaixz-icon-glyph"),
            variation: getComputedStyle(glyph).fontVariationSettings,
          };
        }),
      );
      expect(cells).toHaveLength(names.length);
      const raster = coverageRaster(
        PNG.sync.read(await page.screenshot({ fullPage: true, animations: "disabled" })),
      );
      const native = await page.evaluate(() => ({
        dpr: devicePixelRatio,
        width: Math.max(document.documentElement.scrollWidth, innerWidth),
        height: Math.max(document.documentElement.scrollHeight, innerHeight),
      }));
      expect([raster.width, raster.height]).toEqual([
        native.width * native.dpr,
        native.height * native.dpr,
      ]);
      const padding = source.design.visual.comparison.paddingCssPixels;
      for (const [index, cell] of cells.entries()) {
        expect(cell.width, names[index]).toBe(20);
        expect(cell.height, names[index]).toBe(20);
        expect(cell.character, names[index]).toBeTruthy();
        expect(cell.variation, names[index]).toBe('"FILL" ' + fill + ', "opsz" 20');
        const { ink, clipped } = publicCellRaster(raster, cell, padding, native.dpr);
        expect(ink, names[index]).toBeGreaterThan(0);
        expect(clipped, names[index]).toBe(false);
      }
    }
  } finally {
    await server.close();
  }
});

test("loads both Unicode-range ends from one actual font response", async ({ page }) => {
  const server = await startFontTestServer({ fonts });
  try {
    const response = page.waitForResponse(
      (r) => r.url() === server.origin + fontPath && r.status() === 200,
    );
    await mount(page, server, [firstName, lastName]);
    const bytes = await (await response).body();
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(
      createHash("sha256").update(fontBytes).digest("hex"),
    );
    expect(server.count(fontPath)).toBe(1);
    await assertForeground(page, 0);
    await assertForeground(page, 1);
    await expect(page.getByTestId("icon-0")).toHaveAttribute("role", "img");
    await expect(page.getByTestId("icon-0")).toHaveAttribute("aria-label", "Public icon sample");
    await expect(page.getByTestId("icon-1")).toHaveAttribute("aria-hidden", "true");
  } finally {
    await server.close();
  }
});

test("uses the actual 180ms FILL transition on the inner glyph", async ({ page }) => {
  const server = await startFontTestServer({ fonts });
  try {
    await mount(page, server, ["folder"]);
    const values = await page
      .getByTestId("icon-0")
      .locator(".miaixz-icon-glyph")
      .evaluate(async (element) => {
        const target = element as HTMLElement;
        target.style.setProperty("--miaixz-icon-fill", "0");
        await new Promise<void>((done) => requestAnimationFrame(() => done()));
        target.style.setProperty("--miaixz-icon-fill", "1");
        await new Promise<void>((done) => requestAnimationFrame(() => done()));
        const animation = target.getAnimations()[0];
        if (!animation) throw new Error("Production transition is absent.");
        const samples: number[] = [];
        for (const time of [0, 45, 90, 135, 180]) {
          animation.currentTime = time;
          const match = /"FILL"\s+([\d.]+)/u.exec(getComputedStyle(target).fontVariationSettings);
          if (!match?.[1]) throw new Error("Actual FILL coordinate is missing.");
          samples.push(Number(match[1]));
        }
        return { samples, duration: getComputedStyle(target).transitionDuration };
      });
    expect(values.duration).toBe("0.18s");
    expect(values.samples[0]).toBeCloseTo(0);
    expect(values.samples.at(-1)).toBeCloseTo(1);
    expect(values.samples[2]).toBeGreaterThan(0);
    expect(values.samples[2]).toBeLessThan(1);
  } finally {
    await server.close();
  }
});

test("mirrors only marked glyphs in actual RTL contexts", async ({ page }) => {
  const server = await startFontTestServer({ fonts });
  const mirror = source.icons.find((i: { rtl: string }) => i.rtl === "mirror").name as IconName;
  try {
    await mount(page, server, [mirror, "folder"], 24, "none", "ltr");
    for (const index of [0, 1])
      await expect(page.getByTestId("icon-" + index).locator(".miaixz-icon-glyph")).toHaveCSS(
        "transform",
        "none",
      );
    await page.locator("html").evaluate((element) => element.setAttribute("dir", "rtl"));
    await expect(page.getByTestId("icon-0").locator(".miaixz-icon-glyph")).toHaveCSS(
      "transform",
      "matrix(-1, 0, 0, 1, 0, 0)",
    );
    await expect(page.getByTestId("icon-1").locator(".miaixz-icon-glyph")).toHaveCSS(
      "transform",
      "none",
    );
    await expect(page.getByTestId("icon-0")).toHaveCSS("transform", "none");
  } finally {
    await server.close();
  }
});

test("uses production motion-none and reduced-motion rules", async ({ page }) => {
  const server = await startFontTestServer({ fonts });
  try {
    await mount(page, server, ["folder"], 24, "none");
    await expect(page.getByTestId("icon-0").locator(".miaixz-icon-glyph")).toHaveCSS(
      "transition-duration",
      "0s",
    );
    await mount(page, server, ["folder"], 24, "auto");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(page.getByTestId("icon-0").locator(".miaixz-icon-glyph")).toHaveCSS(
      "transition-duration",
      "0s",
    );
  } finally {
    await server.close();
  }
});

for (const size of [12, 16, 20, 24, 32, 40]) {
  test(
    "renders pilot and branch-regression public icons at actual " +
      size +
      "px without per-icon compensation",
    async ({ page }) => {
      const server = await startFontTestServer({ fonts });
      try {
        for (const fill of [0, 1]) {
          await mount(page, server, pilots, size, "none", "ltr", fill);
          for (const [index, name] of pilots.entries()) {
            const icon = page.getByTestId("icon-" + index),
              glyph = icon.locator(".miaixz-icon-glyph");
            await expect(icon).toHaveCSS("width", size + "px");
            await expect(icon).toHaveCSS("height", size + "px");
            await expect(glyph).toHaveCSS("font-size", size + "px");
            await expect(glyph).toHaveCSS(
              "font-variation-settings",
              '"FILL" ' + fill + ', "opsz" ' + size,
            );
            await expect(glyph).toHaveCSS("transform", "none");
            expect(await glyph.getAttribute("data-miaixz-icon-glyph")).toBe(
              String.fromCodePoint(
                source.icons.find((i: { name: string }) => i.name === name).codepoint,
              ),
            );
            await assertForeground(page, index);
          }
        }
      } finally {
        await server.close();
      }
    },
  );
}

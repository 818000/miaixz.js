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
 * Renders deterministic icon review sheets, contact sheets, and alpha centroids.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";

import { chromium } from "@playwright/test";
import { PNG } from "pngjs";

const packageRoot = process.cwd();
const manifest = JSON.parse(
  await readFile(resolve(packageRoot, "package.json"), "utf8"),
);
if (manifest.name !== "@miaixz/icons")
  throw new Error("render-catalog.mjs must run from @miaixz/icons.");

const assetsRoot = resolve(packageRoot, "src/assets");
const outputRoot = resolve(packageRoot, "tests/.artifacts/icon-visual/current");
const catalog = JSON.parse(
  await readFile(resolve(assetsRoot, "catalog.json"), "utf8"),
).icons;
const releasePlan = JSON.parse(
  await readFile(resolve(assetsRoot, "release-plan.json"), "utf8"),
);
const catalogByName = new Map(catalog.map((entry) => [entry.name, entry]));
const sizes = [12, 16, 20, 24, 32, 40];
const opticalSizes = ["compact", "standard", "display"];
const directions = ["ltr", "rtl"];
const themes = { light: "#111111", dark: "#f5f5f5" };
const stableEntries = catalog.filter(
  (entry) => entry.source === "miaixz" && entry.status === "stable",
);

await mkdir(outputRoot, { recursive: true });

/**
 * Reads the requested SVG or applies the frozen standard optical fallback.
 *
 * @param {object} entry Catalog entry.
 * @param {string} variant Visual variant.
 * @param {string} opticalSize Requested optical size.
 * @returns {Promise<string | null>} SVG source or null for an empty slot.
 */
async function readSvg(entry, variant, opticalSize) {
  const available = entry.variants[variant] ?? [];
  const actual = available.includes(opticalSize)
    ? opticalSize
    : opticalSize !== "standard" && available.includes("standard")
      ? "standard"
      : null;
  if (actual === null) return null;
  return readFile(
    resolve(assetsRoot, "svg", variant, actual, `${entry.name}.svg`),
    "utf8",
  );
}

/**
 * Sizes and optionally mirrors one safe committed SVG.
 *
 * @param {string} source SVG source.
 * @param {number} size Pixel size.
 * @param {boolean} mirror Whether to mirror geometry.
 * @returns {string} Renderable markup.
 */
function sizedSvg(source, size, mirror) {
  return source.replace(
    "<svg ",
    `<svg width="${size}" height="${size}" style="display:block;${mirror ? "transform:scaleX(-1);" : ""}" `,
  );
}

/**
 * Creates one exact 8 x 8 contact sheet page.
 *
 * @param {string[]} names Batch names.
 * @param {string} variant Visual variant.
 * @param {string} opticalSize Optical-size request.
 * @param {string} direction Direction sample.
 * @param {string} foreground Foreground color.
 * @returns {Promise<string>} Standalone HTML.
 */
async function contactSheet(
  names,
  variant,
  opticalSize,
  direction,
  foreground,
) {
  const cells = [];
  for (const [index, name] of names.entries()) {
    const entry = catalogByName.get(name);
    const source =
      direction === "rtl" && entry.rtl !== "mirror"
        ? null
        : await readSvg(entry, variant, opticalSize);
    const row = Math.floor(index / 8);
    const column = index % 8;
    const samples = source
      ? sizes
          .map(
            (size, sizeIndex) =>
              `<span style="position:absolute;left:${8 + sizeIndex * 40}px;top:16px;width:40px;height:64px;display:flex;align-items:center;justify-content:center">${sizedSvg(source, size, direction === "rtl")}</span>`,
          )
          .join("")
      : "";
    cells.push(
      `<div style="position:absolute;left:${column * 256}px;top:${row * 96}px;width:256px;height:96px">${samples}</div>`,
    );
  }
  return `<!doctype html><html><body style="margin:0;width:2048px;height:768px;overflow:hidden;background:transparent;color:${foreground}">${cells.join("")}</body></html>`;
}

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 2048, height: 768 },
  deviceScaleFactor: 1,
  colorScheme: "light",
});
const rendered = [];
const centroids = {};
try {
  const variants = ["outline", "filled"].filter((variant) =>
    catalog.some((entry) => (entry.variants[variant] ?? []).length > 0),
  );
  for (const variant of variants) {
    for (const opticalSize of opticalSizes) {
      for (const direction of directions) {
        for (const [theme, foreground] of Object.entries(themes)) {
          for (const batch of releasePlan.batches) {
            const pageNumber = batch.id.slice(-2);
            const filename = `${variant}-${opticalSize}-${direction}-${theme}-${pageNumber}.png`;
            await page.setContent(
              await contactSheet(
                batch.names,
                variant,
                opticalSize,
                direction,
                foreground,
              ),
            );
            await page.screenshot({
              path: resolve(outputRoot, filename),
              omitBackground: true,
              clip: { x: 0, y: 0, width: 2048, height: 768 },
            });
            rendered.push(filename);
          }
        }
      }
    }
  }

  await page.setViewportSize({ width: 240, height: 240 });
  for (const entry of stableEntries) {
    for (const variant of Object.keys(entry.variants)) {
      for (const opticalSize of entry.variants[variant]) {
        const source = await readSvg(entry, variant, opticalSize);
        await page.setContent(
          `<!doctype html><html><body style="margin:0;width:240px;height:240px;background:transparent;color:#000"><div style="width:240px;height:240px">${sizedSvg(source, 240, false)}</div></body></html>`,
        );
        const png = PNG.sync.read(
          await page.screenshot({ omitBackground: true }),
        );
        let weight = 0;
        let weightedX = 0;
        let weightedY = 0;
        for (let y = 0; y < png.height; y += 1) {
          for (let x = 0; x < png.width; x += 1) {
            const alpha = png.data[(y * png.width + x) * 4 + 3];
            weight += alpha;
            weightedX += alpha * (x + 0.5);
            weightedY += alpha * (y + 0.5);
          }
        }
        if (weight === 0)
          throw new Error(
            `${entry.name}/${variant}/${opticalSize} rendered empty.`,
          );
        centroids[`${entry.name}/${variant}/${opticalSize}`] = {
          x: Number((weightedX / weight / 10).toFixed(3)),
          y: Number((weightedY / weight / 10).toFixed(3)),
        };
      }
    }
  }
  await writeFile(
    resolve(outputRoot, "centroids.json"),
    `${JSON.stringify(centroids, null, 2)}\n`,
  );
} finally {
  await browser.close();
}

const reviewCards = [];
for (const batch of releasePlan.batches) {
  for (const name of batch.names) {
    const entry = catalogByName.get(name);
    const source = await readSvg(entry, "outline", "standard");
    reviewCards.push(
      `<article><h2>${name}</h2><p>${entry.category} · ${batch.id} · outline · standard · rtl=${entry.rtl}</p><div>${sizes.map((size) => sizedSvg(source, size, false)).join("")}</div></article>`,
    );
  }
}
await writeFile(
  resolve(outputRoot, "review.html"),
  `<!doctype html><html><head><meta charset="utf-8"><title>Miaixz icon review</title><style>body{font:14px sans-serif;display:grid;grid-template-columns:repeat(4,1fr);gap:16px;padding:24px}article{border:1px solid #ddd;padding:12px}h2{font-size:14px;margin:0}p{color:#666}article div{display:flex;align-items:center;gap:12px;height:48px}</style></head><body>${reviewCards.join("")}</body></html>`,
);
await writeFile(
  resolve(outputRoot, "render-report.json"),
  `${JSON.stringify({ schemaVersion: 1, rendered, centroids: Object.keys(centroids).length }, null, 2)}\n`,
);
console.log(
  `Rendered ${rendered.length} contact sheets and ${stableEntries.length} stable icons.`,
);

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
 * Renders and measures all 30,720 FILL/opsz states from the release WOFF2 files
 * in Chromium, Firefox, and WebKit without an SVG or static-font substitute.
 */

import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { chromium, firefox, webkit } from "@playwright/test";
import { PNG } from "pngjs";

const arguments_ = process.argv.slice(2);
if (
  arguments_.length !== 4 ||
  arguments_[0] !== "--font-dir" ||
  arguments_[2] !== "--browser" ||
  arguments_[3] !== "all"
) {
  throw new Error("render-catalog.mjs requires exactly --font-dir <directory> --browser all.");
}

const moduleRoot = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(moduleRoot, "../../../../../../");
const packageRoot = resolve(repositoryRoot, "packages/icons");
const fontRoot = resolve(repositoryRoot, arguments_[1]);
const outputRoot = resolve(packageRoot, "tests/.artifacts/icon-visual/current");
const codepoints = JSON.parse(
  await readFile(resolve(packageRoot, "src/assets/fonts/codepoints.json"), "utf8"),
).icons;
const catalog = JSON.parse(
  await readFile(resolve(packageRoot, "src/assets/catalog.json"), "utf8"),
).icons;
const manifest = JSON.parse(await readFile(resolve(packageRoot, "package.json"), "utf8"));
if (manifest.name !== "@miaixz/icons" || codepoints.length !== 1024) {
  throw new Error("Visual rendering requires the complete @miaixz/icons release catalog.");
}

const fontFiles = Object.freeze({
  core: "miaixz-icons.woff2",
  extended: "miaixz-icons-extended.woff2",
});
const fontBytes = Object.freeze({
  core: await readFile(resolve(fontRoot, fontFiles.core)),
  extended: await readFile(resolve(fontRoot, fontFiles.extended)),
});
const fontHashes = Object.freeze(
  Object.fromEntries(
    Object.entries(fontBytes).map(([subset, bytes]) => [
      subset,
      createHash("sha256").update(bytes).digest("hex"),
    ]),
  ),
);
const dataUrls = Object.freeze(
  Object.fromEntries(
    Object.entries(fontBytes).map(([subset, bytes]) => [
      subset,
      `data:font/woff2;base64,${bytes.toString("base64")}`,
    ]),
  ),
);
const fillValues = Object.freeze([0, 0.25, 0.5, 0.75, 1]);
const opticalSizes = Object.freeze([12, 16, 20, 24, 32, 40]);
const cellSize = 32;
const columns = 32;
const sheetSize = cellSize * columns;
const browserTypes = Object.freeze({ chromium, firefox, webkit });

/**
 * Returns a deterministic state identifier.
 *
 * @param {number} fill FILL coordinate.
 * @param {number} opticalSize Optical-size coordinate.
 * @returns {string} Filesystem-safe identifier.
 */
function stateId(fill, opticalSize) {
  return `fill-${String(Math.round(fill * 100)).padStart(3, "0")}-opsz-${String(opticalSize).padStart(2, "0")}`;
}

/**
 * Builds the fixed 32-by-32 catalog surface.
 *
 * @returns {string} Standalone font test document.
 */
function catalogSurface() {
  const glyphs = codepoints
    .map(
      ({ codepoint, name }) =>
        `<span class="glyph" data-name="${name}">${String.fromCodePoint(codepoint)}</span>`,
    )
    .join("");
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @font-face{font-family:"Miaixz Icons";src:url("${dataUrls.core}") format("woff2");font-display:block;unicode-range:U+F0000-F003F}
    @font-face{font-family:"Miaixz Icons";src:url("${dataUrls.extended}") format("woff2");font-display:block;unicode-range:U+F0040-F03FF}
    :root{--fill:0;--opsz:24}
    *{box-sizing:border-box}
    html,body{margin:0;width:${sheetSize}px;height:${sheetSize}px;overflow:hidden;background:#fff}
    body{display:grid;grid-template-columns:repeat(${columns},${cellSize}px);grid-auto-rows:${cellSize}px}
    .glyph{display:grid;width:${cellSize}px;height:${cellSize}px;place-items:center;color:#000;font:24px/1 "Miaixz Icons";font-variation-settings:"FILL" var(--fill),"opsz" var(--opsz);text-rendering:geometricPrecision}
  </style></head><body>${glyphs}</body></html>`;
}

/**
 * Measures every glyph cell in one transparent contact sheet.
 *
 * @param {Buffer} bytes PNG screenshot bytes.
 * @returns {readonly object[]} Per-glyph alpha geometry.
 */
function measureSheet(bytes) {
  const png = PNG.sync.read(bytes);
  if (png.width !== sheetSize || png.height !== sheetSize) {
    throw new Error(`Unexpected visual sheet dimensions ${png.width}x${png.height}.`);
  }
  return Object.freeze(
    codepoints.map(({ name }, index) => {
      const originX = (index % columns) * cellSize;
      const originY = Math.floor(index / columns) * cellSize;
      let alpha = 0;
      let pixels = 0;
      let weightedX = 0;
      let weightedY = 0;
      let minX = cellSize;
      let minY = cellSize;
      let maxX = -1;
      let maxY = -1;
      const mask = Buffer.alloc(cellSize * cellSize);
      for (let y = 0; y < cellSize; y += 1) {
        for (let x = 0; x < cellSize; x += 1) {
          const offset = ((originY + y) * png.width + originX + x) * 4;
          const value = Math.round(
            255 - (png.data[offset] + png.data[offset + 1] + png.data[offset + 2]) / 3,
          );
          if (value === 0) continue;
          mask[y * cellSize + x] = value;
          alpha += value;
          pixels += 1;
          weightedX += value * (x + 0.5);
          weightedY += value * (y + 0.5);
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
      if (pixels === 0) throw new Error(`${name} rendered empty.`);
      return Object.freeze({
        name,
        pixels,
        alpha,
        bounds: Object.freeze([minX, minY, maxX, maxY]),
        centroid: Object.freeze([
          Number((weightedX / alpha).toFixed(3)),
          Number((weightedY / alpha).toFixed(3)),
        ]),
        digest: createHash("sha256").update(mask).digest("hex"),
      });
    }),
  );
}

/**
 * Captures deterministic FILL animation values from the browser engine.
 *
 * @param {import("@playwright/test").Page} page Active catalog page.
 * @returns {Promise<readonly number[]>} Five sampled FILL values.
 */
async function measureAnimation(page) {
  return page.evaluate(async () => {
    const glyph = document.querySelector(".glyph");
    if (!(glyph instanceof HTMLElement)) throw new Error("Animation glyph is missing.");
    glyph.style.transition = "font-variation-settings 180ms linear";
    document.documentElement.style.setProperty("--fill", "0");
    await new Promise((resolvePromise) => requestAnimationFrame(resolvePromise));
    document.documentElement.style.setProperty("--fill", "1");
    await new Promise((resolvePromise) => requestAnimationFrame(resolvePromise));
    const animation = glyph.getAnimations()[0];
    if (animation === undefined) throw new Error("FILL animation is missing.");
    const samples = [];
    for (const time of [0, 45, 90, 135, 180]) {
      animation.currentTime = time;
      const value = getComputedStyle(glyph).fontVariationSettings;
      const match = /"FILL"\s+([\d.]+)/u.exec(value);
      if (match?.[1] === undefined) throw new Error(`Missing FILL in ${value}.`);
      samples.push(Number(match[1]));
    }
    glyph.style.transition = "none";
    return samples;
  });
}

await rm(outputRoot, { recursive: true, force: true });
await mkdir(outputRoot, { recursive: true });
const reports = {};

for (const [browserName, browserType] of Object.entries(browserTypes)) {
  const browser = await browserType.launch();
  const browserRoot = resolve(outputRoot, browserName);
  await mkdir(browserRoot, { recursive: true });
  const context = await browser.newContext({
    colorScheme: "light",
    deviceScaleFactor: 1,
    locale: "en-US",
    reducedMotion: "no-preference",
    timezoneId: "UTC",
    viewport: { width: sheetSize, height: sheetSize },
  });
  const page = await context.newPage();
  const states = {};
  try {
    await page.setContent(catalogSurface(), { waitUntil: "load" });
    await page.evaluate(async () => {
      await document.fonts.load(`24px "Miaixz Icons"`, String.fromCodePoint(0xf0000));
      await document.fonts.load(`24px "Miaixz Icons"`, String.fromCodePoint(0xf0040));
      await document.fonts.ready;
    });
    const animation = await measureAnimation(page);
    for (const fill of fillValues) {
      for (const opticalSize of opticalSizes) {
        await page.evaluate(
          ({ nextFill, nextOpticalSize }) => {
            document.documentElement.style.setProperty("--fill", String(nextFill));
            document.documentElement.style.setProperty("--opsz", String(nextOpticalSize));
          },
          { nextFill: fill, nextOpticalSize: opticalSize },
        );
        const id = stateId(fill, opticalSize);
        const screenshot = await page.screenshot({
          path: resolve(browserRoot, `${id}.png`),
        });
        states[id] = measureSheet(screenshot);
      }
    }
    const fillStart = states[stateId(0, 24)];
    const fillEnd = states[stateId(1, 24)];
    const opticalStart = states[stateId(0, 12)];
    const opticalEnd = states[stateId(0, 40)];
    const fillAxisChanges = fillStart.filter(
      (entry, index) => entry.digest !== fillEnd[index].digest,
    ).length;
    const opticalAxisChanges = opticalStart.filter(
      (entry, index) => entry.digest !== opticalEnd[index].digest,
    ).length;
    reports[browserName] = Object.freeze({
      basicSamples: codepoints.length * fillValues.length * opticalSizes.length,
      sheets: fillValues.length * opticalSizes.length,
      emptySamples: 0,
      fillAxisChanges,
      opticalAxisChanges,
      animation,
      states,
    });
  } finally {
    await context.close();
    await browser.close();
  }
}

const report = Object.freeze({
  schemaVersion: 2,
  release: "0.6.5",
  rulesVersion: "miaixz-icon-visual-v2",
  fontFiles,
  fontHashes,
  catalogDigest: createHash("sha256").update(JSON.stringify(catalog)).digest("hex"),
  fillValues,
  opticalSizes,
  browsers: reports,
});
await writeFile(resolve(outputRoot, "render-report.json"), `${JSON.stringify(report)}\n`);
await writeFile(
  resolve(outputRoot, "summary.json"),
  `${JSON.stringify(
    {
      schemaVersion: report.schemaVersion,
      release: report.release,
      rulesVersion: report.rulesVersion,
      fontHashes: report.fontHashes,
      catalogDigest: report.catalogDigest,
      browsers: Object.fromEntries(
        Object.entries(reports).map(([name, value]) => [
          name,
          {
            basicSamples: value.basicSamples,
            sheets: value.sheets,
            emptySamples: value.emptySamples,
            fillAxisChanges: value.fillAxisChanges,
            opticalAxisChanges: value.opticalAxisChanges,
            animation: value.animation,
          },
        ]),
      ),
    },
    null,
    2,
  )}\n`,
);
console.log("Rendered and measured 30,720 samples in each of Chromium, Firefox, and WebKit.");

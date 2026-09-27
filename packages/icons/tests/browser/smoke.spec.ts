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
 * Verifies real font loading, one-file coverage, animation, motion, and RTL in
 * every supported browser engine.
 */

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { expect, test, type Page } from "@playwright/test";

import { startFontTestServer, type FontTestServer } from "./support/font-server.js";

const fontPath = "/assets/miaixz-icons.woff2";
const fontDirectory = resolve(process.cwd(), "dist/assets/fonts");
const fonts = Object.freeze({
  [fontPath]: new Uint8Array(await readFile(resolve(fontDirectory, "miaixz-icons.woff2"))),
});

/**
 * Creates a real-font test surface that uses the production Unicode range.
 *
 * @param page - Browser page.
 * @param server - Isolated font server.
 * @param glyph - PUA glyph to render.
 * @param extraCss - Additional deterministic style rules.
 */
async function mountFontSurface(
  page: Page,
  server: FontTestServer,
  glyph: string,
  extraCss = "",
): Promise<void> {
  await page.setContent(`<!doctype html>
    <html lang="en">
      <head>
        <style>
          @font-face {
            font-family: "Miaixz Icons";
            src: url("${server.origin}${fontPath}") format("woff2");
            font-display: block;
            unicode-range: U+F0000-F03FF;
          }
          .icon {
            --fill: 0;
            --opsz: 24;
            display: inline-block;
            width: 64px;
            height: 64px;
            color: #000;
            font: 64px/1 "Miaixz Icons";
            font-variation-settings: "FILL" var(--fill), "opsz" var(--opsz);
            transition: font-variation-settings 180ms cubic-bezier(0.2, 0, 0, 1);
          }
          ${extraCss}
        </style>
      </head>
      <body><span class="icon" data-testid="icon" aria-hidden="true">${glyph}</span></body>
    </html>`);
}

test("loads the single font for a low-range glyph", async ({ page }) => {
  const server = await startFontTestServer({ fonts });
  try {
    await mountFontSurface(page, server, String.fromCodePoint(0xf0000));
    await expect.poll(() => server.count(fontPath)).toBe(1);
    expect(await page.evaluate(() => document.fonts.check('64px "Miaixz Icons"'))).toBe(true);
    await expect(page.getByTestId("icon")).toHaveAttribute("aria-hidden", "true");
  } finally {
    await server.close();
  }
});

test("loads the same single font for a high-range glyph", async ({ page }) => {
  const server = await startFontTestServer({ fonts });
  try {
    await mountFontSurface(page, server, String.fromCodePoint(0xf0040));
    await expect.poll(() => server.count(fontPath)).toBe(1);
    expect(await page.evaluate(() => document.fonts.check('64px "Miaixz Icons"'))).toBe(true);
  } finally {
    await server.close();
  }
});

test("serves low- and high-range glyphs from one request", async ({ page }) => {
  const server = await startFontTestServer({ fonts });
  try {
    await mountFontSurface(
      page,
      server,
      `${String.fromCodePoint(0xf0000)}${String.fromCodePoint(0xf0040)}`,
    );
    await expect.poll(() => server.count(fontPath)).toBe(1);
    expect(server.requests).toEqual([{ method: "GET", path: fontPath, status: 200 }]);
  } finally {
    await server.close();
  }
});

test("interpolates FILL over 180ms and keeps RTL on the glyph layer", async ({ page }) => {
  const server = await startFontTestServer({ fonts });
  try {
    await mountFontSurface(
      page,
      server,
      String.fromCodePoint(0xf0003),
      '.icon[data-mirror="true"] { transform: scaleX(-1); }',
    );
    const samples = await page.getByTestId("icon").evaluate(async (element) => {
      await document.fonts.ready;
      const target = element as HTMLElement;
      target.dataset.mirror = "true";
      target.style.setProperty("--fill", "1");
      await new Promise<void>((resolvePromise) => requestAnimationFrame(() => resolvePromise()));
      const animation = target.getAnimations()[0];
      if (animation === undefined) throw new Error("FILL transition did not create an animation.");
      const values: string[] = [];
      for (const time of [0, 45, 90, 135, 180]) {
        animation.currentTime = time;
        values.push(getComputedStyle(target).fontVariationSettings);
      }
      return {
        duration: getComputedStyle(target).transitionDuration,
        transform: getComputedStyle(target).transform,
        values,
      };
    });
    expect(samples.duration).toBe("0.18s");
    expect(samples.transform).not.toBe("none");
    const fillValues = samples.values.map((value) => {
      const match = /"FILL"\s+([\d.]+)/u.exec(value);
      if (match?.[1] === undefined) throw new Error(`Missing FILL value in ${value}.`);
      return Number(match[1]);
    });
    expect(fillValues[0]).toBeCloseTo(0, 2);
    expect(fillValues.at(-1)).toBeCloseTo(1, 2);
    expect(fillValues[2]).toBeGreaterThan(0);
    expect(fillValues[2]).toBeLessThan(1);
  } finally {
    await server.close();
  }
});

test.describe("reduced motion", () => {
  test("disables FILL animation", async ({ page }) => {
    const server = await startFontTestServer({ fonts });
    try {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await mountFontSurface(
        page,
        server,
        String.fromCodePoint(0xf0000),
        "@media (prefers-reduced-motion: reduce) { .icon { transition: none !important; } }",
      );
      await expect(page.getByTestId("icon")).toHaveCSS("transition-duration", "0s");
    } finally {
      await server.close();
    }
  });
});

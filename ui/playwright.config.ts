import { defineConfig } from "@playwright/test";

/**
 * Defines the real-browser theme, CSP, responsive, and visual test runtime.
 *
 * @public
 */
export default defineConfig({
  testDir: "./tests",
  testMatch: "theme.spec.ts",
  outputDir: "./tests/.artifacts/playwright-results",
  fullyParallel: false,
  retries: 0,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:4173",
    browserName: "chromium",
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  },
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.001,
    },
  },
  webServer: {
    command: "vite --config tests/vite.config.ts",
    url: "http://127.0.0.1:4173/tests/",
    reuseExistingServer: false,
  },
});

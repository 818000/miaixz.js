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

import { defineConfig } from "@playwright/test";
import path from "node:path";

const port = Number(process.env.MIAIXZ_UI_PORT ?? "4173");
if (!Number.isInteger(port) || port < 1024 || port > 65535)
  throw new Error("Invalid MIAIXZ_UI_PORT");
const configuredBaseURL = process.env.MIAIXZ_UI_BASE_URL;
const baseURL = configuredBaseURL ?? `http://127.0.0.1:${port}`;
const parsedBaseURL = new URL(baseURL);
if (
  parsedBaseURL.protocol !== "http:" ||
  !new Set(["127.0.0.1", "localhost", "[::1]"]).has(parsedBaseURL.hostname) ||
  Number(parsedBaseURL.port || 80) !== port
) {
  throw new Error("MIAIXZ_UI_BASE_URL must be local HTTP and match MIAIXZ_UI_PORT");
}
const packageStage = process.env.MIAIXZ_UI_PACKAGE_STAGE ?? "source";
if (!new Set(["source", "packed"]).has(packageStage)) {
  throw new Error("Invalid MIAIXZ_UI_PACKAGE_STAGE");
}
const runId = process.env.MIAIXZ_UI_RUN_ID ?? "local";
if (!/^[a-zA-Z0-9_-]+$/.test(runId)) throw new Error("Invalid MIAIXZ_UI_RUN_ID");
const artifactsRoot = path.resolve("tests/.artifacts");
const outputDir = path.resolve(
  process.env.MIAIXZ_UI_OUTPUT_DIR ?? "tests/.artifacts/playwright-results",
);
if (outputDir !== artifactsRoot && !outputDir.startsWith(`${artifactsRoot}${path.sep}`)) {
  throw new Error("MIAIXZ_UI_OUTPUT_DIR must remain inside tests/.artifacts");
}

/**
 * Defines the real-browser theme, CSP, responsive, and visual test runtime.
 *
 * @public
 */
export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  snapshotPathTemplate: path.resolve("tests/visual-baselines/action-system/v1/{arg}{ext}"),
  outputDir,
  metadata: { packageStage, runId },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  projects: [
    {
      name: "chromium-visual",
      testMatch: "**/action-visual.spec.ts",
      use: { browserName: "chromium" },
    },
    {
      name: "chromium-contracts",
      testIgnore: "**/action-visual.spec.ts",
      use: { browserName: "chromium" },
    },
    {
      name: "firefox-contracts",
      testIgnore: "**/action-visual.spec.ts",
      use: { browserName: "firefox" },
    },
    {
      name: "webkit-contracts",
      testIgnore: "**/action-visual.spec.ts",
      use: { browserName: "webkit" },
    },
  ],
  use: {
    baseURL,
    deviceScaleFactor: 1,
    contextOptions: {
      reducedMotion: "reduce",
    },
  },
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.001,
    },
  },
  webServer: {
    command: "npm exec -- vite --config tests/vite.config.ts",
    url: `${baseURL}/tests/`,
    env: {
      MIAIXZ_UI_BASE_URL: baseURL,
      MIAIXZ_UI_PACKAGE_STAGE: packageStage,
      MIAIXZ_UI_PORT: String(port),
      MIAIXZ_UI_RUN_ID: runId,
      ...(process.env.MIAIXZ_UI_PACKAGE_ROOT
        ? { MIAIXZ_UI_PACKAGE_ROOT: process.env.MIAIXZ_UI_PACKAGE_ROOT }
        : {}),
      ...(process.env.MIAIXZ_UI_SDK_PACKAGE_ROOT
        ? { MIAIXZ_UI_SDK_PACKAGE_ROOT: process.env.MIAIXZ_UI_SDK_PACKAGE_ROOT }
        : {}),
    },
    reuseExistingServer: false,
  },
});

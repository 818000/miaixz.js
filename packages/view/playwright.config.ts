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
 * Runs the spreadsheet contract and visual baseline in a real browser.
 */

import { defineConfig } from "@playwright/test";

const browserChannel =
  process.env.MIAIXZ_PLAYWRIGHT_CHANNEL ?? (process.platform === "darwin" ? "chrome" : undefined);

export default defineConfig({
  testDir: "./tests/browser",
  outputDir: "./test-results/browser",
  snapshotPathTemplate: "{testDir}/{testFilePath}-snapshots/{arg}-{platform}{ext}",
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium",
        ...(browserChannel === undefined ? {} : { channel: browserChannel }),
      },
    },
    { name: "firefox", use: { browserName: "firefox" } },
    { name: "webkit", use: { browserName: "webkit" } },
  ],
  use: {
    baseURL: "http://127.0.0.1:4179",
    colorScheme: "light",
    deviceScaleFactor: 1,
    locale: "ja-JP",
    timezoneId: "Asia/Tokyo",
    viewport: { width: 1440, height: 900 },
  },
  webServer: {
    command: "vite . --host 127.0.0.1 --port 4179 --strictPort",
    port: 4179,
    reuseExistingServer: false,
    timeout: 30_000,
  },
});

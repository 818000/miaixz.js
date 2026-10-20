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
 * Verifies configured native document reloads and persistent content in real browsers.
 */

import { expect, test } from "@playwright/test";

for (const kind of ["link", "tabs"] as const)
  for (const mode of ["light", "dark"] as const)
    for (const refreshMode of ["content", "page"] as const)
      for (const override of [false, true])
        for (const target of kind === "link" ? ["route", "fragment"] : ["route"]) {
          test(`${kind} ${mode} ${refreshMode} override=${override} ${target}: configured refresh preserves the correct boundary`, async ({
            page,
          }) => {
            const effectiveMode = override
              ? refreshMode === "page"
                ? "content"
                : "page"
              : refreshMode;
            const query = new URLSearchParams({
              navigationRefresh: refreshMode,
              colorMode: mode,
              navigationTarget: target,
            });
            if (kind === "tabs") query.set("localTabs", "1");
            if (override) query.set("navigationOverride", effectiveMode);
            await page.goto(`/tests/?${query}`);
            await expect(page.getByText("Destination first", { exact: true })).toBeVisible();
            const heading = await page
              .getByRole("heading", { name: "Module", exact: true })
              .elementHandle();
            let documents = 0;
            page.on("request", (request) => {
              if (request.isNavigationRequest() && request.frame() === page.mainFrame())
                documents++;
            });
            await page
              .getByRole(kind === "link" ? "link" : "tab", { name: "Second", exact: true })
              .click();
            await expect(page.getByText("Destination second", { exact: true })).toBeVisible();
            if (effectiveMode === "page") await expect.poll(() => documents).toBe(1);
            else expect(documents).toBe(0);
            if (effectiveMode === "content")
              expect(await heading!.evaluate((element) => element.isConnected)).toBe(true);
            await expect(page.getByRole("heading", { name: "Module", exact: true })).toHaveCount(1);
          });
        }

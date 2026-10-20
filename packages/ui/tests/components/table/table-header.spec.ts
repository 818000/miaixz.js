/*
 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
 ~ Copyright (c) 2015-2026 miaixz.org and other contributors.                ~
 ~ Licensed under the Apache License, Version 2.0 (the "License");           ~
 ~ you may not use this file except in compliance with the License.          ~
 ~ You may obtain a copy of the License at                                   ~
 ~ http://www.apache.org/licenses/LICENSE-2.0                                ~
 ~ Unless required by applicable law or agreed to in writing, software       ~
 ~ distributed under the License is distributed on an "AS IS" BASIS.         ~
 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
*/

/**
 * Verifies themed opaque Table headers in browsers.
 */

import { expect, test } from "@playwright/test";

for (const theme of ["miaixz", "olive", "contrast"]) {
  for (const colorMode of ["light", "dark"]) {
    test(`Table headers have an opaque themed background in ${theme} ${colorMode}`, async ({
      page,
    }) => {
      await page.goto(`/tests/?stickyTable=1&theme=${theme}&colorMode=${colorMode}`);
      const table = page.locator("#tables table");
      const head = table.locator("thead");
      await expect(head).toHaveCSS("position", "sticky");
      const background = await head.evaluate((node) => getComputedStyle(node).backgroundColor);
      expect(background).not.toBe("rgba(0, 0, 0, 0)");
      for (const cell of await head.locator("th").all())
        await expect(cell).toHaveCSS("background-color", background);
    });
  }
}

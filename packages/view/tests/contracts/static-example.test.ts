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
 * Freezes the offline viewer and format-runtime example.
 */

import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const exampleRoot = resolve(process.cwd(), "../../examples/view");

describe("View static example", () => {
  it("ships a directly downloadable local Office fixture", async () => {
    const fixture = await stat(resolve(exampleRoot, "assets/fixtures/system-flow.xlsx"));
    expect(fixture.size).toBeGreaterThan(100_000);
  });

  it("covers real viewers, detection evidence, browser support, and budgets", async () => {
    const [html, javascript] = await Promise.all([
      readFile(resolve(exampleRoot, "index.html"), "utf8"),
      readFile(resolve(exampleRoot, "assets/view.js"), "utf8"),
    ]);
    expect(html).toContain('<script defer src="./assets/view.js"></script>');
    expect(html).not.toContain('type="module"');
    for (const token of [
      "FileView",
      "ImageView",
      "OfficeView",
      "detectFormat",
      "getFormatDescriptors",
      "getFormatParityRecords",
      "detectBrowserSupport",
      "defaultResourceBudget",
    ]) {
      expect(javascript).toContain(token);
    }
  });
});

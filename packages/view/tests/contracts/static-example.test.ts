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
 * Freezes the local packed-package browser acceptance harness.
 */

import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const exampleRoot = resolve(process.cwd(), "tests/browser/support");
const fixtureRoot = resolve(process.cwd(), "tests/fixtures/xlsx");

describe("View browser acceptance harness", () => {
  it("ships a directly downloadable local Office fixture", async () => {
    const fixture = await stat(resolve(fixtureRoot, "system-flow.xlsx"));
    expect(fixture.size).toBeGreaterThan(100_000);
  });

  it("loads the packed viewer, styles, worker result, and frozen workbook", async () => {
    const [html, source] = await Promise.all([
      readFile(resolve(exampleRoot, "index.html"), "utf8"),
      readFile(resolve(exampleRoot, "main.tsx"), "utf8"),
    ]);
    expect(html).toContain('<script type="module" src="./main.tsx"></script>');
    for (const token of [
      "OfficeView",
      "../../../dist/index.js",
      "../../../dist/styles.css",
      "../../fixtures/xlsx/system-flow.xlsx",
      "__XLSX_PREVIEW_RESULT__",
    ]) {
      expect(source).toContain(token);
    }
  });
});

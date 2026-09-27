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
 * Freezes the offline SDK workbench as a real package integration surface.
 */

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const exampleRoot = resolve(process.cwd(), "../../examples/sdk");

describe("SDK static example", () => {
  it("loads classic local files through file protocol compatible markup", async () => {
    const html = await readFile(resolve(exampleRoot, "index.html"), "utf8");
    expect(html).toContain('<script defer src="./assets/sdk.js"></script>');
    expect(html).not.toContain('type="module"');
    expect(html).not.toMatch(/(?:src|href)=["']https?:\/\//u);
  });

  it("exercises the real context, grants, API, appearance, i18n, and events APIs", async () => {
    const [html, javascript] = await Promise.all([
      readFile(resolve(exampleRoot, "index.html"), "utf8"),
      readFile(resolve(exampleRoot, "assets/sdk.js"), "utf8"),
    ]);
    for (const token of [
      "createMiaixzSdk",
      "sdk.context.patch",
      "sdk.grants.can",
      "sdk.api.get",
      "sdk.appearance.setColorMode",
      "sdk.i18n.changeLocale",
      "normalizeMiaixzError",
      "typed event stream",
    ]) {
      expect(`${html}\n${javascript}`.toLowerCase()).toContain(token.toLowerCase());
    }
  });
});

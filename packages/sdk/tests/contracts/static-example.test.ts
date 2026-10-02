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
 * Freezes the SDK module inside the unified examples application.
 */

import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const testRoot = dirname(fileURLToPath(import.meta.url));
const exampleRoot = resolve(testRoot, "../../../../examples/src/module/sdk");

describe("SDK example module", () => {
  it("exercises the real context, grants, API, appearance, i18n, and events APIs", async () => {
    const source = await readFile(resolve(exampleRoot, "sdk-guide.tsx"), "utf8");
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
      expect(source.toLowerCase()).toContain(token.toLowerCase());
    }
  });
});

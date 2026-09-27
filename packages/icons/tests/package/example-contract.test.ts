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
 * Freezes the directly openable static icons example.
 */

import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const repositoryRoot = resolve(process.cwd(), "../..");
const exampleRoot = resolve(repositoryRoot, "examples/icons");

describe("icons static example contract", () => {
  it("uses only classic local assets", async () => {
    const html = await readFile(resolve(exampleRoot, "index.html"), "utf8");
    expect(html).toContain('<script defer src="./assets/icons.js"></script>');
    expect(html).toContain('<link rel="stylesheet" href="./assets/icons.css" />');
    expect(html).not.toContain('type="module"');
    expect(html).not.toMatch(/(?:src|href)=["']https?:\/\//u);
  });

  it("ships one complete local variable font", async () => {
    const font = await stat(resolve(exampleRoot, "assets/miaixz-icons.woff2"));
    const css = await readFile(resolve(exampleRoot, "assets/icons.css"), "utf8");
    expect(font.size).toBeGreaterThan(20_000);
    expect(font.size).toBeLessThan(100_000);
    expect(css).toContain('url("./miaixz-icons.woff2")');
    expect(css).toContain('"FILL" var(--demo-fill)');
    expect(css).toContain('"opsz" var(--demo-opsz)');
  });

  it("covers catalog, axes, inspection, accessibility, and failure status", async () => {
    const html = await readFile(resolve(exampleRoot, "index.html"), "utf8");
    const javascript = await readFile(resolve(exampleRoot, "assets/icons.js"), "utf8");
    for (const token of [
      "完整图标目录",
      "实时轴控制",
      "调用检查器",
      "尺寸、方向与可访问性",
      "[miaixz] Unable to load the icon font.",
      "ICON_CATALOG",
      "resolveMiaixzIcon",
      "visibleLimit += 160",
    ]) {
      expect(`${html}\n${javascript}`).toContain(token);
    }
    expect(`${html}\n${javascript}`).not.toMatch(
      /IconProvider|icons-(?:lucide|phosphor|fontawesome|iconify)/u,
    );
  });
});

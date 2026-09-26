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
 * Freezes the executable examples/icons acceptance surface.
 */

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const repositoryRoot = resolve(process.cwd(), "../..");
const exampleRoot = resolve(repositoryRoot, "examples/icons");

describe("icons example contract", () => {
  it("remains private and version locked", async () => {
    const manifest = JSON.parse(await readFile(resolve(exampleRoot, "package.json"), "utf8")) as {
      readonly name: string;
      readonly private: boolean;
      readonly version: string;
    };
    expect(manifest).toMatchObject({
      name: "@miaixz/example-icons",
      private: true,
      version: "0.6.5",
    });
  });

  it("covers the complete variable-font and failure controls", async () => {
    const source = await readFile(resolve(exampleRoot, "src/main.tsx"), "utf8");
    for (const token of [
      'import coreFontUrl from "@miaixz/icons/font.woff2?url"',
      'import("@miaixz/icons/catalog")',
      'min="0"',
      'max="1"',
      'min="12"',
      'max="40"',
      "simulateFailure",
      "reducedMotion",
      "setRtl",
      "namedSizes",
    ]) {
      expect(source).toContain(token);
    }
  });

  it("contains no third-party Provider entry", async () => {
    const source = await readFile(resolve(exampleRoot, "src/main.tsx"), "utf8");
    expect(source).not.toMatch(
      /IconRegistry|IconProvider|@miaixz\/icons-(?:lucide|phosphor|fontawesome|iconify)/u,
    );
    expect(source).toContain("help 图标加载失败");
  });

  it("documents reproducible development and production commands", async () => {
    const readme = await readFile(resolve(exampleRoot, "README.md"), "utf8");
    expect(readme).toContain("npm --prefix examples/icons run dev");
    expect(readme).toContain("npm --prefix examples/icons run build");
    expect(readme).toContain("64 个 Core");
    expect(readme).toContain("Extended");
  });
});

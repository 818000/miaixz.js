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
 * Verifies the font-only icon package boundary.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";
import { ICON_NAME_LIST, resolveMiaixzIcon } from "../../src/index.js";

const repositoryRoot = resolve(process.cwd(), "../..");

describe("icon package skeleton", () => {
  it("exports exactly 1024 self-owned font names", () => {
    expect(ICON_NAME_LIST).toHaveLength(1024);
    expect(ICON_NAME_LIST.every((name) => resolveMiaixzIcon(name).name === name)).toBe(true);
  });

  it("contains no provider workspace, protocol export, or implementation directory", () => {
    const rootManifest = JSON.parse(
      readFileSync(resolve(repositoryRoot, "package.json"), "utf8"),
    ) as { readonly workspaces: readonly string[] };
    const packageManifest = JSON.parse(
      readFileSync(resolve(process.cwd(), "package.json"), "utf8"),
    ) as { readonly exports: Readonly<Record<string, unknown>> };

    expect(rootManifest.workspaces.some((workspace) => workspace.startsWith("providers/"))).toBe(
      false,
    );
    expect(packageManifest.exports).not.toHaveProperty("./provider");
    expect(existsSync(resolve(repositoryRoot, "providers"))).toBe(false);
    for (const path of ["src/provider.ts", "src/schema", "src/runtime/registry.ts"]) {
      expect(existsSync(resolve(process.cwd(), path))).toBe(false);
    }
  });
});

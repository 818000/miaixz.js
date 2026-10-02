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
 * Audits the G0 Node, font-tool, browser, package, and CI activation contract.
 */

import { readdir, readFile } from "node:fs/promises";
import { relative, resolve } from "node:path";

import { describe, expect, it } from "vitest";

const repositoryRoot = resolve(process.cwd(), "../..");
const release = (await readFile(resolve(repositoryRoot, "VERSION"), "utf8")).trim();
const fontScriptRoot = resolve(repositoryRoot, ".github/scripts/modules/icons/fonts");
const workspaceDirectory = "packages/icons";

/**
 * Recursively locates repository-owned Python files.
 *
 * @param directory - Directory to inspect.
 * @returns Repository-relative Python paths.
 */
async function findPythonFiles(directory: string): Promise<string[]> {
  const results: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if ([".git", "coverage", "dist", "node_modules"].includes(entry.name)) continue;
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) results.push(...(await findPythonFiles(path)));
    else if (entry.name.endsWith(".py")) results.push(relative(repositoryRoot, path));
  }
  return results.sort();
}

describe("G0 toolchain activation", () => {
  it("keeps the font orchestrator Node-only and exact", async () => {
    const entries = (await readdir(fontScriptRoot))
      .filter((entry) => !entry.startsWith("."))
      .sort();
    expect(entries).toEqual([
      "build-icon-font.mjs",
      "font-toolchain.lock.txt",
      "inspect-icon-font.mjs",
      "validate-icon-font.mjs",
    ]);
    expect(await findPythonFiles(repositoryRoot)).toEqual([]);
  });

  it("pins the complete third-party font environment", async () => {
    const workflow = await readFile(
      resolve(repositoryRoot, ".github/workflows/build-project.yml"),
      "utf8",
    );
    for (const declaration of [
      'PYTHON_VERSION: "3.13.12"',
      'FONTMAKE_VERSION: "3.12.1"',
      'FONTTOOLS_VERSION: "4.66.0"',
      'UFO2FT_VERSION: "3.9.0"',
      'FONTBAKERY_VERSION: "1.1.0"',
    ]) {
      expect(workflow).toContain(declaration);
    }
    const requirements = await readFile(
      resolve(repositoryRoot, ".github/scripts/modules/icons/fonts/font-toolchain.lock.txt"),
      "utf8",
    );
    for (const requirement of [
      "brotli==1.2.0",
      "fontmake==3.12.1",
      "fonttools==4.66.0",
      "ufo2ft==3.9.0",
      "fontbakery==1.1.0",
    ]) {
      expect(requirements).toContain(requirement);
    }
    expect(requirements).toMatch(/--hash=sha256:[0-9a-f]{64}/u);
  });

  it("registers one version-locked, self-owned icon workspace", async () => {
    const rootManifest = JSON.parse(
      await readFile(resolve(repositoryRoot, "package.json"), "utf8"),
    ) as { readonly workspaces: readonly string[] };
    expect(rootManifest.workspaces).toContain(workspaceDirectory);
    expect(rootManifest.workspaces.filter((entry) => entry.includes("icons"))).toEqual([
      workspaceDirectory,
    ]);
    const manifest = JSON.parse(
      await readFile(resolve(repositoryRoot, workspaceDirectory, "package.json"), "utf8"),
    ) as { readonly name: string; readonly version: string };
    expect(manifest).toMatchObject({ name: "@miaixz/icons", version: release });
  });

  it("keeps visual validation automatic, read-only, and free of Git writes", async () => {
    const workflow = await readFile(
      resolve(repositoryRoot, ".github/workflows/icon-visual-baseline.yml"),
      "utf8",
    );
    expect(workflow).not.toMatch(/workflow_dispatch/u);
    expect(workflow).not.toMatch(/contents:\s*write/u);
    expect(workflow).not.toMatch(/git\s+(?:commit|push|tag)/u);
    expect(workflow).toContain("push:");
    expect(workflow).toContain("pull_request:");
  });

  it("keeps Playwright output out of the forbidden test-results directory", async () => {
    for (const configuration of [
      "packages/icons/playwright.config.ts",
      "packages/ui/playwright.config.ts",
    ]) {
      const source = await readFile(resolve(repositoryRoot, configuration), "utf8");
      expect(source).toContain("tests/.artifacts/playwright");
      expect(source).not.toMatch(/outputDir[^\n]*test-results/u);
    }
  });
});

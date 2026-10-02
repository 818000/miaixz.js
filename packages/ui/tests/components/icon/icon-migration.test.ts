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
 * @vitest-environment node
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { describe, expect, it } from "vitest";

const packageDirectory = resolve(import.meta.dirname, "../../..");
const repositoryRoot = resolve(packageDirectory, "../..");
const release = readFileSync(resolve(repositoryRoot, "VERSION"), "utf8").trim();
const metadataUrl = pathToFileURL(resolve(repositoryRoot, ".github/scripts/miaixz.mjs")).href;
const { getWorkspacePeerRange } = (await import(metadataUrl)) as {
  getWorkspacePeerRange: (version: string) => string;
};
const expectedPeerRange = getWorkspacePeerRange(release);
const manifest = JSON.parse(readFileSync(resolve(packageDirectory, "package.json"), "utf8")) as {
  readonly dependencies: Readonly<Record<string, string>>;
  readonly devDependencies: Readonly<Record<string, string>>;
  readonly exports: Readonly<Record<string, unknown>>;
  readonly peerDependencies: Readonly<Record<string, string>>;
};

describe("icon package migration", () => {
  it("delegates the complete icon system to @miaixz/icons", () => {
    expect(manifest.peerDependencies["@miaixz/icons"]).toBe(expectedPeerRange);
    expect(manifest.devDependencies["@miaixz/icons"]).toBe(release);
    expect(manifest.exports["./icons"]).toBeUndefined();
    expect(manifest.exports["./icons/styles.css"]).toBeUndefined();
    expect(manifest.dependencies).not.toHaveProperty("lucide-react");
    expect(manifest.dependencies).not.toHaveProperty("@fortawesome/free-regular-svg-icons");
    expect(manifest.dependencies).not.toHaveProperty("@fortawesome/free-solid-svg-icons");
  });

  it("contains no legacy UI-owned icon implementation", () => {
    expect(existsSync(resolve(packageDirectory, "src/icons"))).toBe(false);
    expect(existsSync(resolve(packageDirectory, "src/components/icon"))).toBe(false);
    expect(existsSync(resolve(packageDirectory, "src/styles/components/icon.css"))).toBe(false);
    expect(existsSync(resolve(packageDirectory, "src/styles/foundation/icons.css"))).toBe(false);
  });

  it("imports the public icon package without internal compatibility paths", () => {
    const sourceDirectory = resolve(packageDirectory, "src");
    const source = readdirSync(sourceDirectory, { recursive: true })
      .filter((entry) => /\.(?:ts|tsx)$/u.test(entry))
      .map((entry) => readFileSync(resolve(sourceDirectory, entry), "utf8"))
      .join("\n");

    expect(source).toContain('from "@miaixz/icons"');
    expect(source).not.toMatch(/from ["'][^"']*(?:components\/icon|icons\/icon-)/u);
    expect(readFileSync(resolve(sourceDirectory, "styles/core.css"), "utf8")).toContain(
      '@import url("@miaixz/icons/styles.css");',
    );
  });
});

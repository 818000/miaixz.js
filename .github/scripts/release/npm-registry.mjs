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

import { randomUUID } from "node:crypto";

/**
 * Creates an uncached npm registry URL for one exact package version.
 *
 * @param {string} registry npm registry base URL.
 * @param {string} name Exact package name.
 * @param {string} version Exact package version.
 * @returns {URL} Version metadata URL with a unique cache key.
 */
function createVersionUrl(registry, name, version) {
  const registryUrl = new URL(registry);
  if (!registryUrl.pathname.endsWith("/")) registryUrl.pathname += "/";
  const versionUrl = new URL(
    `${encodeURIComponent(name)}/${encodeURIComponent(version)}`,
    registryUrl,
  );
  versionUrl.searchParams.set("cacheBust", `${Date.now()}-${randomUUID()}`);
  return versionUrl;
}

/**
 * Checks whether one exact package version is visible from the public registry API.
 * A 404 is the only response interpreted as an absent version; transport and registry failures are
 * surfaced so a transient lookup failure can never trigger an unsafe duplicate publication.
 *
 * @param {string} registry npm registry base URL.
 * @param {string} name Exact package name.
 * @param {string} version Exact package version.
 * @returns {Promise<boolean>} Whether the exact package version is visible.
 */
export async function isPackageVersionPublished(registry, name, version) {
  const versionUrl = createVersionUrl(registry, name, version);
  const response = await fetch(versionUrl, {
    cache: "no-store",
    headers: {
      accept: "application/json",
      "cache-control": "no-cache, no-store",
      pragma: "no-cache",
    },
    signal: AbortSignal.timeout(20_000),
  });
  if (response.status === 404) return false;
  if (!response.ok) {
    throw new Error(`npm registry returned HTTP ${response.status} for ${name}@${version}.`);
  }
  const metadata = await response.json();
  if (metadata?.name !== name || metadata.version !== version) {
    throw new Error(`npm registry returned invalid metadata for ${name}@${version}.`);
  }
  return true;
}

/**
 * Reads visibility for every package without short-circuiting after the first missing package.
 *
 * @param {{ name: string }[]} packages Packages to inspect.
 * @param {string} version Exact package version.
 * @param {string} registry npm registry base URL.
 * @returns {Promise<Map<string, boolean>>} Visibility keyed by package name.
 */
export async function readPackageVisibility(packages, version, registry) {
  const visibility = await Promise.all(
    packages.map(async ({ name }) => [
      name,
      await isPackageVersionPublished(registry, name, version),
    ]),
  );
  return new Map(visibility);
}

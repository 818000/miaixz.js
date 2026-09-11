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

import type { MiaixzEnvironment } from "../types/index.js";

const miaixzEnvironments = new Set<MiaixzEnvironment>([
  "development",
  "test",
  "staging",
  "production",
]);
const localHttpHostnames = new Set(["localhost", "127.0.0.1", "[::1]"]);

/**
 * Normalizes an absolute API endpoint under the environment-specific transport policy.
 *
 * @param value - Untrusted endpoint value to validate.
 * @param environment - Runtime environment validated with the endpoint.
 * @returns The normalized endpoint without trailing separators, or `undefined` when invalid.
 */
export function normalizeMiaixzApiEndpoint(
  value: unknown,
  environment: MiaixzEnvironment,
): string | undefined {
  const trimmed = typeof value === "string" ? value.trim() : "";
  if (
    typeof value !== "string" ||
    !miaixzEnvironments.has(environment) ||
    trimmed.length === 0 ||
    /\s/.test(value) ||
    trimmed.includes("?") ||
    trimmed.includes("#")
  ) {
    return undefined;
  }

  const authority = /^[a-z][a-z\d+.-]*:\/\/([^/?#]*)/i.exec(trimmed)?.[1];
  if (authority?.includes("@") === true) return undefined;

  let endpoint: URL;
  try {
    endpoint = new URL(trimmed);
  } catch {
    return undefined;
  }

  if (
    endpoint.username !== "" ||
    endpoint.password !== "" ||
    endpoint.search !== "" ||
    endpoint.hash !== ""
  ) {
    return undefined;
  }

  if (endpoint.protocol === "https:") {
    return endpoint.href.replace(/\/+$/, "");
  }

  if (endpoint.protocol === "http:" && localHttpHostnames.has(endpoint.hostname)) {
    return endpoint.href.replace(/\/+$/, "");
  }

  return undefined;
}

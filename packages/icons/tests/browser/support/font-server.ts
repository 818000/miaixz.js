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
 * Provides an isolated font server with deterministic response and request logs.
 */

import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

const fontPaths = Object.freeze([
  "/assets/miaixz-icons-extended.woff2",
  "/assets/miaixz-icons.woff2",
]);

export interface FontRequestRecord {
  readonly method: string;
  readonly path: string;
  readonly status: number;
}

export interface FontTestServer {
  readonly origin: string;
  readonly requests: readonly FontRequestRecord[];
  close(): Promise<void>;
  count(path: string): number;
}

export interface FontTestServerOptions {
  readonly failures?: readonly string[];
  readonly fonts?: Readonly<Record<string, Uint8Array>>;
}

/**
 * Starts a loopback-only server for Core and Extended WOFF2 request assertions.
 *
 * @param options - Optional bytes and deterministic 404 paths.
 * @returns Running server contract.
 * @public
 */
export async function startFontTestServer(
  options: FontTestServerOptions = {},
): Promise<FontTestServer> {
  const failures = new Set(options.failures ?? []);
  const requests: FontRequestRecord[] = [];
  const server = createServer((request, response) => {
    const method = request.method ?? "GET";
    const path = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
    const isFont = fontPaths.includes(path);
    const status = method !== "GET" ? 405 : !isFont || failures.has(path) ? 404 : 200;
    requests.push(Object.freeze({ method, path, status }));
    response.statusCode = status;
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    if (isFont) response.setHeader("Content-Type", "font/woff2");
    response.end(
      status === 200 ? Buffer.from(options.fonts?.[path] ?? `woff2-fixture:${path}`) : undefined,
    );
  });
  await new Promise<void>((resolvePromise, rejectPromise) => {
    server.once("error", rejectPromise);
    server.listen(0, "127.0.0.1", () => {
      server.removeListener("error", rejectPromise);
      resolvePromise();
    });
  });
  const address = server.address() as AddressInfo;
  return Object.freeze({
    origin: `http://127.0.0.1:${address.port}`,
    requests,
    /**
     * Counts recorded requests for one exact pathname.
     *
     * @param path - Exact request pathname.
     * @returns Matching request count.
     */
    count(path: string) {
      return requests.filter((request) => request.path === path).length;
    },
    /**
     * Stops the loopback listener after the current test.
     *
     * @returns Promise settled after the listener closes.
     */
    async close() {
      await new Promise<void>((resolvePromise, rejectPromise) => {
        server.close((error) => {
          if (error === undefined) resolvePromise();
          else rejectPromise(error);
        });
      });
    },
  });
}

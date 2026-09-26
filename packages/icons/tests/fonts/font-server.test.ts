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
 * Verifies the font request recorder used by browser loading contracts.
 */

import { afterEach, describe, expect, it } from "vitest";

import { startFontTestServer, type FontTestServer } from "../browser/support/font-server.js";

const corePath = "/assets/miaixz-icons.woff2";
const extendedPath = "/assets/miaixz-icons-extended.woff2";
let activeServer: FontTestServer | undefined;

afterEach(async () => {
  await activeServer?.close();
  activeServer = undefined;
});

describe("font request test server", () => {
  it("records exact filenames, counts, status, CORS, and cache headers", async () => {
    activeServer = await startFontTestServer();
    const coreResponses = await Promise.all([
      fetch(`${activeServer.origin}${corePath}`),
      fetch(`${activeServer.origin}${corePath}`),
    ]);
    const extendedResponse = await fetch(`${activeServer.origin}${extendedPath}`);

    expect(coreResponses.map((response) => response.status)).toEqual([200, 200]);
    expect(extendedResponse.status).toBe(200);
    expect(extendedResponse.headers.get("content-type")).toBe("font/woff2");
    expect(extendedResponse.headers.get("access-control-allow-origin")).toBe("*");
    expect(extendedResponse.headers.get("cache-control")).toBe(
      "public, max-age=31536000, immutable",
    );
    expect(activeServer.count(corePath)).toBe(2);
    expect(activeServer.count(extendedPath)).toBe(1);
    expect(activeServer.requests.map(({ path }) => path)).toEqual([
      corePath,
      corePath,
      extendedPath,
    ]);
  });

  it("records independent 404 responses for either subset", async () => {
    activeServer = await startFontTestServer({ failures: [extendedPath] });
    const coreResponse = await fetch(`${activeServer.origin}${corePath}`);
    const extendedResponse = await fetch(`${activeServer.origin}${extendedPath}`);

    expect(coreResponse.status).toBe(200);
    expect(extendedResponse.status).toBe(404);
    expect(activeServer.requests).toEqual([
      { method: "GET", path: corePath, status: 200 },
      { method: "GET", path: extendedPath, status: 404 },
    ]);
  });
});

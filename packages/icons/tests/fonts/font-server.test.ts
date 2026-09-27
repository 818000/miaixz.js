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

const fontPath = "/assets/miaixz-icons.woff2";
let activeServer: FontTestServer | undefined;

afterEach(async () => {
  await activeServer?.close();
  activeServer = undefined;
});

describe("font request test server", () => {
  it("records exact filenames, counts, status, CORS, and cache headers", async () => {
    activeServer = await startFontTestServer();
    const responses = await Promise.all([
      fetch(`${activeServer.origin}${fontPath}`),
      fetch(`${activeServer.origin}${fontPath}`),
    ]);

    expect(responses.map((response) => response.status)).toEqual([200, 200]);
    expect(responses[0]?.headers.get("content-type")).toBe("font/woff2");
    expect(responses[0]?.headers.get("access-control-allow-origin")).toBe("*");
    expect(responses[0]?.headers.get("cache-control")).toBe("public, max-age=31536000, immutable");
    expect(activeServer.count(fontPath)).toBe(2);
    expect(activeServer.requests.map(({ path }) => path)).toEqual([fontPath, fontPath]);
  });

  it("records a deterministic 404 response for the font", async () => {
    activeServer = await startFontTestServer({ failures: [fontPath] });
    const response = await fetch(`${activeServer.origin}${fontPath}`);

    expect(response.status).toBe(404);
    expect(activeServer.requests).toEqual([{ method: "GET", path: fontPath, status: 404 }]);
  });
});

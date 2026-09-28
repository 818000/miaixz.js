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
 * Verifies that the published viewer contains every runtime-owned XLSX asset.
 */

import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";

const execute = promisify(execFile);
const packageRoot = process.cwd();
const { stdout } = await execute("npm", ["pack", "--dry-run", "--json"], {
  cwd: packageRoot,
  maxBuffer: 16 * 1024 * 1024,
});
const report = JSON.parse(stdout)[0];
const files = new Set(report.files.map((entry) => entry.path));
const requiredFiles = [
  "dist/runtime/spreadsheet-worker-client.js",
  "dist/workers/spreadsheet-worker.js",
  "dist/workers/protocol/spreadsheet-worker-types.js",
  "dist/workers/protocol/worker-protocol.js",
  "dist/styles.css",
];
for (const path of requiredFiles) {
  if (!files.has(path)) throw new Error(`Packed viewer is missing ${path}`);
}

const workerClient = await readFile(
  new URL(
    "../../../../../packages/view/dist/runtime/spreadsheet-worker-client.js",
    import.meta.url,
  ),
  "utf8",
);
if (
  !workerClient.includes(
    'new Worker(new URL("../workers/spreadsheet-worker.js", import.meta.url)',
  )
) {
  throw new Error(
    "Packed XLSX driver does not use the fixed relative module Worker URL",
  );
}

const fixture = await readFile(
  new URL(
    "../../../../../packages/view/tests/fixtures/xlsx/system-flow.xlsx",
    import.meta.url,
  ),
);
const fixtureInventory = JSON.parse(
  await readFile(
    new URL(
      "../../../../../packages/view/tests/fixtures/xlsx/system-flow.inventory.json",
      import.meta.url,
    ),
    "utf8",
  ),
);
const digest = createHash("sha256").update(fixture).digest("hex");
if (digest !== fixtureInventory.sha256) {
  throw new Error("XLSX acceptance fixture hash changed");
}

const publicApi = await import(
  new URL("../../../../../packages/view/dist/index.js", import.meta.url).href
);
if (publicApi.WORKER_PROTOCOL_VERSION !== 2) {
  throw new Error("Packed viewer does not expose worker protocol v2");
}

process.stdout.write(
  `Package smoke passed: ${requiredFiles.length} XLSX runtime assets and fixture hash verified.\n`,
);

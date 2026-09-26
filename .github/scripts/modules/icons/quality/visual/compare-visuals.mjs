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
 * Compares deterministic icon contact sheets with committed PNG baselines.
 */

import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";

import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

const packageRoot = process.cwd();
const manifest = JSON.parse(
  await readFile(resolve(packageRoot, "package.json"), "utf8"),
);
if (manifest.name !== "@miaixz/icons")
  throw new Error("compare-visuals.mjs must run from @miaixz/icons.");

const currentRoot = resolve(
  packageRoot,
  "tests/.artifacts/icon-visual/current",
);
const baselineRoot = resolve(packageRoot, "tests/visuals/baselines");
const diffRoot = resolve(packageRoot, "tests/.artifacts/icon-visual/diffs");
await mkdir(diffRoot, { recursive: true });
const files = (await readdir(currentRoot))
  .filter((name) => name.endsWith(".png"))
  .sort();
if (files.length === 0)
  throw new Error("No rendered icon contact sheets were found.");

const results = [];
for (const name of files) {
  const baselinePath = resolve(baselineRoot, name);
  if (!existsSync(baselinePath)) {
    results.push({ name, status: "missing", differentPixels: null });
    continue;
  }
  const current = PNG.sync.read(await readFile(resolve(currentRoot, name)));
  const baseline = PNG.sync.read(await readFile(baselinePath));
  if (
    current.width !== 2048 ||
    current.height !== 768 ||
    baseline.width !== 2048 ||
    baseline.height !== 768
  ) {
    results.push({ name, status: "dimensions", differentPixels: null });
    continue;
  }
  const diff = new PNG({ width: 2048, height: 768 });
  const differentPixels = pixelmatch(
    current.data,
    baseline.data,
    diff.data,
    2048,
    768,
    {
      threshold: 0,
      includeAA: true,
      alpha: 1,
      diffMask: true,
    },
  );
  if (differentPixels > 0)
    await writeFile(resolve(diffRoot, name), PNG.sync.write(diff));
  results.push({
    name,
    status: differentPixels === 0 ? "equal" : "different",
    differentPixels,
  });
}

await writeFile(
  resolve(diffRoot, "report.json"),
  `${JSON.stringify({ schemaVersion: 1, results }, null, 2)}\n`,
);
const failures = results.filter((result) => result.status !== "equal");
if (failures.length > 0) {
  throw new Error(
    `Icon visual comparison failed for ${failures.length} sheet(s): ${failures
      .slice(0, 12)
      .map((result) => `${result.name}:${result.status}`)
      .join(", ")}`,
  );
}
console.log(
  `Compared ${results.length} icon contact sheets with zero differing pixels.`,
);

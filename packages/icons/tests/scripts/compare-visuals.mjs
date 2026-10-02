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
 * Applies the frozen cross-browser visual rules to the complete variable-font
 * render report. This machine gate avoids platform-specific antialiasing files.
 */

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { readRepositoryVersion } from "../../../../.github/scripts/miaixz.mjs";

const arguments_ = process.argv.slice(2);
if (arguments_.length !== 2 || arguments_[0] !== "--mode" || arguments_[1] !== "compare") {
  throw new Error("compare-visuals.mjs requires exactly --mode compare.");
}

const moduleRoot = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(moduleRoot, "../../../../");
const release = readRepositoryVersion(repositoryRoot);
const packageRoot = resolve(repositoryRoot, "packages/icons");
const currentRoot = resolve(packageRoot, ".artifacts/icon-visual/current");
const evidenceRoot = resolve(packageRoot, ".artifacts/icon-visual/evidence");
const reportBytes = await readFile(resolve(currentRoot, "render-report.json"));
const report = JSON.parse(reportBytes);
const failures = [];
const browserNames = ["chromium", "firefox", "webkit"];
const standardState = "fill-000-opsz-24";

if (
  report.schemaVersion !== 2 ||
  report.release !== release ||
  report.rulesVersion !== "miaixz-icon-visual-v2"
) {
  failures.push("visual report identity is invalid");
}
if (JSON.stringify(Object.keys(report.browsers).sort()) !== JSON.stringify(browserNames)) {
  failures.push("visual report browser set is invalid");
}

for (const browserName of browserNames) {
  const browser = report.browsers[browserName];
  if (
    browser?.basicSamples !== 30_720 ||
    browser.sheets !== 30 ||
    browser.emptySamples !== 0 ||
    browser.fillAxisChanges !== 1024 ||
    browser.opticalAxisChanges !== 1024 ||
    browser.states?.[standardState]?.length !== 1024
  ) {
    failures.push(`${browserName} does not satisfy the complete sample contract`);
    continue;
  }
  const animation = browser.animation;
  if (
    !Array.isArray(animation) ||
    animation.length !== 5 ||
    Math.abs(animation[0]) > 0.01 ||
    Math.abs(animation[4] - 1) > 0.01 ||
    animation.some((value, index) => index > 0 && value <= animation[index - 1])
  ) {
    failures.push(`${browserName} FILL animation samples are not strictly monotonic`);
  }
}

const reference = report.browsers.chromium?.states?.[standardState] ?? [];
for (const browserName of ["firefox", "webkit"]) {
  const candidate = report.browsers[browserName]?.states?.[standardState] ?? [];
  for (const [index, expected] of reference.entries()) {
    const actual = candidate[index];
    if (actual?.name !== expected.name) {
      failures.push(`${browserName} catalog order differs at index ${index}`);
      break;
    }
    const centroidDelta = Math.hypot(
      actual.centroid[0] - expected.centroid[0],
      actual.centroid[1] - expected.centroid[1],
    );
    const widthDelta = Math.abs(
      actual.bounds[2] - actual.bounds[0] - (expected.bounds[2] - expected.bounds[0]),
    );
    const heightDelta = Math.abs(
      actual.bounds[3] - actual.bounds[1] - (expected.bounds[3] - expected.bounds[1]),
    );
    const coverageRatio = actual.alpha / expected.alpha;
    if (
      centroidDelta > 2.5 ||
      widthDelta > 3 ||
      heightDelta > 3 ||
      coverageRatio < 0.65 ||
      coverageRatio > 1.5
    ) {
      failures.push(`${browserName}/${expected.name} exceeded visual geometry tolerances`);
      if (failures.length >= 24) break;
    }
  }
}

await mkdir(evidenceRoot, { recursive: true });
const evidence = Object.freeze({
  schemaVersion: 1,
  release,
  rulesVersion: "miaixz-icon-visual-v2",
  reportSha256: createHash("sha256").update(reportBytes).digest("hex"),
  browserNames,
  samplesPerBrowser: 30_720,
  totalSamples: 92_160,
  failures,
  status: failures.length === 0 ? "passed" : "failed",
});
await writeFile(
  resolve(evidenceRoot, "visual-gate.json"),
  `${JSON.stringify(evidence, null, 2)}\n`,
);
if (failures.length > 0) {
  throw new Error(`Icon visual gate failed: ${failures.join("; ")}`);
}
console.log("Verified 92,160 cross-browser samples and five 180ms animation frames per engine.");

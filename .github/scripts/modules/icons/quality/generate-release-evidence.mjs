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
 * Records actual fixed check results; never treats file existence as a pass.
 */
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { sourceSha256 } from "../fonts/validate-icon-font.mjs";
import { packageRoot, repositoryRoot } from "../source.mjs";

const scriptsRoot = ".github/scripts/modules/icons/";
const fixedChecks = [
  ["source", ["node", scriptsRoot + "quality/validate-icon-package.mjs", "--scope", "source"]],
  ["assignment", ["node", scriptsRoot + "quality/assign-icon-codepoints.mjs", "--check"]],
  ["font-source", ["node", scriptsRoot + "fonts/validate-icon-font.mjs", "--mode", "source"]],
  ["geometry", ["node", scriptsRoot + "fonts/validate-icon-font.mjs", "--mode", "validate"]],
  [
    "font-inspect",
    [
      "node",
      scriptsRoot + "fonts/validate-icon-font.mjs",
      "--mode",
      "inspect",
      "--input",
      "packages/icons/dist/assets/fonts",
    ],
  ],
  ["generated", ["node", scriptsRoot + "codegen/generate-icons.mjs", "--check"]],
  ["package-all", ["node", scriptsRoot + "quality/validate-icon-package.mjs", "--scope", "all"]],
  ["package-contracts", ["npm", "run", "check:package"]],
  ["script-names", ["npm", "run", "scripts:names:check"]],
  ["dependencies", ["npm", "run", "icons:dependencies:check"]],
  ...["test:coverage", "typecheck", "lint", "format:check", "test:browser"].map((name) => [
    "icons-" + name,
    ["npm", "run", name, "--workspace", "@miaixz/icons"],
  ]),
  ["ui-typecheck", ["npm", "run", "typecheck", "--workspace", "@miaixz/ui"]],
  ["examples-typecheck", ["npm", "--prefix", "examples", "run", "typecheck"]],
  ["visual", ["npm", "run", "icons:visual:check"]],
];

/**
 * Runs one exact argument vector without a shell.
 * @param {string[]} command Fixed command.
 * @returns {Promise<number>} Actual exit code (127 for missing executable).
 */
function execute(command) {
  return new Promise((resolvePromise) => {
    const child = spawn(command[0], command.slice(1), {
      cwd: repositoryRoot,
      shell: false,
      stdio: "inherit",
    });
    child.once("error", () => resolvePromise(127));
    child.once("close", (code) => resolvePromise(code ?? 1));
  });
}

/**
 * Always writes evidence, marking remaining checks not_run after the first failure.
 * @returns {Promise<any>} Automated-checks report; does not replace human signoff.
 */
export async function generateReleaseEvidence() {
  let initial = null,
    final = null,
    error = null,
    failed = false;
  try {
    initial = await sourceSha256();
  } catch (cause) {
    failed = true;
    error = String(cause);
  }
  const checks = [];
  for (const [name, command] of fixedChecks) {
    const exitCode = failed ? null : await execute(command);
    const status = exitCode === null ? "not_run" : exitCode === 0 ? "passed" : "failed";
    checks.push({ name, command, exitCode, status, sourceSha256: initial });
    if (status === "failed") failed = true;
  }
  try {
    final = await sourceSha256();
  } catch (cause) {
    failed = true;
    error = String(cause);
  }
  if (initial !== final) failed = true;
  const report = {
    scope: "automated-checks",
    status: failed ? "failed" : "passed",
    sourceSha256: initial,
    finalSourceSha256: final,
    checks,
    error,
  };
  const output = resolve(packageRoot, ".artifacts/release-evidence.json");
  await mkdir(resolve(output, ".."), { recursive: true });
  await writeFile(output, JSON.stringify(report, null, 2) + "\n");
  return report;
}
if (
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  if (process.argv.length !== 2)
    throw new Error("generate-release-evidence.mjs accepts no arguments.");
  const report = await generateReleaseEvidence();
  process.stdout.write("Icon automated checks: " + report.status + ".\n");
  if (report.status !== "passed") process.exitCode = 1;
}

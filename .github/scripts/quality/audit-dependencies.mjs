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
 * Audits production dependencies strictly and development dependencies against expiring exceptions.
 */

import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { loadRepositoryInventory, repositoryRoot } from "../miaixz.mjs";

const exceptionPath = new URL("audit-exceptions.json", import.meta.url);
const policy = JSON.parse(readFileSync(exceptionPath, "utf8"));
const inventory = loadRepositoryInventory(repositoryRoot);
const graphNames = new Set(inventory.graphs.map(({ name }) => name));
const failures = [];
const today = new Date().toISOString().slice(0, 10);

if (policy.schemaVersion !== 1 || !Array.isArray(policy.exceptions)) {
  failures.push("audit exception policy must use schemaVersion 1 and an exceptions array");
}

const activeExceptions = new Map();
for (const exception of policy.exceptions ?? []) {
  if (exception.scope !== "development-only") {
    failures.push(`${exception.id ?? "unknown"}: only development-only exceptions are permitted`);
    continue;
  }
  if (typeof exception.expiresOn !== "string" || exception.expiresOn < today) {
    failures.push(
      `${exception.id ?? "unknown"}: exception expired on ${exception.expiresOn ?? "unknown"}`,
    );
    continue;
  }
  if (!Array.isArray(exception.packages) || exception.packages.length === 0) {
    failures.push(`${exception.id ?? "unknown"}: exception packages must be non-empty`);
    continue;
  }
  if (
    !Array.isArray(exception.graphs) ||
    exception.graphs.length === 0 ||
    exception.graphs.some((name) => !graphNames.has(name))
  ) {
    failures.push(
      `${exception.id ?? "unknown"}: exception graphs must name existing dependency graphs`,
    );
    continue;
  }
  for (const graphName of exception.graphs) {
    for (const packageName of exception.packages) {
      const key = `${graphName}\0${packageName}`;
      if (activeExceptions.has(key)) {
        failures.push(`${graphName}:${packageName}: package is covered by more than one exception`);
      }
      activeExceptions.set(key, exception);
    }
  }
}

for (const graph of inventory.graphs) {
  const production = runAudit(graph.rootPath, true);
  const productionFindings = Object.keys(production.vulnerabilities ?? {});
  if (productionFindings.length > 0) {
    failures.push(`${graph.name}: production vulnerabilities: ${productionFindings.join(", ")}`);
  }

  const complete = runAudit(graph.rootPath, false);
  for (const [packageName, vulnerability] of Object.entries(complete.vulnerabilities ?? {})) {
    const exception = activeExceptions.get(`${graph.name}\0${packageName}`);
    if (exception === undefined) {
      failures.push(
        `${graph.name}: unapproved ${vulnerability.severity} vulnerability in ${packageName}`,
      );
      continue;
    }
    if (vulnerability.severity !== exception.severity) {
      failures.push(
        `${graph.name}: ${packageName} severity changed from ${exception.severity} to ${vulnerability.severity}`,
      );
    }
  }

  for (const exception of (policy.exceptions ?? []).filter(({ graphs }) =>
    graphs?.includes(graph.name),
  )) {
    const rootFinding = complete.vulnerabilities?.[exception.rootPackage];
    const advisoryUrls = (rootFinding?.via ?? [])
      .filter((item) => typeof item === "object" && item !== null)
      .map((item) => item.url);
    if (!advisoryUrls.some((url) => typeof url === "string" && url.includes(exception.id))) {
      failures.push(
        `${graph.name}:${exception.id}: root advisory is no longer present as documented`,
      );
    }
  }
}

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log("Production audits are clean; development findings match active exceptions.");
}

/**
 * Runs npm audit and returns its machine-readable report even when findings set a non-zero status.
 *
 * @param {string} directory Package graph root.
 * @param {boolean} productionOnly Whether to omit development dependencies.
 * @returns {Record<string, any>} Parsed npm audit report.
 */
function runAudit(directory, productionOnly) {
  const arguments_ = ["audit", "--json", ...(productionOnly ? ["--omit=dev"] : [])];
  const result = spawnSync("npm", arguments_, {
    cwd: directory,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
  try {
    return JSON.parse(result.stdout);
  } catch {
    failures.push(
      `${directory}: npm audit did not return JSON${result.stderr ? ` (${result.stderr.trim()})` : ""}`,
    );
    return {};
  }
}

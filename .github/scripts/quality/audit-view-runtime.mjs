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
 * Audits viewer runtime dependencies and the shared-layer import boundary.
 */

import { readFile, readdir } from "node:fs/promises";
import { basename, extname, isAbsolute, join, relative, resolve } from "node:path";
import { repositoryRoot } from "../miaixz.mjs";

const packageRoot = resolve(repositoryRoot, "view");
const sourceRoot = resolve(packageRoot, "src");
const sharedRoot = resolve(sourceRoot, "shared");
const formatsRoot = resolve(sourceRoot, "formats");
const codecsRoot = resolve(sourceRoot, "codecs");
const retiredCodecDirectories = new Set(["compression", "document", "drawing", "technical"]);
const packageJson = JSON.parse(await readFile(resolve(packageRoot, "package.json"), "utf8"));
const forbiddenPackages = ["pdfjs-dist"];
const forbiddenSource = [
  { label: "PDF.js", pattern: /pdfjs-dist|pdf\.worker\.min/iu },
  { label: "ONLYOFFICE", pattern: /onlyoffice|DocsAPI|documentServerUrl/iu },
  { label: "remote runtime", pattern: /https?:\/\//iu },
];

/**
 * Recursively returns source files considered part of the runtime.
 * @param directory - Directory to scan.
 * @returns Absolute source file paths.
 */
async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? sourceFiles(path) : [path];
    }),
  );
  return files
    .flat()
    .filter((path) => [".css", ".ts", ".tsx", ".js", ".mjs"].includes(extname(path)));
}

const failures = [];
for (const entry of await readdir(codecsRoot, { withFileTypes: true })) {
  if (entry.isDirectory() && retiredCodecDirectories.has(entry.name)) {
    failures.push(`codecs/${entry.name} uses a retired codec domain name`);
  }
}
for (const section of ["dependencies", "optionalDependencies"]) {
  for (const dependency of Object.keys(packageJson[section] ?? {})) {
    if (forbiddenPackages.includes(dependency) || section === "dependencies") {
      failures.push(`${section} contains forbidden runtime package ${dependency}`);
    }
  }
}

const auditedFiles = [
  ...(await sourceFiles(sourceRoot)),
  ...["eslint.config.js", "prettier.config.js", "stylelint.config.js", "vitest.config.ts"].map(
    (filename) => resolve(packageRoot, filename),
  ),
];

for (const path of auditedFiles) {
  const source = await readFile(path, "utf8");
  const moduleBody = source.replace(/^\/\*[\s\S]*?miaixz\.org[\s\S]*?\*\/\s*/u, "");
  if (!moduleBody.startsWith("/**\n")) {
    failures.push(`${relative(packageRoot, path)} lacks a leading multiline module description`);
  }
  const executableSource = source
    .replaceAll(/\/\*[\s\S]*?\*\//gu, "")
    .replaceAll(/^\s*\/\/.*$/gmu, "");
  for (const rule of forbiddenSource) {
    if (rule.pattern.test(executableSource)) {
      failures.push(`${relative(sourceRoot, path)} contains ${rule.label}`);
    }
  }
  if (path.startsWith(sharedRoot)) {
    const importPattern = /(?:from\s*|import\s*\()\s*["']([^"']+)["']/gu;
    for (const match of executableSource.matchAll(importPattern)) {
      const specifier = match[1];
      if (specifier === undefined) continue;
      if (!specifier.startsWith(".")) {
        failures.push(`${relative(sourceRoot, path)} imports external module ${specifier}`);
        continue;
      }
      const target = resolve(path, "..", specifier);
      const sharedRelative = relative(sharedRoot, target);
      if (sharedRelative.startsWith("..") || isAbsolute(sharedRelative)) {
        failures.push(
          `${relative(sourceRoot, path)} crosses the shared dependency boundary via ${specifier}`,
        );
      }
    }
  }
  if (
    path.startsWith(codecsRoot) &&
    extname(path) === ".ts" &&
    !basename(path).endsWith("-codec.ts")
  ) {
    failures.push(
      `${relative(sourceRoot, path)} must use the <subject>-codec.ts naming convention`,
    );
  }
  if (path.startsWith(formatsRoot)) {
    const owner = relative(formatsRoot, path).split(/[\\/]/u)[0];
    const importPattern = /(?:from\s*|import\s*\()\s*["']([^"']+)["']/gu;
    for (const match of executableSource.matchAll(importPattern)) {
      const specifier = match[1];
      if (specifier === undefined || !specifier.startsWith(".")) continue;
      const target = resolve(path, "..", specifier);
      const targetRelative = relative(formatsRoot, target);
      if (!targetRelative.startsWith("..") && !isAbsolute(targetRelative)) {
        const targetOwner = targetRelative.split(/[\\/]/u)[0];
        if (targetOwner !== owner) {
          failures.push(
            `${relative(sourceRoot, path)} imports sibling format ${targetOwner} via ${specifier}`,
          );
        }
      }
    }
  }
}

if (failures.length > 0) {
  process.stderr.write(`${failures.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    "Runtime dependency audit passed: no third-party parser, PDF.js, ONLYOFFICE, remote runtime, shared reverse dependency, or codec naming violation.\n",
  );
}

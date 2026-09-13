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

import { readFileSync, writeFileSync } from "node:fs";
import { assertReleaseVersion } from "../version.mjs";

const [version, outputPath] = process.argv.slice(2);
if (!version || !outputPath) throw new Error("Usage: create-release-notes.mjs <version> <output>.");
assertReleaseVersion(version);

function readVersionSection(path) {
  const source = readFileSync(path, "utf8");
  const headingPattern = new RegExp(
    `^## \\[${version.replaceAll(".", "\\.")}\\] - \\d{4}-\\d{2}-\\d{2}$`,
    "gmu",
  );
  const matches = [...source.matchAll(headingPattern)];
  if (matches.length !== 1) {
    throw new Error(`${path} must contain exactly one release heading for ${version}.`);
  }
  const start = matches[0].index + matches[0][0].length;
  const nextHeading = source.indexOf("\n## [", start);
  const section = source.slice(start, nextHeading < 0 ? source.length : nextHeading).trim();
  if (!section || !/^###\s+/mu.test(section) || !/^-\s+\S+/mu.test(section)) {
    throw new Error(
      `${path} release section for ${version} must contain a non-empty subsection and entry.`,
    );
  }
  return section;
}

const sdk = readVersionSection("sdk/CHANGELOG.md");
const ui = readVersionSection("ui/CHANGELOG.md");
writeFileSync(outputPath, `# Miaixz.js ${version}\n\n## SDK\n\n${sdk}\n\n## UI\n\n${ui}\n`);
console.log(`Release notes written to ${outputPath}.`);

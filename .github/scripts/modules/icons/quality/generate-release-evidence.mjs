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
 * Produces the immutable local release-candidate evidence for the icon system.
 */

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { readRepositoryVersion } from "../../../miaixz.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const repositoryRoot = resolve(dirname(scriptPath), "../../../../..");
const release = readRepositoryVersion(repositoryRoot);
const masterNames = [
  "outline-compact",
  "outline-standard",
  "outline-display",
  "filled-compact",
  "filled-standard",
  "filled-display",
];

/**
 * Reads one repository file.
 *
 * @param {string} path - Repository-relative path.
 * @returns {Buffer} File bytes.
 */
function readRepositoryFile(path) {
  const absolutePath = resolve(repositoryRoot, path);
  if (!existsSync(absolutePath)) throw new Error(`Missing release evidence input: ${path}`);
  return readFileSync(absolutePath);
}

/**
 * Parses one JSON evidence input.
 *
 * @param {string} path - Repository-relative path.
 * @returns {any} Parsed JSON value.
 */
function readJson(path) {
  return JSON.parse(readRepositoryFile(path).toString("utf8"));
}

/**
 * Calculates a SHA-256 digest.
 *
 * @param {Buffer|string} value - Input bytes or text.
 * @returns {string} Lowercase hexadecimal digest.
 */
function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

/**
 * Describes a required evidence file.
 *
 * @param {string} path - Repository-relative path.
 * @returns {{path: string, bytes: number, sha256: string}} Immutable file identity.
 */
function describeFile(path) {
  const bytes = readRepositoryFile(path);
  return Object.freeze({
    path,
    bytes: bytes.byteLength,
    sha256: sha256(bytes),
  });
}

/**
 * Fails with a stable message when a release condition is false.
 *
 * @param {unknown} condition - Condition to assert.
 * @param {string} message - Failure message.
 */
function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

const releasePlan = readJson("packages/icons/src/assets/release-plan.json");
const catalog = readJson("packages/icons/src/assets/catalog.json");
const codepoints = readJson("packages/icons/src/assets/fonts/codepoints.json");
const rootManifest = readJson("package.json");

invariant(releasePlan.release === release, `Release plan version is not ${release}.`);
invariant(releasePlan.batches?.length === 16, "Release plan must contain 16 batches.");
invariant(releasePlan.canonicalNames?.length === 1024, "Release plan must contain 1024 names.");
invariant(catalog.icons?.length === 1024, "Catalog must contain exactly 1024 icons.");
invariant(
  catalog.icons.every((icon) => icon.source === "miaixz" && icon.status === "stable"),
  "Catalog contains a non-Miaixz or non-stable icon.",
);
invariant(codepoints.icons?.length === 1024, "Codepoint map must contain 1024 icons.");
invariant(!existsSync(resolve(repositoryRoot, "providers")), "Provider directory still exists.");
invariant(
  JSON.stringify(rootManifest.workspaces) ===
    JSON.stringify(["packages/sdk", "packages/ui", "packages/view", "packages/icons"]),
  "Root workspaces must contain exactly the four core packages.",
);

const batches = releasePlan.batches.map((batch) => {
  invariant(batch.names.length === 64, `${batch.id} must contain exactly 64 names.`);
  const sources = masterNames.flatMap((master) =>
    batch.names.map((name) =>
      describeFile(
        `packages/icons/src/assets/fonts/miaixz-icons-${master}.ufo/glyphs/miaixz.${name}.glif`,
      ),
    ),
  );
  return Object.freeze({
    id: batch.id,
    glyphs: batch.names.length,
    masters: masterNames.length,
    sourceFiles: sources.length,
    sourceSha256: sha256(sources.map((source) => source.sha256).join("\n")),
  });
});

const fonts = Object.freeze({
  font: describeFile("packages/icons/dist/assets/fonts/miaixz-icons.woff2"),
});

const sourceEvidence = [
  "packages/icons/src/assets/catalog.json",
  "packages/icons/src/assets/design-briefs.json",
  "packages/icons/src/assets/release-plan.json",
  "packages/icons/src/assets/fonts/codepoints.json",
  "packages/icons/src/assets/fonts/miaixz-icons.designspace",
].map(describeFile);

const report = Object.freeze({
  schemaVersion: 1,
  release,
  status: "passed",
  generatedBy: relative(repositoryRoot, scriptPath),
  constraints: Object.freeze({
    gitWrites: "forbidden",
    npmPublish: "not-performed",
    humanApproval: "not-required",
    providerPackages: 0,
  }),
  totals: Object.freeze({
    canonicalIcons: 1024,
    masters: 6,
    sourceGlyphFiles: 6144,
  }),
  fonts,
  sourceEvidence,
  batches,
});

const outputPath = resolve(repositoryRoot, "packages/icons/.artifacts/release-evidence.json");
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
const outputBytes = statSync(outputPath).size;
process.stdout.write(
  `Icon release evidence passed: ${report.totals.sourceGlyphFiles} source glyph files, ${outputBytes} report bytes.\n`,
);

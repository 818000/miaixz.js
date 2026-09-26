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
 * Validates the frozen Miaixz icon-system contracts.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, relative, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { parse } from "@babel/parser";
import { SVGPathData } from "svg-pathdata";
import { svgPathBbox } from "svg-path-bbox";
import { parseIconSvg } from "../lib/svg-pipeline.mjs";

const scopes = new Set([
  "structure",
  "catalog",
  "svg",
  "provider",
  "package",
  "all",
]);
const providers = new Set(["lucide", "phosphor", "fontawesome", "iconify"]);
const categories = [
  "actions",
  "navigation",
  "status",
  "files",
  "editor",
  "media",
  "communication",
  "commerce",
  "devices",
  "maps",
  "data",
  "objects",
];
const tiers = ["core", "extended", "compat"];
const statuses = ["draft", "review", "stable", "deprecated"];
const variants = ["outline", "filled"];
const opticalSizes = ["compact", "standard", "display"];
const namePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const exactSemverPattern = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/u;
const placeholderPattern =
  /^\s*(?:tbd|todo|placeholder|design later|\u8bbe\u8ba1\u65f6\u51b3\u5b9a|\u5f85\u5b9a)\b/iu;
const scriptPath = fileURLToPath(import.meta.url);

/**
 * Parses and validates the frozen command-line interface.
 *
 * @param {string[]} argv - Command-line arguments without the executable and script path.
 * @returns {{scope: string, provider: string | undefined}} Validated immutable options.
 */
export function parseArguments(argv) {
  let scope = "all";
  let provider;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--scope") {
      scope = argv[index + 1];
      index += 1;
    } else if (argument === "--provider") {
      provider = argv[index + 1];
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  if (!scopes.has(scope)) throw new Error(`Invalid scope: ${String(scope)}`);
  if (scope === "provider" && !providers.has(provider)) {
    throw new Error(
      "--scope provider requires --provider lucide|phosphor|fontawesome|iconify",
    );
  }
  if (scope !== "provider" && provider !== undefined) {
    throw new Error("--provider is only valid with --scope provider");
  }
  return Object.freeze({ scope, provider });
}

/**
 * Reads and parses one JSON file with path-aware failures.
 *
 * @param {string} path - Absolute file path.
 * @returns {any} Parsed JSON value.
 */
function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    throw new Error(
      `${path}: ${error instanceof Error ? error.message : String(error)}`,
      {
        cause: error,
      },
    );
  }
}

/**
 * Locates the enclosing miaixz.js repository without guessing a sibling workspace.
 *
 * @param {string} start - Directory to search upward from.
 * @returns {string} Absolute repository root.
 */
function findRepositoryRoot(start) {
  let directory = resolve(start);
  while (true) {
    const manifestPath = resolve(directory, "package.json");
    if (existsSync(manifestPath)) {
      const manifest = readJson(manifestPath);
      if (manifest.name === "miaixz.js") return directory;
    }
    const parent = dirname(directory);
    if (parent === directory) break;
    directory = parent;
  }
  throw new Error(
    `Current directory is not inside the miaixz.js repository: ${start}`,
  );
}

/**
 * Resolves and verifies the current validation target.
 *
 * @param {string} cwd - Target package working directory.
 * @param {string | undefined} provider - Optional provider identifier.
 * @returns {{cwd: string, manifest: any, repositoryRoot: string}} Target metadata.
 */
function resolveTarget(cwd, provider) {
  const manifestPath = resolve(cwd, "package.json");
  if (!existsSync(manifestPath))
    throw new Error(`Current directory has no package.json: ${cwd}`);
  const manifest = readJson(manifestPath);
  const allowed = new Set([
    "miaixz.js",
    "@miaixz/icons",
    "@miaixz/icons-lucide",
    "@miaixz/icons-phosphor",
    "@miaixz/icons-fontawesome",
    "@miaixz/icons-iconify",
  ]);
  if (!allowed.has(manifest.name))
    throw new Error(`Unsupported icon validation target: ${manifest.name}`);
  if (provider !== undefined && manifest.name !== "miaixz.js") {
    const expected = `@miaixz/icons-${provider}`;
    if (manifest.name !== expected)
      throw new Error(`Provider target must be ${expected}`);
  }
  return Object.freeze({
    cwd,
    manifest,
    repositoryRoot: findRepositoryRoot(cwd),
  });
}

/**
 * Recursively lists source files while excluding generated and dependency trees.
 *
 * @param {string} directory - Directory to traverse.
 * @returns {string[]} Absolute file paths.
 */
function walk(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (["dist", "node_modules", "autogen", "fixtures"].includes(entry.name))
      return [];
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

/**
 * Traverses Babel AST nodes without revisiting source metadata.
 *
 * @param {any} node - Current AST value.
 * @param {(node: any) => void} callback - Visitor invoked for every AST node.
 * @returns {void}
 */
function visit(node, callback) {
  if (node === null || typeof node !== "object") return;
  if (typeof node.type === "string") callback(node);
  for (const [key, value] of Object.entries(node)) {
    if (["loc", "start", "end", "extra", "comments", "tokens"].includes(key))
      continue;
    if (Array.isArray(value)) {
      for (const item of value) visit(item, callback);
    } else {
      visit(value, callback);
    }
  }
}

/**
 * Reports whether a type subtree references IconName.
 *
 * @param {any} node - Babel type subtree.
 * @returns {boolean} Whether IconName occurs.
 */
function containsIconNameType(node) {
  let found = false;
  visit(node, (candidate) => {
    if (
      candidate.type === "TSTypeReference" &&
      candidate.typeName?.type === "Identifier" &&
      candidate.typeName.name === "IconName"
    ) {
      found = true;
    }
  });
  return found;
}

/**
 * Reads a static identifier or string key.
 *
 * @param {any} node - Babel key node.
 * @returns {string | undefined} Static key value.
 */
function keyName(node) {
  if (node?.type === "Identifier" || node?.type === "JSXIdentifier")
    return node.name;
  if (node?.type === "StringLiteral") return node.value;
  return undefined;
}

/**
 * Resolves static icon-name expressions accepted by the frozen scanner contract.
 *
 * @param {any} node - Babel expression node.
 * @param {Map<string, string>} iconNames - ICON_NAMES member mapping.
 * @param {boolean} allowIdentifier - Whether externally supplied identifiers are allowed.
 * @returns {string[] | undefined} Resolved values, an allowed empty dynamic value, or failure.
 */
function literalValues(node, iconNames, allowIdentifier = false) {
  if (node?.type === "StringLiteral") return [node.value];
  if (node?.type === "ConditionalExpression") {
    return [
      ...literalValues(node.consequent, iconNames, allowIdentifier),
      ...literalValues(node.alternate, iconNames, allowIdentifier),
    ];
  }
  if (node?.type === "LogicalExpression") {
    const left = literalValues(node.left, iconNames, allowIdentifier);
    const right = literalValues(node.right, iconNames, allowIdentifier);
    if (left !== undefined && right !== undefined) return [...left, ...right];
  }
  if (
    node?.type === "MemberExpression" &&
    node.object?.type === "Identifier" &&
    node.object.name === "ICON_NAMES"
  ) {
    const key = keyName(node.property);
    if (key !== undefined && iconNames.has(key)) return [iconNames.get(key)];
  }
  if (allowIdentifier && node?.type === "MemberExpression") return [];
  if (
    allowIdentifier &&
    node?.type === "CallExpression" &&
    node.callee?.type === "Identifier"
  ) {
    return [];
  }
  if (allowIdentifier && node?.type === "Identifier") return [];
  return undefined;
}

/**
 * Formats a deterministic repository-relative source location.
 *
 * @param {string} repositoryRoot - Absolute repository root.
 * @param {string} file - Absolute source path.
 * @param {any} node - Babel AST node carrying location data.
 * @returns {string} Repository-relative file, line, and column.
 */
function location(repositoryRoot, file, node) {
  const line = node.loc?.start.line ?? 1;
  const column = (node.loc?.start.column ?? 0) + 1;
  return `${relative(repositoryRoot, file)}:${line}:${column}`;
}

/**
 * Builds the frozen ICON_NAMES member mapping from the reviewed catalog.
 *
 * @param {string} repositoryRoot - Absolute repository root.
 * @returns {Map<string, string>} Constant member-to-name mapping.
 */
function readLegacyIconNames(repositoryRoot) {
  const catalog = readJson(
    resolve(repositoryRoot, "packages/icons/src/assets/catalog.json"),
  );
  const names = new Map();
  for (const entry of catalog.icons) {
    for (const name of [entry.name, ...entry.aliases])
      names.set(name.replaceAll("-", "_").toUpperCase(), name);
  }
  return names;
}

/**
 * Collects statically knowable built-in icon usages from public source consumers.
 *
 * @param {string} repositoryRoot - Absolute repository root.
 * @returns {Array<[string, string]>} Sorted name and first-use location pairs.
 */
export function scanCoreIconNames(repositoryRoot) {
  const iconNames = readLegacyIconNames(repositoryRoot);
  const roots = [
    resolve(repositoryRoot, "packages/ui/src"),
    resolve(repositoryRoot, "packages/view/src"),
    resolve(repositoryRoot, "examples"),
  ];
  const files = roots
    .flatMap((root) => walk(root))
    .filter((file) => file.endsWith(".ts") || file.endsWith(".tsx"))
    .filter((file) => !file.includes("/packages/ui/src/icons/"))
    .filter(
      (file) =>
        !/\/examples\/icon-system\/src\/(?:lucide|phosphor|fontawesome|iconify)\.tsx$/u.test(
          file,
        ),
    )
    .sort();
  const usages = new Map();
  const failures = [];
  const record = (value, file, node) => {
    if (!namePattern.test(value)) {
      failures.push(
        `${location(repositoryRoot, file, node)} invalid icon name: ${value}`,
      );
      return;
    }
    if (!usages.has(value))
      usages.set(value, location(repositoryRoot, file, node));
  };
  const collect = (expression, file, node, allowIdentifier = false) => {
    const values = literalValues(expression, iconNames, allowIdentifier);
    if (values === undefined) {
      failures.push(
        `${location(repositoryRoot, file, node)} dynamic icon name is not statically resolvable`,
      );
      return;
    }
    for (const value of values) record(value, file, node);
  };
  for (const file of files) {
    const ast = parse(readFileSync(file, "utf8"), {
      sourceType: "module",
      plugins: ["typescript", ...(file.endsWith(".tsx") ? ["jsx"] : [])],
      errorRecovery: false,
    });
    visit(ast, (node) => {
      if (node.type === "JSXOpeningElement" && keyName(node.name) === "Icon") {
        const attribute = node.attributes.find(
          (candidate) =>
            candidate.type === "JSXAttribute" &&
            keyName(candidate.name) === "name",
        );
        if (attribute?.value?.type === "StringLiteral")
          record(attribute.value.value, file, attribute);
        else if (attribute?.value?.type === "JSXExpressionContainer") {
          collect(attribute.value.expression, file, attribute, true);
        }
      }
      if (node.type === "ObjectProperty" && keyName(node.key) === "icon") {
        if (
          [
            "StringLiteral",
            "ConditionalExpression",
            "MemberExpression",
            "Identifier",
          ].includes(node.value.type)
        ) {
          collect(node.value, file, node, true);
        }
      }
      if (
        node.type === "MemberExpression" &&
        node.object?.type === "Identifier" &&
        node.object.name === "ICON_NAMES"
      ) {
        collect(node, file, node, false);
      }
      if (
        node.type === "VariableDeclarator" &&
        containsIconNameType(node.id?.typeAnnotation)
      ) {
        if (node.init?.type === "StringLiteral")
          record(node.init.value, file, node.init);
        else if (node.init?.type === "ArrayExpression") {
          for (const element of node.init.elements) {
            if (element?.type === "StringLiteral")
              record(element.value, file, element);
            else if (element !== null) {
              failures.push(
                `${location(repositoryRoot, file, element)} IconName array value must use a string literal`,
              );
            }
          }
        } else if (
          node.init !== null &&
          node.init !== undefined &&
          node.init.type !== "Identifier" &&
          node.init.type !== "ObjectExpression"
        ) {
          failures.push(
            `${location(repositoryRoot, file, node.init)} IconName value must use a string literal`,
          );
        }
      }
      if (
        [
          "FunctionDeclaration",
          "FunctionExpression",
          "ArrowFunctionExpression",
        ].includes(node.type) &&
        containsIconNameType(node.returnType)
      ) {
        visit(node.body, (candidate) => {
          if (
            candidate.type === "ReturnStatement" &&
            candidate.argument !== null
          ) {
            collect(candidate.argument, file, candidate, true);
          }
        });
      }
    });
  }
  if (failures.length > 0) throw new Error(failures.sort().join("\n"));
  return [...usages].sort(([left], [right]) => left.localeCompare(right));
}

/**
 * Appends a validation failure when a condition is false.
 *
 * @param {boolean} condition - Assertion result.
 * @param {string} message - Deterministic failure text.
 * @param {string[]} failures - Mutable failure collection.
 * @returns {void}
 */
function assert(condition, message, failures) {
  if (!condition) failures.push(message);
}

/**
 * Requires an object to contain exactly the declared fields.
 *
 * @param {any} value - Candidate object.
 * @param {string[]} expected - Exact field names.
 * @param {string} label - Diagnostic label.
 * @param {string[]} failures - Mutable failure collection.
 * @returns {void}
 */
function exactKeys(value, expected, label, failures) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    failures.push(`${label} must be an object`);
    return;
  }
  const actual = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  assert(
    JSON.stringify(actual) === JSON.stringify(sortedExpected),
    `${label} has invalid fields`,
    failures,
  );
}

/**
 * Reports whether an array is unique and strictly Unicode-sorted.
 *
 * @param {any} values - Candidate array.
 * @returns {boolean} Whether ordering and uniqueness hold.
 */
function sortedUnique(values) {
  return (
    Array.isArray(values) &&
    new Set(values).size === values.length &&
    values.every(
      (value, index) =>
        index === 0 || values[index - 1].localeCompare(value) < 0,
    )
  );
}

/**
 * Resolves the icon asset root for the repository or core package target.
 *
 * @param {{cwd: string, manifest: any, repositoryRoot: string}} target - Target metadata.
 * @returns {string} Absolute asset root.
 */
function assetRoot(target) {
  return target.manifest.name === "@miaixz/icons"
    ? resolve(target.cwd, "src/assets")
    : resolve(target.repositoryRoot, "packages/icons/src/assets");
}

/**
 * Validates catalog, brief, release-plan, fixture, and AST cross-references.
 *
 * @param {{cwd: string, manifest: any, repositoryRoot: string}} target - Target metadata.
 * @returns {{catalog: any, briefs: any, plan: any, coreUsage: string[]}} Validated inputs.
 */
function validateCatalog(target) {
  const root = assetRoot(target);
  const failures = [];
  for (const name of [
    "catalog.schema.json",
    "design-briefs.schema.json",
    "release-plan.schema.json",
  ]) {
    const schema = readJson(resolve(root, name));
    assert(
      schema.additionalProperties === false,
      `${name} must reject additional properties`,
      failures,
    );
  }
  const catalog = readJson(resolve(root, "catalog.json"));
  const briefs = readJson(resolve(root, "design-briefs.json"));
  const plan = readJson(resolve(root, "release-plan.json"));
  exactKeys(catalog, ["schemaVersion", "icons"], "catalog", failures);
  assert(
    catalog.schemaVersion === 1,
    "catalog.schemaVersion must be 1",
    failures,
  );
  assert(
    Array.isArray(catalog.icons),
    "catalog.icons must be an array",
    failures,
  );
  const canonical = new Set();
  const aliases = new Set();
  for (const [index, icon] of (catalog.icons ?? []).entries()) {
    const label = `catalog.icons[${index}]`;
    exactKeys(
      icon,
      [
        "name",
        "category",
        "tier",
        "status",
        "source",
        "tags",
        "aliases",
        "replacement",
        "variants",
        "rtl",
        "introducedIn",
      ],
      label,
      failures,
    );
    assert(namePattern.test(icon.name), `${label}.name is invalid`, failures);
    assert(!canonical.has(icon.name), `${label}.name is duplicated`, failures);
    canonical.add(icon.name);
    assert(
      categories.includes(icon.category),
      `${label}.category is invalid`,
      failures,
    );
    assert(tiers.includes(icon.tier), `${label}.tier is invalid`, failures);
    assert(
      statuses.includes(icon.status),
      `${label}.status is invalid`,
      failures,
    );
    assert(
      ["miaixz", "third-party"].includes(icon.source),
      `${label}.source is invalid`,
      failures,
    );
    assert(
      sortedUnique(icon.tags) && icon.tags.length > 0,
      `${label}.tags must be sorted and unique`,
      failures,
    );
    assert(
      sortedUnique(icon.aliases) &&
        icon.aliases.every((alias) => namePattern.test(alias)),
      `${label}.aliases must be valid, sorted, and unique`,
      failures,
    );
    for (const alias of icon.aliases ?? []) {
      assert(
        !aliases.has(alias),
        `${label}.alias ${alias} is duplicated`,
        failures,
      );
      aliases.add(alias);
    }
    assert(
      icon.rtl === "none" || icon.rtl === "mirror",
      `${label}.rtl is invalid`,
      failures,
    );
    assert(
      exactSemverPattern.test(icon.introducedIn),
      `${label}.introducedIn is invalid`,
      failures,
    );
    assert(
      icon.status === "deprecated" || icon.replacement === null,
      `${label}.replacement is invalid`,
      failures,
    );
    exactKeys(
      icon.variants,
      Object.keys(icon.variants),
      `${label}.variants`,
      failures,
    );
    for (const [variant, sizes] of Object.entries(icon.variants ?? {})) {
      assert(
        variants.includes(variant),
        `${label}.variants.${variant} is invalid`,
        failures,
      );
      assert(
        Array.isArray(sizes) &&
          sizes.length > 0 &&
          new Set(sizes).size === sizes.length &&
          sizes.every((size) => opticalSizes.includes(size)),
        `${label}.variants.${variant} has invalid sizes`,
        failures,
      );
    }
    if (icon.tier === "compat") {
      assert(
        icon.source === "third-party",
        `${label} compat source must be third-party`,
        failures,
      );
      assert(
        Object.keys(icon.variants ?? {}).length === 0,
        `${label} compat variants must be empty`,
        failures,
      );
    }
  }
  assert(
    sortedUnique([...canonical]),
    "catalog icons must be sorted by name",
    failures,
  );
  for (const alias of aliases)
    assert(
      !canonical.has(alias),
      `alias duplicates canonical name: ${alias}`,
      failures,
    );

  exactKeys(
    briefs,
    ["schemaVersion", "release", "icons"],
    "design briefs",
    failures,
  );
  assert(
    briefs.schemaVersion === 1 && briefs.release === "0.6.5",
    "design briefs header is invalid",
    failures,
  );
  const briefNames = new Set();
  for (const [index, brief] of (briefs.icons ?? []).entries()) {
    const label = `designBriefs.icons[${index}]`;
    exactKeys(
      brief,
      [
        "name",
        "meaning",
        "metaphor",
        "requiredElements",
        "forbiddenElements",
        "outlineTreatment",
        "filledTreatment",
        "compactTreatment",
        "displayTreatment",
        "rtl",
      ],
      label,
      failures,
    );
    assert(
      namePattern.test(brief.name) && !briefNames.has(brief.name),
      `${label}.name is invalid`,
      failures,
    );
    briefNames.add(brief.name);
    for (const field of ["meaning", "metaphor", "outlineTreatment"]) {
      assert(
        typeof brief[field] === "string" &&
          brief[field].trim() !== "" &&
          !placeholderPattern.test(brief[field]),
        `${label}.${field} is invalid`,
        failures,
      );
    }
    for (const field of ["requiredElements", "forbiddenElements"]) {
      assert(
        sortedUnique(brief[field]) &&
          brief[field].length > 0 &&
          brief[field].every(
            (value) =>
              typeof value === "string" &&
              value.trim() !== "" &&
              !placeholderPattern.test(value),
          ),
        `${label}.${field} is invalid`,
        failures,
      );
    }
    for (const field of [
      "filledTreatment",
      "compactTreatment",
      "displayTreatment",
    ]) {
      assert(
        brief[field] === null ||
          (typeof brief[field] === "string" &&
            brief[field].trim() !== "" &&
            !placeholderPattern.test(brief[field])),
        `${label}.${field} is invalid`,
        failures,
      );
    }
    assert(
      brief.rtl === "none" || brief.rtl === "mirror",
      `${label}.rtl is invalid`,
      failures,
    );
  }
  assert(
    sortedUnique([...briefNames]),
    "design briefs must be sorted by name",
    failures,
  );

  exactKeys(
    plan,
    ["schemaVersion", "release", "targetCanonicalCount", "state", "batches"],
    "release plan",
    failures,
  );
  assert(
    plan.schemaVersion === 1 &&
      plan.release === "0.6.5" &&
      plan.targetCanonicalCount === 1024,
    "release plan header is invalid",
    failures,
  );
  assert(
    ["planned", "production", "complete"].includes(plan.state),
    "release plan state is invalid",
    failures,
  );
  assert(
    Array.isArray(plan.batches) && plan.batches.length === 16,
    "release plan needs 16 batches",
    failures,
  );
  const plannedNames = [];
  const benchmarkNames = [
    "add",
    "close",
    "help",
    "search",
    "chevron-right",
    "home",
    "user-round",
    "file",
    "folder",
    "circle-alert",
    "settings",
    "delete",
  ];
  for (let index = 0; index < (plan.batches ?? []).length; index += 1) {
    const batch = plan.batches[index];
    const id = `batch-${String(index + 1).padStart(2, "0")}`;
    exactKeys(
      batch,
      ["id", "names"],
      `releasePlan.batches[${index}]`,
      failures,
    );
    assert(
      batch.id === id,
      `releasePlan.batches[${index}].id must be ${id}`,
      failures,
    );
    assert(
      Array.isArray(batch.names) && batch.names.length === 64,
      `${id} must contain 64 names`,
      failures,
    );
    assert(
      (batch.names ?? []).every(
        (name) => typeof name === "string" && namePattern.test(name),
      ),
      `${id} contains an invalid name`,
      failures,
    );
    const sortableNames =
      index === 0 ? (batch.names ?? []).slice(12) : (batch.names ?? []);
    assert(sortedUnique(sortableNames), `${id} names are not sorted`, failures);
    plannedNames.push(...(batch.names ?? []));
  }
  assert(
    JSON.stringify(plan.batches?.[0]?.names?.slice(0, 12)) ===
      JSON.stringify(benchmarkNames),
    "batch-01 benchmark prefix is invalid",
    failures,
  );
  assert(
    new Set(plannedNames).size === 1024,
    "release plan names must be globally unique",
    failures,
  );
  const ownNames = new Set(
    (catalog.icons ?? [])
      .filter((icon) => icon.source === "miaixz")
      .map((icon) => icon.name),
  );
  assert(
    ownNames.size === 1024,
    "catalog must contain exactly 1024 Miaixz names",
    failures,
  );
  assert(
    [...ownNames].every((name) => plannedNames.includes(name)) &&
      plannedNames.every((name) => ownNames.has(name)),
    "release plan and Miaixz catalog names differ",
    failures,
  );
  assert(
    briefNames.size === 1024 &&
      plannedNames.every((name) => briefNames.has(name)),
    "release plan and design brief names differ",
    failures,
  );
  const catalogByName = new Map(
    (catalog.icons ?? []).map((icon) => [icon.name, icon]),
  );
  const briefByName = new Map(
    (briefs.icons ?? []).map((brief) => [brief.name, brief]),
  );
  for (const name of plannedNames) {
    const icon = catalogByName.get(name);
    const brief = briefByName.get(name);
    assert(
      icon?.source === "miaixz" && ["core", "extended"].includes(icon?.tier),
      `planned icon is not eligible: ${name}`,
      failures,
    );
    if (icon === undefined || brief === undefined) continue;
    assert(
      brief.rtl === icon.rtl,
      `brief rtl differs from catalog: ${name}`,
      failures,
    );
    const declaredSizes = new Set(Object.values(icon.variants).flat());
    assert(
      typeof brief.outlineTreatment === "string" &&
        icon.variants.outline?.includes("standard"),
      `outline treatment differs from catalog: ${name}`,
      failures,
    );
    assert(
      (icon.variants.filled === undefined) === (brief.filledTreatment === null),
      `filled treatment differs from catalog: ${name}`,
      failures,
    );
    assert(
      !declaredSizes.has("compact") === (brief.compactTreatment === null),
      `compact treatment differs from catalog: ${name}`,
      failures,
    );
    assert(
      !declaredSizes.has("display") === (brief.displayTreatment === null),
      `display treatment differs from catalog: ${name}`,
      failures,
    );
  }
  for (const icon of catalog.icons ?? []) {
    if (icon.status === "deprecated") {
      const replacement = catalogByName.get(icon.replacement);
      assert(
        replacement?.status === "stable",
        `deprecated replacement is not stable: ${icon.name}`,
        failures,
      );
    }
  }
  const stableOwnNames = (catalog.icons ?? [])
    .filter((icon) => icon.source === "miaixz" && icon.status === "stable")
    .map((icon) => icon.name);
  if (plan.state === "planned") {
    assert(
      stableOwnNames.length === 0,
      "planned release cannot contain stable Miaixz icons",
      failures,
    );
  } else if (plan.state === "complete") {
    assert(
      stableOwnNames.length === 1024 &&
        stableOwnNames.every((name) => plannedNames.includes(name)),
      "complete release must make all planned icons stable",
      failures,
    );
  } else {
    const stable = new Set(stableOwnNames);
    const prefixLengths = [
      12,
      ...Array.from({ length: 16 }, (_, index) => (index + 1) * 64),
    ];
    assert(
      prefixLengths.some(
        (length) =>
          stable.size === length &&
          plannedNames.slice(0, length).every((name) => stable.has(name)),
      ),
      "production stable set must be a legal release-plan prefix",
      failures,
    );
  }
  const fixture = readJson(
    resolve(
      target.repositoryRoot,
      "packages/icons/tests/fixtures/icon-names-0.6.5.json",
    ),
  );
  const publicNames = new Set([...canonical, ...aliases]);
  assert(
    Array.isArray(fixture) &&
      fixture.length === 1780 &&
      fixture.every((name) => publicNames.has(name)),
    "legacy fixture is not fully represented by canonical names or aliases",
    failures,
  );
  const coreUsage = scanCoreIconNames(target.repositoryRoot).map(
    ([name]) => name,
  );
  const byName = catalogByName;
  const aliasTarget = new Map(
    (catalog.icons ?? []).flatMap((icon) =>
      (icon.aliases ?? []).map((alias) => [alias, icon]),
    ),
  );
  for (const name of coreUsage) {
    const icon = byName.get(name) ?? aliasTarget.get(name);
    assert(
      icon !== undefined,
      `core usage is not in catalog: ${name}`,
      failures,
    );
    assert(
      icon?.source === "miaixz" && icon?.tier === "core",
      `core usage is not Miaixz core: ${name}`,
      failures,
    );
  }
  if (failures.length > 0) throw new Error(failures.sort().join("\n"));
  return Object.freeze({ catalog, briefs, plan, coreUsage });
}

/**
 * Verifies required and forbidden core package directories.
 *
 * @param {{repositoryRoot: string}} target - Target metadata.
 * @returns {void}
 */
function validateStructure(target) {
  const root = resolve(target.repositoryRoot, "packages/icons");
  const required = [
    "src/assets",
    "src/components",
    "src/definitions",
    "src/runtime",
    "src/styles",
    "tests/components",
    "tests/definitions",
    "tests/fixtures",
    "tests/package",
    "tests/runtime",
  ];
  const missing = required.filter((path) => !existsSync(resolve(root, path)));
  if (missing.length > 0)
    throw new Error(`Missing icon-system paths: ${missing.join(", ")}`);
  for (const forbidden of ["scripts", "spec"]) {
    if (existsSync(resolve(root, forbidden)))
      throw new Error(`Forbidden package path: ${forbidden}`);
  }
}

/**
 * Recursively lists files below one asset directory.
 *
 * @param {string} directory Directory to traverse.
 * @returns {string[]} Absolute file paths.
 */
function listAssetFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? listAssetFiles(path) : [path];
  });
}

/**
 * Validates one coordinate against the frozen grid and boundary.
 *
 * @param {number} value Coordinate value.
 * @param {string} label Diagnostic label.
 * @param {string[]} failures Failure accumulator.
 * @returns {void}
 */
function validateCoordinate(value, label, failures) {
  assert(Number.isFinite(value), `${label} is not finite`, failures);
  assert(value >= 2 && value <= 22, `${label} exceeds [2, 22]`, failures);
  assert(
    Math.abs(value * 4 - Math.round(value * 4)) < 1e-9,
    `${label} is not on the 0.25 grid`,
    failures,
  );
}

/**
 * Calculates and validates the geometry bounds and complexity of one definition.
 *
 * @param {any} definition Normalized icon definition.
 * @param {string} label Diagnostic label.
 * @param {string[]} failures Failure accumulator.
 * @returns {void}
 */
function validateDefinitionGeometry(definition, label, failures) {
  let pathCommands = 0;
  for (const [nodeIndex, node] of definition.nodes.entries()) {
    const nodeLabel = `${label}:node[${nodeIndex}]`;
    const attributes = node.attributes;
    if (node.tag === "path") {
      try {
        const path = new SVGPathData(attributes.d);
        pathCommands += path.commands.length;
        assert(
          attributes.d.length <= 8192,
          `${nodeLabel} path is too long`,
          failures,
        );
        const [minimumX, minimumY, maximumX, maximumY] = svgPathBbox(
          attributes.d,
        );
        for (const [name, value] of [
          ["minimumX", minimumX],
          ["minimumY", minimumY],
          ["maximumX", maximumX],
          ["maximumY", maximumY],
        ]) {
          assert(
            Number.isFinite(value) && value >= 2 && value <= 22,
            `${nodeLabel}.${name} exceeds [2, 22]`,
            failures,
          );
        }
        for (const command of path.commands) {
          for (const [name, value] of Object.entries(command)) {
            if (
              name === "type" ||
              name === "relative" ||
              typeof value !== "number"
            )
              continue;
            if (["largeArc", "sweep"].includes(name)) continue;
            assert(
              Math.abs(value * 4 - Math.round(value * 4)) < 1e-9,
              `${nodeLabel}.${name} is not on the 0.25 grid`,
              failures,
            );
          }
        }
      } catch (error) {
        failures.push(`${nodeLabel} has invalid path data: ${String(error)}`);
      }
      continue;
    }
    if (node.tag === "circle") {
      const cx = Number(attributes.cx);
      const cy = Number(attributes.cy);
      const radius = Number(attributes.r);
      for (const [name, value] of [
        ["left", cx - radius],
        ["right", cx + radius],
        ["top", cy - radius],
        ["bottom", cy + radius],
      ]) {
        validateCoordinate(value, `${nodeLabel}.${name}`, failures);
      }
      continue;
    }
    if (node.tag === "ellipse") {
      const cx = Number(attributes.cx);
      const cy = Number(attributes.cy);
      const rx = Number(attributes.rx);
      const ry = Number(attributes.ry);
      for (const [name, value] of [
        ["left", cx - rx],
        ["right", cx + rx],
        ["top", cy - ry],
        ["bottom", cy + ry],
      ]) {
        validateCoordinate(value, `${nodeLabel}.${name}`, failures);
      }
      continue;
    }
    if (node.tag === "line") {
      for (const name of ["x1", "x2", "y1", "y2"])
        validateCoordinate(
          Number(attributes[name]),
          `${nodeLabel}.${name}`,
          failures,
        );
      continue;
    }
    if (node.tag === "rect") {
      const x = Number(attributes.x);
      const y = Number(attributes.y);
      const width = Number(attributes.width);
      const height = Number(attributes.height);
      for (const [name, value] of [
        ["left", x],
        ["right", x + width],
        ["top", y],
        ["bottom", y + height],
      ]) {
        validateCoordinate(value, `${nodeLabel}.${name}`, failures);
      }
      continue;
    }
    const points = String(attributes.points)
      .trim()
      .split(/[\s,]+/u)
      .map(Number);
    assert(
      points.length >= 4 && points.length % 2 === 0,
      `${nodeLabel} points are invalid`,
      failures,
    );
    for (let index = 0; index < points.length; index += 1) {
      validateCoordinate(
        points[index],
        `${nodeLabel}.points[${index}]`,
        failures,
      );
    }
  }
  assert(pathCommands <= 256, `${label} exceeds 256 path commands`, failures);
}

/**
 * Validates exact SVG-to-catalog mapping, safety, geometry, and uniqueness.
 *
 * @param {{repositoryRoot: string}} target Target metadata.
 * @returns {void}
 */
function validateSvg(target) {
  const root = assetRoot(target);
  const catalog = readJson(resolve(root, "catalog.json"));
  const expected = new Set();
  const expectedByPath = new Map();
  for (const icon of catalog.icons) {
    if (
      icon.source !== "miaixz" ||
      !["stable", "deprecated"].includes(icon.status)
    )
      continue;
    for (const [variant, sizes] of Object.entries(icon.variants)) {
      for (const size of sizes) {
        const path = `${variant}/${size}/${icon.name}.svg`;
        expected.add(path);
        expectedByPath.set(path, { icon, variant });
      }
    }
  }
  const svgRoot = resolve(root, "svg");
  const assetFiles = listAssetFiles(svgRoot).map((path) =>
    relative(svgRoot, path),
  );
  const actual = assetFiles.filter((path) => path.endsWith(".svg"));
  const failures = [];
  for (const path of assetFiles) {
    assert(
      path.endsWith(".svg") || path.endsWith(".gitkeep"),
      `unexpected SVG asset: ${path}`,
      failures,
    );
  }
  for (const path of expected)
    assert(actual.includes(path), `missing SVG: ${path}`, failures);
  for (const path of actual)
    assert(expected.has(path), `unexpected SVG: ${path}`, failures);
  const digests = new Map();
  for (const path of actual.sort()) {
    const metadata = expectedByPath.get(path);
    if (!metadata) continue;
    const absolute = resolve(svgRoot, path);
    const source = readFileSync(absolute, "utf8");
    try {
      const definition = parseIconSvg(source, metadata.variant, path, "miaixz");
      validateDefinitionGeometry(definition, path, failures);
      if (metadata.variant === "outline" && path.includes("/standard/")) {
        const digest = createHash("sha256")
          .update(JSON.stringify(definition))
          .digest("hex");
        const previous = digests.get(digest);
        assert(
          previous === undefined,
          `duplicate normalized geometry: ${path} and ${previous}`,
          failures,
        );
        digests.set(digest, path);
      }
    } catch (error) {
      failures.push(
        `${path}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  if (failures.length > 0) throw new Error(failures.sort().join("\n"));
}

/**
 * Verifies one provider package identity and dependency boundary.
 *
 * @param {{repositoryRoot: string}} target - Target metadata.
 * @param {string} provider - Frozen provider identifier.
 * @returns {void}
 */
function validateProvider(target, provider) {
  const root = resolve(target.repositoryRoot, `providers/icons-${provider}`);
  const manifest = readJson(resolve(root, "package.json"));
  const failures = [];
  assert(
    manifest.name === `@miaixz/icons-${provider}`,
    `Invalid provider package name: ${manifest.name}`,
    failures,
  );
  assert(
    manifest.version === "0.6.5",
    `${manifest.name} version must be 0.6.5`,
    failures,
  );
  assert(
    manifest.peerDependencies?.["@miaixz/icons"] === "^0.6.5",
    `${manifest.name} must declare the frozen @miaixz/icons peer range`,
    failures,
  );
  assert(
    manifest.dependencies?.["@miaixz/icons"] === undefined,
    `${manifest.name} must not depend on @miaixz/icons`,
    failures,
  );
  assert(
    manifest.devDependencies?.["@miaixz/icons"] === "0.6.5",
    `${manifest.name} must use the exact core development version`,
    failures,
  );
  assert(
    existsSync(resolve(root, "LICENSE")),
    `${manifest.name} LICENSE is missing`,
    failures,
  );
  assert(
    existsSync(resolve(root, "NOTICE")),
    `${manifest.name} NOTICE is missing`,
    failures,
  );
  const notice = existsSync(resolve(root, "NOTICE"))
    ? readFileSync(resolve(root, "NOTICE"), "utf8")
    : "";
  assert(
    notice.includes("Miaixz provider package"),
    `${manifest.name} NOTICE header is missing`,
    failures,
  );
  const indexSource = readFileSync(resolve(root, "src/index.ts"), "utf8");
  assert(
    indexSource.includes('export * from "@miaixz/icons"'),
    `${manifest.name} must re-export the core root`,
    failures,
  );
  for (const forbidden of ["autogen", "scripts", "spec"]) {
    if (existsSync(resolve(root, forbidden)))
      failures.push(`Forbidden provider path: ${forbidden}`);
  }
  if (provider === "iconify") {
    assert(
      !existsSync(resolve(root, "provider.config.json")),
      "Iconify must not bind a provider config",
      failures,
    );
    for (const name of ["@iconify/utils", "saxes"]) {
      const expectedVersion = manifest.dependencies?.[name];
      assert(
        exactSemverPattern.test(expectedVersion ?? ""),
        `${name} must use an exact runtime version`,
        failures,
      );
      const installed = readJson(
        resolve(target.repositoryRoot, "node_modules", name, "package.json"),
      );
      assert(
        installed.version === expectedVersion,
        `${name} installed version does not match ${expectedVersion}`,
        failures,
      );
      assert(
        notice.includes(`${name}@${expectedVersion}`),
        `${manifest.name} NOTICE omits ${name}@${expectedVersion}`,
        failures,
      );
    }
    for (const forbidden of [
      "src/mapping.ts",
      "src/manifest.ts",
      "src/generation-report.json",
    ]) {
      assert(
        !existsSync(resolve(root, forbidden)),
        `Iconify must not contain ${forbidden}`,
        failures,
      );
    }
  } else {
    const config = readJson(resolve(root, "provider.config.json"));
    const report = readJson(resolve(root, "src/generation-report.json"));
    const catalog = readJson(
      resolve(target.repositoryRoot, "packages/icons/src/assets/catalog.json"),
    );
    const catalogNames = new Set(catalog.icons.map((entry) => entry.name));
    assert(
      config.id === provider,
      `${manifest.name} config id is stale`,
      failures,
    );
    assert(
      config.packageName === manifest.name,
      `${manifest.name} config packageName is stale`,
      failures,
    );
    assert(
      config.reviewedOn === "2026-09-26",
      `${manifest.name} review date is not frozen`,
      failures,
    );
    assert(
      report.provider === provider,
      `${manifest.name} generation report is stale`,
      failures,
    );
    assert(
      report.mappedCanonicalNames + report.unsupportedCanonicalNames ===
        catalog.icons.length,
      `${manifest.name} report does not partition the catalog`,
      failures,
    );
    const mappingSource = readFileSync(resolve(root, "src/mapping.ts"), "utf8");
    const mappingStart =
      mappingSource.indexOf("Object.freeze(") + "Object.freeze(".length;
    const mappingEnd = mappingSource.lastIndexOf(");");
    const mapping = JSON.parse(mappingSource.slice(mappingStart, mappingEnd));
    assert(
      Object.keys(mapping).length === report.mappedCanonicalNames,
      `${manifest.name} mapping count is stale`,
      failures,
    );
    const unsupported = new Set(config.unsupported);
    for (const [name, variantsByName] of Object.entries(mapping)) {
      assert(
        catalogNames.has(name),
        `${manifest.name} maps unknown name ${name}`,
        failures,
      );
      assert(
        !unsupported.has(name),
        `${manifest.name} maps unsupported name ${name}`,
        failures,
      );
      for (const [variant, targetName] of Object.entries(variantsByName)) {
        const [shardId, ...targetParts] = targetName.split("/");
        const shardPath = resolve(root, `src/shard-${shardId}.ts`);
        assert(
          existsSync(shardPath),
          `${manifest.name} mapping references missing shard ${shardId}`,
          failures,
        );
        if (existsSync(shardPath)) {
          const shardSource = readFileSync(shardPath, "utf8");
          assert(
            shardSource.includes(
              `${JSON.stringify(`${targetParts.join("/")}:${variant}`)}:`,
            ),
            `${manifest.name} mapping target is missing: ${name}/${variant}`,
            failures,
          );
        }
      }
    }
    for (const name of unsupported) {
      assert(
        catalogNames.has(name),
        `${manifest.name} unsupported list contains unknown name ${name}`,
        failures,
      );
    }
    const compactMappingBytes =
      Buffer.byteLength(JSON.stringify(mapping)) +
      Buffer.byteLength(
        readFileSync(resolve(root, "src/manifest.ts"), "utf8").replaceAll(
          /\s+/gu,
          "",
        ),
      );
    assert(
      compactMappingBytes <= 184320,
      `${manifest.name} mapping and manifest exceed 184320 bytes`,
      failures,
    );
    for (const shardPath of readdirSync(resolve(root, "src")).filter((name) =>
      /^shard-.+\.ts$/u.test(name),
    )) {
      const shardSource = readFileSync(resolve(root, "src", shardPath), "utf8");
      const definitionsMarker =
        "definitions: Readonly<Record<string, EncodedDefinition>> = Object.freeze(";
      const start =
        shardSource.indexOf(definitionsMarker) + definitionsMarker.length;
      const end = shardSource.lastIndexOf(");");
      const compactBytes = Buffer.byteLength(
        JSON.stringify(JSON.parse(shardSource.slice(start, end))),
      );
      assert(
        compactBytes <= 184320,
        `${manifest.name} ${shardPath} exceeds 184320 bytes`,
        failures,
      );
    }
    for (const sourcePackage of config.sourcePackages) {
      const expectedVersion = manifest.devDependencies?.[sourcePackage];
      assert(
        exactSemverPattern.test(expectedVersion ?? ""),
        `${sourcePackage} must use an exact source version`,
        failures,
      );
      const installed = readJson(
        resolve(
          target.repositoryRoot,
          "node_modules",
          sourcePackage,
          "package.json",
        ),
      );
      assert(
        installed.version === expectedVersion,
        `${sourcePackage} installed version does not match ${expectedVersion}`,
        failures,
      );
      assert(
        notice.includes(`${sourcePackage}@${expectedVersion}`),
        `${manifest.name} NOTICE omits ${sourcePackage}@${expectedVersion}`,
        failures,
      );
    }
  }
  if (failures.length > 0) throw new Error(failures.sort().join("\n"));
}

/**
 * Runs the requested icon validation scope.
 *
 * @param {string[]} argv - Command-line arguments without executable and script path.
 * @param {string} cwd - Target package working directory.
 * @returns {{cwd: string, manifest: any, repositoryRoot: string}} Validated target metadata.
 */
export function run(argv = process.argv.slice(2), cwd = process.cwd()) {
  const options = parseArguments(argv);
  const target = resolveTarget(cwd, options.provider);
  const selected =
    options.scope === "all"
      ? ["structure", "catalog", "svg", "package"]
      : [options.scope];
  for (const scope of selected) {
    if (scope === "structure") validateStructure(target);
    else if (scope === "catalog") validateCatalog(target);
    else if (scope === "provider") validateProvider(target, options.provider);
    else if (scope === "svg") validateSvg(target);
    else if (scope === "package" && target.manifest.name === "@miaixz/icons") {
      const plan = readJson(
        resolve(target.cwd, "src/assets/release-plan.json"),
      );
      if (plan.state !== "complete")
        throw new Error("@miaixz/icons cannot be public before state=complete");
    }
  }
  return target;
}

if (resolve(process.argv[1] ?? "") === scriptPath) {
  try {
    const target = run();
    console.log(`Icon validation passed for ${target.manifest.name}.`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

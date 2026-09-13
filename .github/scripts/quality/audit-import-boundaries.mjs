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

import { parse } from "@babel/parser";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../../..", import.meta.url));
const sdkSourceRoot = path.join(repositoryRoot, "sdk", "src");
const uiSourceRoot = path.join(repositoryRoot, "ui", "src");
const violations = [];
const componentRanks = new Map(
  Object.entries({
    0: "avatar badge bar brand breadcrumb checkbox cluster columns descriptions divider donut empty entry field grid header hidden icon input list page panel popover pressable progress radio range scroll sections sidebar skeleton sparkline split stack status steps switch table tabs textarea timeline toolbar tooltip",
    1: "button combobox dialog drawer dropdown dropzone editor heatmap metrics pagination select spinner tree",
    2: "action navigation overlay picker shell",
    3: "datagrid graph search toast view feedback",
    4: "alert locale notice toaster",
    5: "confirm",
    6: "upload",
  }).flatMap(([rank, names]) => names.split(" ").map((name) => [name, Number(rank)])),
);

/*
 * Returns every TypeScript source below a directory in stable order.
 */
function listSourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) return listSourceFiles(target);
      return /\.(?:ts|tsx)$/.test(entry.name) ? [target] : [];
    })
    .sort();
}

/*
 * Resolves the repository's NodeNext-style relative `.js` source imports.
 */
function resolveSourceImport(specifier, importer) {
  if (!specifier.startsWith(".") || !specifier.endsWith(".js")) return undefined;
  const target = path.resolve(path.dirname(importer), specifier.slice(0, -3));
  return [`${target}.ts`, `${target}.tsx`, `${target}.d.ts`].find(existsSync);
}

/*
 * Returns all static relative import and re-export edges in one source file.
 */
function readEdges(file) {
  const program = parse(readFileSync(file, "utf8"), {
    sourceType: "module",
    plugins: ["typescript", "jsx"],
  }).program;
  const edges = [];
  for (const statement of program.body) {
    if (
      statement.type !== "ImportDeclaration" &&
      statement.type !== "ExportNamedDeclaration" &&
      statement.type !== "ExportAllDeclaration"
    ) {
      continue;
    }
    const specifier = statement.source?.value;
    if (typeof specifier !== "string") continue;
    const target = resolveSourceImport(specifier, file);
    const typeOnly =
      statement.importKind === "type" ||
      statement.exportKind === "type" ||
      (statement.type === "ImportDeclaration" &&
        statement.specifiers.length > 0 &&
        statement.specifiers.every(
          (importSpecifier) =>
            importSpecifier.type === "ImportSpecifier" && importSpecifier.importKind === "type",
        ));
    edges.push({ specifier, target, typeOnly });
  }
  return edges;
}

/*
 * Produces a stable repository-relative path for diagnostics.
 */
function relative(file) {
  return path.relative(repositoryRoot, file).replaceAll(path.sep, "/");
}

/*
 * Classifies one UI source according to the sole D0/D1/C0-C6/P0 table.
 */
function classifyUi(file) {
  const source = relative(file).replace(/^ui\/src\//, "");
  if (
    source === "components/shared.types.ts" ||
    source === "shared/class-names.ts" ||
    source.startsWith("design/") ||
    source.startsWith("errors/") ||
    (source.startsWith("icons/") && source !== "icons/index.ts")
  ) {
    return { kind: "D0" };
  }
  if (
    source.startsWith("accessibility/") ||
    source.startsWith("i18n/") ||
    source.startsWith("theme/") ||
    source.startsWith("shared/")
  ) {
    return { kind: "D1" };
  }
  if (source.startsWith("patterns/")) return { kind: "P0" };
  if (source.startsWith("components/diagram/graph/")) {
    return { kind: "component", component: "graph", rank: 3 };
  }
  if (source.startsWith("components/")) {
    const component = source.split("/")[1];
    if (component === "index.ts") return { kind: "entry" };
    const rank = componentRanks.get(component);
    return rank === undefined
      ? { kind: "unclassified", component }
      : { kind: "component", component, rank };
  }
  if (
    source === "index.ts" ||
    source === "appearance.ts" ||
    source === "design/index.ts" ||
    source === "icons/index.ts"
  ) {
    return { kind: "entry" };
  }
  return { kind: "unclassified", component: source.split("/")[0] };
}

/*
 * Records package and UI layer violations for a single dependency edge.
 */
function auditEdge(source, edge) {
  if (edge.target === undefined) {
    if (
      source.startsWith(sdkSourceRoot) &&
      (/^@miaixz\/ui(?:\/|$)/.test(edge.specifier) ||
        /^react(?:-dom)?(?:\/|$)/.test(edge.specifier))
    ) {
      violations.push(`${relative(source)} imports forbidden SDK dependency ${edge.specifier}`);
    }
    return;
  }
  if (path.basename(source) !== "index.ts" && path.basename(edge.target) === "index.ts") {
    violations.push(`${relative(source)} imports internal barrel ${relative(edge.target)}`);
  }
  if (!source.startsWith(uiSourceRoot) || !edge.target.startsWith(uiSourceRoot)) return;
  const from = classifyUi(source);
  const to = classifyUi(edge.target);
  if (from.kind === "unclassified") return;
  if (to.kind === "unclassified") {
    violations.push(`${relative(edge.target)} belongs to unclassified UI source ${to.component}`);
    return;
  }
  if (from.kind === "D0" && to.kind !== "D0" && to.kind !== "entry") {
    violations.push(
      `${relative(source)} (${from.kind}) cannot depend on ${relative(edge.target)} (${to.kind})`,
    );
  }
  if (from.kind === "D1" && to.kind === "component") {
    const componentTypeLeaf = /\/components\/(?:diagram\/graph|[^/]+)\/[^/]+\.types\.ts$/.test(
      edge.target.replaceAll(path.sep, "/"),
    );
    if (relative(source) !== "ui/src/theme/components.ts" || !edge.typeOnly || !componentTypeLeaf) {
      violations.push(`${relative(source)} (D1) cannot depend on ${relative(edge.target)}`);
    }
  }
  if (from.kind === "D1" && to.kind === "P0") {
    const allowed =
      relative(source) === "ui/src/theme/components.ts" &&
      relative(edge.target) === "ui/src/patterns/appearance/appearance.types.ts" &&
      edge.typeOnly;
    if (!allowed) {
      violations.push(`${relative(source)} (D1) cannot depend on pattern ${relative(edge.target)}`);
    }
  }
  if (from.kind === "component" && to.kind === "P0") {
    violations.push(`${relative(source)} cannot depend upward on pattern ${relative(edge.target)}`);
  }
  if (
    from.kind === "component" &&
    to.kind === "component" &&
    from.component !== to.component &&
    to.rank >= from.rank
  ) {
    violations.push(
      `${relative(source)} (C${from.rank}) cannot depend on ${relative(edge.target)} (C${to.rank})`,
    );
  }
}

/*
 * Returns strongly connected components containing more than one file.
 */
function findCycles(graph) {
  let nextIndex = 0;
  const indices = new Map();
  const lowLinks = new Map();
  const stack = [];
  const stacked = new Set();
  const cycles = [];
  function visit(node) {
    indices.set(node, nextIndex);
    lowLinks.set(node, nextIndex);
    nextIndex += 1;
    stack.push(node);
    stacked.add(node);
    for (const target of graph.get(node) ?? []) {
      if (!indices.has(target)) {
        visit(target);
        lowLinks.set(node, Math.min(lowLinks.get(node), lowLinks.get(target)));
      } else if (stacked.has(target)) {
        lowLinks.set(node, Math.min(lowLinks.get(node), indices.get(target)));
      }
    }
    if (lowLinks.get(node) !== indices.get(node)) return;
    const component = [];
    let current;
    do {
      current = stack.pop();
      stacked.delete(current);
      component.push(current);
    } while (current !== node);
    if (component.length > 1) cycles.push(component.sort());
  }
  for (const node of [...graph.keys()].sort()) if (!indices.has(node)) visit(node);
  return cycles;
}

const sourceFiles = [...listSourceFiles(sdkSourceRoot), ...listSourceFiles(uiSourceRoot)];
const graph = new Map(sourceFiles.map((file) => [file, new Set()]));
for (const source of sourceFiles) {
  const classification = source.startsWith(uiSourceRoot) ? classifyUi(source) : undefined;
  if (classification?.kind === "unclassified") {
    violations.push(
      `${relative(source)} belongs to unclassified UI source ${classification.component}`,
    );
  }
  for (const edge of readEdges(source)) {
    auditEdge(source, edge);
    if (edge.target !== undefined && graph.has(edge.target)) graph.get(source).add(edge.target);
  }
}
for (const cycle of findCycles(graph)) {
  violations.push(`dependency cycle: ${cycle.map(relative).join(" -> ")}`);
}
if (violations.length > 0) {
  console.error(violations.map((violation) => `- ${violation}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Import boundaries verified across ${sourceFiles.length} source files.`);
}

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

import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { parse } from "@babel/parser";
import { loadWorkspaceRepository, repositoryRoot } from "../miaixz.mjs";

const repository = loadWorkspaceRepository();
const { rootManifest } = repository;
const uiWorkspace = repository.workspaces.find(({ name }) => name === "@miaixz/ui");
const sdkWorkspace = repository.workspaces.find(({ name }) => name === "@miaixz/sdk");
const viewWorkspace = repository.workspaces.find(({ name }) => name === "@miaixz/view");
if (uiWorkspace === undefined || sdkWorkspace === undefined || viewWorkspace === undefined) {
  throw new Error("The SDK, UI, and View workspace manifests are required.");
}
const sdkReadmePath = `${sdkWorkspace.directory}/README.md`;
const uiReadmePath = `${uiWorkspace.directory}/README.md`;
const viewReadmePath = `${viewWorkspace.directory}/README.md`;
const rootScripts = rootManifest.scripts ?? {};
const registrySource = readFileSync(resolve(uiWorkspace.rootPath, "src/theme/registry.ts"), "utf8");
const failures = [];
const readmes = new Map(
  ["README.md", ...repository.workspaces.map(({ directory }) => `${directory}/README.md`)].map(
    (file) => [file, readFileSync(resolve(repositoryRoot, file), "utf8")],
  ),
);

if (Object.values(rootScripts).some((script) => /--workspaces\s+--if-present/u.test(script))) {
  failures.push("root package scripts must not use --workspaces --if-present");
}
auditScriptTargets(repositoryRoot, rootScripts, "package.json", failures);

const ast = parse(registrySource, {
  sourceType: "module",
  plugins: ["typescript"],
});
const declaration = ast.program.body.find(
  (node) =>
    node.type === "ExportNamedDeclaration" &&
    node.declaration?.type === "TSInterfaceDeclaration" &&
    node.declaration.id.name === "MiaixzThemeComponentRegistry",
)?.declaration;
if (declaration?.type !== "TSInterfaceDeclaration") {
  failures.push("MiaixzThemeComponentRegistry interface is missing");
}
const registryNames =
  declaration?.type === "TSInterfaceDeclaration"
    ? declaration.body.body.map((member) =>
        member.key.type === "Identifier" ? member.key.name : String(member.key.value),
      )
    : [];

const calls = new Map();
for (const file of walk(resolve(uiWorkspace.rootPath, "src")).filter((path) =>
  path.endsWith(".tsx"),
)) {
  const source = readFileSync(file, "utf8");
  for (const match of source.matchAll(/withMiaixzThemeComponent\(\s*"([A-Z][A-Za-z0-9]+)"/gu)) {
    calls.set(match[1], (calls.get(match[1]) ?? 0) + 1);
  }
  for (const match of source.matchAll(
    /useMiaixzThemeComponent\("(Button|Input|Select|Dialog)"\)/gu,
  )) {
    calls.set(match[1], (calls.get(match[1]) ?? 0) + 1);
  }
}
for (const name of registryNames) {
  const count = calls.get(name) ?? 0;
  if (count !== 1) failures.push(`${name} must have exactly one Theme consumer; found ${count}`);
}
for (const name of calls.keys())
  if (!registryNames.includes(name)) failures.push(`unregistered Theme consumer: ${name}`);

const protocolSource = readFileSync(
  resolve(sdkWorkspace.rootPath, "src/contracts/module-manifest.ts"),
  "utf8",
);
const protocolVersion = /MIAIXZ_MODULE_PROTOCOL_VERSION\s*=\s*"([^"]+)"/u.exec(protocolSource)?.[1];
if (
  protocolVersion === undefined ||
  !readmes.get(sdkReadmePath)?.includes(`Host Bridge protocol version is \`${protocolVersion}\``)
) {
  failures.push("SDK README Host Bridge protocol version is not aligned with its constant");
}
if (/\b\d+\.\d+\.x\b[^\n]*development line/iu.test(readmes.get(sdkReadmePath) ?? "")) {
  failures.push("SDK README must not hard-code a development-line version");
}
const uiReadme = readmes.get(uiReadmePath) ?? "";
if (/\bselected\s*:/u.test(uiReadme)) {
  failures.push("UI README NavigationRail examples must use current and textValue, not selected");
}
if (!/\bcurrent:\s*"page"/u.test(uiReadme) || !/\btextValue:/u.test(uiReadme)) {
  failures.push("UI README NavigationRail examples must show current and textValue");
}
if (/--no-package-lock/u.test(readmes.get("README.md") ?? "")) {
  failures.push("root README must use the committed npm package lock");
}
if (/npm install[^\n]*\blucide(?:-react)?\b/iu.test(uiReadme)) {
  failures.push("UI README must not require consumers to install Lucide");
}
const rootReadme = readmes.get("README.md") ?? "";
const viewReadme = readmes.get(viewReadmePath) ?? "";
if (
  !rootReadme.includes("@miaixz/ui/view") ||
  !rootReadme.includes("@miaixz/view") ||
  rootReadme.indexOf('import "@miaixz/ui/styles.css"') >
    rootReadme.indexOf('import "@miaixz/view/styles.css"')
) {
  failures.push(
    "root README must distinguish page layout from previews and import UI styles first",
  );
}
if (
  !viewReadme.includes("MiaixzLocaleProvider") ||
  !viewReadme.includes("<Theme") ||
  !viewReadme.includes("<FileView")
) {
  failures.push("View README must show the complete locale, Theme, and FileView structure");
}
for (const workspace of repository.workspaces) {
  const { directory, manifest } = workspace;
  auditPublicEntryTable(directory, manifest, readmes.get(`${directory}/README.md`) ?? "", failures);
  auditWorkspaceConfiguration(workspace, failures);
}
auditReadmeCompileBlocks(readmes, failures);

if (failures.length > 0) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log(`${registryNames.length} Theme registry consumers are aligned.`);
}

/**
 * Recursively lists every file below a directory.
 *
 * @param {string} directory Absolute directory to traverse.
 * @returns {string[]} Absolute file paths in the traversed directory tree.
 */
function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

/**
 * Compares one package README entry table with its manifest export map.
 *
 * @param {string} directory Workspace directory.
 * @param {object} manifest Parsed workspace package manifest.
 * @param {string} readme README source.
 * @param {string[]} findings Mutable failure list.
 * @returns {void}
 */
function auditPublicEntryTable(directory, manifest, readme, findings) {
  const section = /## Public entries\n([\s\S]*?)(?=\n## |$)/u.exec(readme)?.[1] ?? "";
  const documented = new Map(
    [...section.matchAll(/^\|[ \t]*`([^`]+)`[ \t]*\|[ \t]*(JavaScript|CSS)[ \t]*\|$/gmu)].map(
      (match) => [match[1], match[2]],
    ),
  );
  const expected = new Map(
    Object.entries(manifest.exports).map(([entry, target]) => [
      entry,
      typeof target === "string" ? "CSS" : "JavaScript",
    ]),
  );
  if (JSON.stringify([...documented]) !== JSON.stringify([...expected])) {
    findings.push(`${directory}/README.md public entry table does not match package exports`);
  }
}

/**
 * Validates one workspace manifest against files, exports, scripts, and ATTW exclusions on disk.
 *
 * @param {object} workspace Loaded workspace record.
 * @param {string[]} findings Mutable failure list.
 * @returns {void}
 */
function auditWorkspaceConfiguration(workspace, findings) {
  const { directory, manifest, rootPath } = workspace;
  const exports = manifest.exports;
  if (exports === null || typeof exports !== "object" || Array.isArray(exports)) {
    findings.push(`${directory}/package.json must define an exports object`);
    return;
  }

  for (const file of manifest.files ?? []) {
    if (file === "dist") continue;
    if (!existsSync(resolve(rootPath, file))) {
      findings.push(`${directory}/package.json files entry does not exist: ${file}`);
    }
  }

  const rootExport = exports["."];
  if (rootExport === null || typeof rootExport !== "object" || Array.isArray(rootExport)) {
    findings.push(`${directory}/package.json must define a JavaScript root export`);
  } else {
    if (manifest.main !== rootExport.import) {
      findings.push(`${directory}/package.json main does not match exports["."].import`);
    }
    if (manifest.types !== rootExport.types) {
      findings.push(`${directory}/package.json types does not match exports["."].types`);
    }
  }

  for (const [entry, value] of Object.entries(exports)) {
    const targets = typeof value === "string" ? [value] : Object.values(value);
    for (const target of targets) {
      if (typeof target !== "string" || !target.startsWith("./dist/")) {
        findings.push(`${directory}/package.json export ${entry} has an invalid target`);
        continue;
      }
      if (!hasExportSource(rootPath, target)) {
        findings.push(`${directory}/package.json export ${entry} has no source for ${target}`);
      }
    }
  }

  const expectedCssExclusions = Object.entries(exports)
    .filter(([, target]) => typeof target === "string" && target.endsWith(".css"))
    .map(([entry]) => entry.replace(/^\.\//u, ""))
    .sort();
  const attwPath = resolve(rootPath, ".attw.json");
  if (!existsSync(attwPath)) {
    findings.push(`${directory}/.attw.json is missing`);
  } else {
    const attw = JSON.parse(readFileSync(attwPath, "utf8"));
    const actualCssExclusions = [...(attw.excludeEntrypoints ?? [])].sort();
    if (JSON.stringify(actualCssExclusions) !== JSON.stringify(expectedCssExclusions)) {
      findings.push(`${directory}/.attw.json CSS exclusions do not match package exports`);
    }
  }

  auditScriptTargets(rootPath, manifest.scripts ?? {}, `${directory}/package.json`, findings);
}

/**
 * Reports whether an export target has a corresponding source file.
 *
 * @param {string} workspaceRoot Absolute workspace root.
 * @param {string} target Package export target below dist.
 * @returns {boolean} Whether one matching TypeScript, TSX, declaration, or CSS source exists.
 */
function hasExportSource(workspaceRoot, target) {
  const relativeTarget = target.slice("./dist/".length);
  const sourceTarget = resolve(workspaceRoot, "src", relativeTarget);
  if (relativeTarget.endsWith(".css")) return existsSync(sourceTarget);
  const base = sourceTarget.replace(/\.d\.ts$/u, "").replace(/\.js$/u, "");
  return [`.ts`, `.tsx`, `.d.ts`].some((extension) => existsSync(`${base}${extension}`));
}

/**
 * Verifies direct Node and shell script file references in package commands.
 *
 * @param {string} baseDirectory Directory from which package scripts run.
 * @param {Record<string, string>} scripts Package script map.
 * @param {string} manifestPath Repository-relative manifest label.
 * @param {string[]} findings Mutable failure list.
 * @returns {void}
 */
function auditScriptTargets(baseDirectory, scripts, manifestPath, findings) {
  for (const [name, command] of Object.entries(scripts)) {
    for (const match of command.matchAll(/\b(?:bash|node)\s+([^\s"']+\.(?:[cm]?js|sh))\b/gu)) {
      if (!existsSync(resolve(baseDirectory, match[1]))) {
        findings.push(`${manifestPath} script ${name} references missing ${match[1]}`);
      }
    }
  }
}

/**
 * Compiles every explicitly marked README example as an independent module.
 *
 * @param {Map<string, string>} sources README sources keyed by repository path.
 * @param {string[]} findings Mutable failure list.
 * @returns {void}
 */
function auditReadmeCompileBlocks(sources, findings) {
  const temporaryRoot = mkdtempSync(join(tmpdir(), "miaixz-readme-"));
  const workspaceDeclarations = repository.workspaces.flatMap(({ rootPath }) =>
    walk(resolve(rootPath, "src")).filter((path) => path.endsWith(".d.ts")),
  );
  const defaultCompileWorkspace =
    repository.workspaces.find(({ manifest }) =>
      Object.hasOwn(manifest.peerDependencies ?? {}, "react"),
    ) ?? repository.workspaces[0];
  if (defaultCompileWorkspace === undefined) {
    findings.push("README compile audit requires at least one workspace");
    return;
  }
  const workspaceCompilerPaths = Object.fromEntries(
    repository.workspaces.flatMap(({ directory, name }) => [
      [name, [resolve(repositoryRoot, directory, "src/index.ts")]],
      [
        `${name}/*`,
        [
          resolve(repositoryRoot, directory, "src/components/*/index.ts"),
          resolve(repositoryRoot, directory, "src/*/index.ts"),
        ],
      ],
    ]),
  );
  try {
    let blockIndex = 0;
    for (const [readmePath, source] of sources) {
      for (const match of source.matchAll(/^```(ts|tsx) compile\n([\s\S]*?)^```$/gmu)) {
        const extension = match[1];
        const blockDirectory = join(temporaryRoot, String(blockIndex));
        const sourcePath = join(blockDirectory, `example.${extension}`);
        const configPath = join(blockDirectory, "tsconfig.json");
        mkdirSync(blockDirectory, { recursive: true });
        writeFileSync(sourcePath, match[2]);
        writeFileSync(join(blockDirectory, "styles.d.ts"), 'declare module "*.css";\n');
        const owningDirectory =
          readmePath === "README.md" ? defaultCompileWorkspace.directory : readmePath.split("/")[0];
        writeFileSync(
          configPath,
          `${JSON.stringify(
            {
              extends: resolve(repositoryRoot, owningDirectory, "tsconfig.json"),
              compilerOptions: {
                noEmit: true,
                module: "ESNext",
                moduleResolution: "Bundler",
                types: ["node"],
                typeRoots: [
                  resolve(repositoryRoot, "node_modules/@types"),
                  resolve(repositoryRoot, owningDirectory, "node_modules/@types"),
                ],
                paths: {
                  react: [
                    resolve(
                      repositoryRoot,
                      owningDirectory,
                      "node_modules/@types/react/index.d.ts",
                    ),
                  ],
                  "react/*": [
                    resolve(repositoryRoot, owningDirectory, "node_modules/@types/react/*"),
                  ],
                  ...workspaceCompilerPaths,
                },
              },
              files: [sourcePath, join(blockDirectory, "styles.d.ts"), ...workspaceDeclarations],
              include: [],
              exclude: [],
            },
            null,
            2,
          )}\n`,
        );
        try {
          execFileSync("npm", ["exec", "--", "tsc", "-p", configPath], {
            cwd: repositoryRoot,
            stdio: "pipe",
          });
        } catch {
          findings.push(`${readmePath} compile block ${blockIndex + 1} does not type-check`);
        }
        blockIndex += 1;
      }
    }
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
  }
}

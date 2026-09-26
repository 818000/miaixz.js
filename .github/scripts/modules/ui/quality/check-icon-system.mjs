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

import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { loadWorkspaceRepository, repositoryRoot } from "../../../miaixz.mjs";

const uiWorkspace = loadWorkspaceRepository().workspaces.find(
  ({ name }) => name === "@miaixz/ui",
);
if (uiWorkspace === undefined) throw new Error("The UI workspace manifest is required.");
const projectRoot = repositoryRoot;
const uiRoot = uiWorkspace.rootPath;
const namesPath = path.join(uiRoot, "src/icons/icon-names.ts");
const providersRoot = path.join(uiRoot, "src/icons/providers");
const failures = [];

/**
 * Extracts one bounded object literal from TypeScript source.
 */
function objectBody(source, declaration, nextDeclaration) {
  const start = source.indexOf(declaration);
  const end = source.indexOf(nextDeclaration, start);
  if (start < 0 || end < 0) throw new Error(`Unable to locate ${declaration}.`);
  return source.slice(start, end);
}

/**
 * Returns every TypeScript or TSX file below one directory.
 */
async function collectSourceFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collectSourceFiles(target)));
    else if (/\.tsx?$/u.test(entry.name)) files.push(target);
  }
  return files;
}

/**
 * Reports whether one package version allows compatible upgrades.
 */
function isCompatibleRange(value) {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    !/^v?\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/u.test(
      value.trim(),
    )
  );
}

/**
 * Loads every provider declaration without knowing provider identities.
 */
async function loadProviderDeclarations() {
  const entries = await readdir(providersRoot, { withFileTypes: true });
  const configFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith("-provider.json"))
    .map((entry) => entry.name)
    .sort();
  const declarations = [];
  for (const file of configFiles) {
    const source = await readFile(path.join(providersRoot, file), "utf8");
    try {
      declarations.push({ file, value: JSON.parse(source) });
    } catch (error) {
      failures.push(`${file} is not valid JSON: ${String(error)}`);
    }
  }
  return { declarations, entries };
}

const namesSource = await readFile(namesPath, "utf8");
const namesBody = objectBody(
  namesSource,
  "export const ICON_NAMES = {",
  "} as const;",
);
const nameEntries = [
  ...namesBody.matchAll(
    /^  ([A-Z][A-Z0-9_]*): "([a-z0-9]+(?:-[a-z0-9]+)*)",$/gmu,
  ),
];
const names = nameEntries.map((match) => match[2]);
const nameSet = new Set(names);
const constants = nameEntries.map((match) => match[1]);
const constantSet = new Set(constants);
if (
  names.length === 0 ||
  nameSet.size !== names.length ||
  constantSet.size !== constants.length
) {
  failures.push(
    "ICON_NAMES must contain non-empty, unique constant and public names",
  );
}
if (!namesSource.includes("Object.values(ICON_NAMES).map")) {
  failures.push("iconCatalog must be derived from ICON_NAMES");
}
for (const name of names) {
  if (/^(?:action|status|object|navigation|product)\.|:/u.test(name)) {
    failures.push(`invalid public icon prefix: ${name}`);
  }
}

const packageManifest = JSON.parse(
  await readFile(path.join(uiRoot, "package.json"), "utf8"),
);
const { declarations, entries: providerDirectoryEntries } =
  await loadProviderDeclarations();
const providerIds = new Set();
const declaredProviderStems = new Set();
let mappedIconCount = 0;

for (const { file, value } of declarations) {
  const stem = file.slice(0, -"-provider.json".length);
  const providerFile = `${stem}-provider.ts`;
  const moduleFile = `${stem}-module.ts`;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(stem)) {
    failures.push(`${file} has an invalid provider file prefix`);
    continue;
  }
  declaredProviderStems.add(stem);
  if (value?.schemaVersion !== 1)
    failures.push(`${file} must use provider schema version 1`);
  if (
    typeof value?.id !== "string" ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(value.id)
  ) {
    failures.push(`${file} has an invalid provider id`);
  } else if (providerIds.has(value.id)) {
    failures.push(`${file} duplicates provider id ${value.id}`);
  } else {
    providerIds.add(value.id);
  }
  if (!["factory", "static"].includes(value?.mode)) {
    failures.push(`${file} has an invalid provider mode`);
  }
  let providerSource = "";
  let moduleSource = "";
  try {
    providerSource = await readFile(
      path.join(providersRoot, providerFile),
      "utf8",
    );
  } catch {
    failures.push(`${file} requires ${providerFile}`);
  }
  try {
    moduleSource = await readFile(path.join(providersRoot, moduleFile), "utf8");
  } catch {
    failures.push(`${file} requires ${moduleFile}`);
  }
  if (
    value.mode === "static" &&
    !providerSource.includes(`id: "${value.id}"`)
  ) {
    failures.push(`${file} id does not match ${providerFile}`);
  }

  if (
    !Array.isArray(value?.dependencies) ||
    value.dependencies.some((item) => typeof item !== "string")
  ) {
    failures.push(`${file} must declare a dependency list`);
    continue;
  }
  for (const dependency of value.dependencies) {
    const range = packageManifest.dependencies?.[dependency];
    if (typeof range !== "string") {
      failures.push(
        `${file} dependency ${dependency} is not declared in ${uiWorkspace.directory}/package.json`,
      );
    } else if (!isCompatibleRange(range)) {
      failures.push(
        `${file} dependency ${dependency} must use a non-exact compatible range`,
      );
    }
  }

  if (value.mapping === undefined) continue;
  if (!["complete", "partial"].includes(value.mapping?.coverage)) {
    failures.push(`${file} has an invalid mapping declaration`);
    continue;
  }

  const constantEntries = [
    ...moduleSource.matchAll(/\[ICON_NAMES\.([A-Z][A-Z0-9_]*)\]\s*:/gu),
  ].map((match) => match[1]);
  const mappedConstants = new Set(constantEntries);
  mappedIconCount += constantEntries.length;
  if (
    constantEntries.length === 0 ||
    mappedConstants.size !== constantEntries.length
  ) {
    failures.push(`${file} mapping must contain unique ICON_NAMES keys`);
  }
  if (/^  "[a-z0-9-]+"\s*:/mu.test(moduleSource)) {
    failures.push(`${file} mapping contains a handwritten public icon name`);
  }
  for (const constantName of mappedConstants) {
    if (!constantSet.has(constantName))
      failures.push(`${file} uses unknown ICON_NAMES.${constantName}`);
  }
  if (
    value.mapping.coverage === "complete" &&
    (mappedConstants.size !== constantSet.size ||
      constants.some((constantName) => !mappedConstants.has(constantName)))
  ) {
    failures.push(`${file} must map every ICON_NAMES entry exactly once`);
  }

  if (value.mapping.nativeCatalog !== undefined) {
    const catalogDeclaration = value.mapping.nativeCatalog;
    if (
      typeof catalogDeclaration?.module !== "string" ||
      typeof catalogDeclaration?.export !== "string" ||
      !value.dependencies.some(
        (dependency) =>
          catalogDeclaration.module === dependency ||
          catalogDeclaration.module.startsWith(`${dependency}/`),
      )
    ) {
      failures.push(`${file} has an invalid native catalog declaration`);
    } else {
      try {
        const imported = await import(catalogDeclaration.module);
        const nativeCatalog = imported[catalogDeclaration.export];
        const nativeEntries = [
          ...moduleSource.matchAll(
            /\[ICON_NAMES\.([A-Z][A-Z0-9_]*)\]\s*:\s*"([a-z0-9]+(?:-[a-z0-9]+)*)"\s*,/gu,
          ),
        ];
        if (nativeEntries.length !== constantEntries.length) {
          failures.push(`${file} native mapping syntax is incomplete`);
        }
        for (const [, constantName, nativeName] of nativeEntries) {
          if (
            nativeCatalog === null ||
            !(nativeName in Object(nativeCatalog))
          ) {
            failures.push(
              `${file} cannot resolve ${constantName} to ${nativeName}`,
            );
          }
        }
      } catch (error) {
        failures.push(`${file} cannot load native catalog: ${String(error)}`);
      }
    }
  }

  if (value.mapping.dynamicImports === true) {
    const moduleEntries = [
      ...moduleSource.matchAll(
        /const\s*\{\s*([A-Za-z_$][\w$]*)\s*\}\s*=\s*await import\("([^"]+)"\);/gu,
      ),
    ];
    if (moduleEntries.length !== constantEntries.length) {
      failures.push(
        `${file} must declare one dynamic import for every mapped icon`,
      );
    }
    const loadedModules = new Map();
    for (const [, exportName, specifier] of moduleEntries) {
      if (
        !value.dependencies.some(
          (dependency) =>
            specifier === dependency || specifier.startsWith(`${dependency}/`),
        )
      ) {
        failures.push(
          `${file} imports undeclared dependency path ${specifier}`,
        );
        continue;
      }
      if (!loadedModules.has(specifier)) {
        loadedModules.set(
          specifier,
          import(specifier).catch((error) => {
            failures.push(`${file} cannot load ${specifier}: ${String(error)}`);
            return null;
          }),
        );
      }
      const imported = await loadedModules.get(specifier);
      if (imported !== null && !(exportName in imported)) {
        failures.push(`${file} cannot resolve ${exportName} from ${specifier}`);
      }
    }
  }
}

if (declarations.length === 0)
  failures.push("providers directory must contain provider declarations");
for (const entry of providerDirectoryEntries) {
  if (!entry.isFile()) continue;
  if (entry.name.endsWith(".provider.json")) {
    failures.push(`${entry.name} uses the removed provider declaration naming`);
  }
  const implementation = entry.name.match(
    /^([a-z0-9]+(?:-[a-z0-9]+)*)-(?:module|provider)\.ts$/u,
  );
  if (implementation && !declaredProviderStems.has(implementation[1])) {
    failures.push(`${entry.name} does not belong to a declared provider trio`);
  }
}

const forbiddenFiles = [
  ".github/scripts/codegen/icon-names.mjs",
  `${uiWorkspace.directory}/src/icons/icon-name.generated.ts`,
  `${uiWorkspace.directory}/src/icons/icon-name-overrides.generated.ts`,
  `${uiWorkspace.directory}/src/icons/icon-catalog.ts`,
];
for (const file of forbiddenFiles) {
  try {
    await access(path.join(projectRoot, file));
    failures.push(`old icon file remains: ${file}`);
  } catch {
    /**
     * The absence of every old icon file is required.
     */
  }
}

for (const file of await collectSourceFiles(path.join(uiRoot, "src"))) {
  const source = await readFile(file, "utf8");
  if (/^\s*\/\//mu.test(source) || /^\s*\/\*\*[^\n]*\*\/\s*$/mu.test(source)) {
    failures.push(
      `${path.relative(projectRoot, file)} uses a single-line comment`,
    );
  }
  if (
    /MiaixzIconName|icon-name\.generated|icon-name-overrides|resolveLucideName|toKebabCase/u.test(
      source,
    )
  ) {
    failures.push(
      `${path.relative(projectRoot, file)} contains an old icon API`,
    );
  }
  for (const pattern of [
    /<Icon\b[^>]*\bname\s*=\s*["']([^"']+)["']/gsu,
    /\bicon\s*:\s*["']([^"']+)["']/gu,
  ]) {
    for (const match of source.matchAll(pattern)) {
      const name = match[1];
      if (name && !nameSet.has(name))
        failures.push(`${path.relative(projectRoot, file)} uses ${name}`);
    }
  }
}

if (failures.length > 0)
  throw new Error(`Icon system check failed:\n${failures.sort().join("\n")}`);
process.stdout.write(
  `Validated ${names.length} icon names, ${declarations.length} provider declarations, and ${mappedIconCount} provider mappings.\n`,
);

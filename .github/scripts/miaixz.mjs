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
import { readFileSync } from "node:fs";
import { isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/**
 * Absolute path to the repository root that owns the shared script utilities.
 *
 * @type {string}
 */
export const repositoryRoot = fileURLToPath(new URL("../..", import.meta.url));
const internalDependencyFields = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
];

const semanticVersionPattern =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-(?:0|[1-9]\d*|[0-9A-Za-z-]*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|[0-9A-Za-z-]*[A-Za-z-][0-9A-Za-z-]*))*)?$/u;

/**
 * Reads and parses a package.json file without caching its contents.
 *
 * @param {string} path Absolute or process-relative path to package.json.
 * @returns {PackageManifest} Parsed package manifest.
 * @throws {Error} If the file cannot be read or does not contain valid JSON.
 */
function readPackageManifest(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

/**
 * Validates an exact release version and returns the numeric components needed by release rules.
 * Build metadata is deliberately rejected because Git tags and npm versions must remain identical.
 *
 * @param {string} version Candidate semantic version.
 * @returns {{ major: number, minor: number }} Parsed major and minor components.
 * @throws {Error} If the value is not a complete semantic version without build metadata.
 */
export function assertReleaseVersion(version) {
  const match = semanticVersionPattern.exec(version);
  if (!match) {
    throw new Error(`'${version}' must be a complete semantic version without build metadata.`);
  }
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
  };
}

/**
 * Produces the compatible internal peer range for a synchronized workspace release.
 * Zero-major releases advance the minor upper bound; stable releases advance the major upper bound.
 *
 * @param {string} version Exact synchronized workspace version.
 * @returns {string} Inclusive lower bound and exclusive compatible upper bound.
 * @throws {Error} If the supplied version is not a valid release version.
 */
export function getWorkspacePeerRange(version) {
  const { major, minor } = assertReleaseVersion(version);
  const upperBound = major === 0 ? `0.${minor + 1}.0` : `${major + 1}.0.0`;
  return `>=${version} <${upperBound}`;
}

/**
 * Loads root and workspace package metadata from the root package.json workspaces configuration.
 * Workspace entries must be explicit relative directories inside the repository; globs are rejected
 * so every custom script observes the same auditable package registry.
 *
 * @param {string} [root=repositoryRoot] Absolute repository root to inspect.
 * @returns {WorkspaceRepository} Normalized root and workspace package metadata.
 * @throws {Error} If workspace configuration, paths, manifests, or package names are invalid.
 */
export function loadWorkspaceRepository(root = repositoryRoot) {
  const rootPackagePath = join(root, "package.json");
  const rootManifest = readPackageManifest(rootPackagePath);
  const configuredWorkspaces = Array.isArray(rootManifest.workspaces)
    ? rootManifest.workspaces
    : rootManifest.workspaces?.packages;
  if (!Array.isArray(configuredWorkspaces) || configuredWorkspaces.length === 0) {
    throw new Error("Root package.json must define at least one workspace directory.");
  }

  const directories = configuredWorkspaces.map((directory) => {
    if (typeof directory !== "string" || directory.trim() !== directory || directory === "") {
      throw new Error("Every workspace entry must be a non-empty normalized directory string.");
    }
    if (isAbsolute(directory) || /[*?[\]{}]/u.test(directory)) {
      throw new Error(`Workspace '${directory}' must be an explicit relative directory.`);
    }
    const workspaceRoot = resolve(root, directory);
    const workspaceRelativePath = relative(root, workspaceRoot);
    if (workspaceRelativePath === "" || workspaceRelativePath.startsWith("..")) {
      throw new Error(`Workspace '${directory}' must stay below the repository root.`);
    }
    return directory;
  });
  if (new Set(directories).size !== directories.length) {
    throw new Error("package.json contains duplicate workspace directories.");
  }

  const workspaces = directories.map((directory, index) => {
    const rootPath = resolve(root, directory);
    const manifestPath = join(rootPath, "package.json");
    const manifest = readPackageManifest(manifestPath);
    if (typeof manifest.name !== "string" || manifest.name === "") {
      throw new Error(`${directory}/package.json must define a package name.`);
    }
    return {
      directory,
      index,
      manifest,
      manifestPath,
      name: manifest.name,
      rootPath,
    };
  });
  const names = workspaces.map(({ name }) => name);
  if (new Set(names).size !== names.length) {
    throw new Error("Workspace package names must be unique.");
  }

  return {
    publicWorkspaces: workspaces.filter(({ manifest }) => manifest.private !== true),
    root,
    rootManifest,
    rootPackagePath,
    workspaces,
  };
}

/**
 * Returns workspaces in stable dependency-first order.
 * Dependencies declared in any internal dependency field precede their consumers; unrelated packages
 * retain the order in which they were declared by the root workspace configuration.
 *
 * @param {WorkspacePackage[]} workspaces Workspace packages to order.
 * @returns {WorkspacePackage[]} A new dependency-first array.
 * @throws {Error} If internal workspace dependencies contain a cycle.
 */
export function sortWorkspacesByDependencies(workspaces) {
  const byName = new Map(workspaces.map((workspace) => [workspace.name, workspace]));
  const sorted = [];
  const visiting = new Set();
  const visited = new Set();

  /**
   * Performs a depth-first traversal for one workspace.
   *
   * @param {WorkspacePackage} workspace Workspace currently being visited.
   * @param {string[]} trail Package names traversed before this workspace.
   * @returns {void}
   * @throws {Error} If the traversal encounters an active workspace again.
   */
  function visit(workspace, trail) {
    if (visited.has(workspace.name)) return;
    if (visiting.has(workspace.name)) {
      throw new Error(`Workspace dependency cycle: ${[...trail, workspace.name].join(" -> ")}.`);
    }
    visiting.add(workspace.name);
    for (const dependency of getInternalWorkspaceDependencies(workspace, byName)) {
      visit(dependency, [...trail, workspace.name]);
    }
    visiting.delete(workspace.name);
    visited.add(workspace.name);
    sorted.push(workspace);
  }

  for (const workspace of workspaces) visit(workspace, []);
  return sorted;
}

/**
 * Resolves a workspace's dependencies that are also part of the supplied repository package map.
 * Duplicate declarations across dependency fields collapse to one package and results remain stable.
 *
 * @param {WorkspacePackage} workspace Workspace whose internal dependencies should be resolved.
 * @param {Map<string, WorkspacePackage>} workspacesByName Repository workspaces keyed by package name.
 * @returns {WorkspacePackage[]} Internal dependencies ordered by their root workspace position.
 */
function getInternalWorkspaceDependencies(workspace, workspacesByName) {
  const dependencies = new Set();
  for (const field of internalDependencyFields) {
    for (const name of Object.keys(workspace.manifest[field] ?? {})) {
      const dependency = workspacesByName.get(name);
      if (dependency !== undefined) dependencies.add(dependency);
    }
  }
  return [...dependencies].sort((left, right) => left.index - right.index);
}

/**
 * Executes a required npm script once in every workspace using dependency-first ordering.
 * Execution is synchronous and inherits stdio so a failing child command immediately stops the run.
 *
 * @param {string} script Exact npm script name to execute.
 * @param {WorkspaceRepository} [repository=loadWorkspaceRepository()] Repository metadata to use.
 * @returns {void}
 * @throws {Error} If the script name is empty, a workspace omits it, or an npm command fails.
 */
export function runWorkspaceScript(script, repository = loadWorkspaceRepository()) {
  if (typeof script !== "string" || script.trim() === "") {
    throw new Error("A workspace script name is required.");
  }
  for (const workspace of sortWorkspacesByDependencies(repository.workspaces)) {
    if (workspace.manifest.scripts?.[script] === undefined) {
      throw new Error(`${workspace.name} does not define the '${script}' script.`);
    }
    execFileSync("npm", ["run", script, "--workspace", workspace.name], {
      cwd: repository.root,
      stdio: "inherit",
    });
  }
}

/**
 * Importing this module exposes helpers only; workspace execution occurs solely when this file is
 * the direct CLI entry point.
 */
const entryPath = process.argv[1];
if (entryPath !== undefined && import.meta.url === pathToFileURL(resolve(entryPath)).href) {
  const script = process.argv[2]?.trim();
  if (!script) throw new Error("Usage: miaixz.mjs <script>.");
  runWorkspaceScript(script);
}

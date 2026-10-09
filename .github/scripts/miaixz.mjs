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
 * Provides shared repository metadata and workspace discovery utilities.
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/**
 * URL used to resolve the repository root when modules retain file URLs.
 */
const repositoryRootUrl = new URL("../..", import.meta.url);

/**
 * Absolute path to the repository root that owns the shared script utilities.
 */
export const repositoryRoot =
  repositoryRootUrl.protocol === "file:"
    ? fileURLToPath(repositoryRootUrl)
    : findRepositoryRoot(process.cwd());
const internalDependencyFields = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
];

const semanticVersionPattern =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-(?:0|[1-9]\d*|[0-9A-Za-z-]*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|[0-9A-Za-z-]*[A-Za-z-][0-9A-Za-z-]*))*)?$/u;

/**
 * Finds the repository root when a test runner rewrites import.meta.url to a non-file URL.
 *
 * @param {string} start Directory from which to search upward.
 * @returns {string} Repository root containing VERSION and this shared script.
 * @throws {Error} If no repository root can be located.
 */
function findRepositoryRoot(start) {
  let current = resolve(start);
  while (true) {
    if (
      existsSync(join(current, "VERSION")) &&
      existsSync(join(current, ".github/scripts/miaixz.mjs"))
    ) {
      return current;
    }
    const parent = resolve(current, "..");
    if (parent === current) {
      throw new Error(`Unable to locate the repository root from '${start}'.`);
    }
    current = parent;
  }
}

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
 * Discovers every first-party package manifest known to the repository checkout.
 * Git supplies the file set so ignored dependencies and generated output never enter release
 * metadata checks, while newly added and not-yet-committed manifests are included automatically.
 *
 * @param {string} [root=repositoryRoot] Absolute repository root to inspect.
 * @returns {Array<{
 *   directory: string,
 *   manifest: PackageManifest,
 *   manifestPath: string,
 *   relativePath: string,
 *   rootPath: string,
 * }>} Stable package manifest records ordered by repository path.
 * @throws {Error} If discovery fails, no root manifest exists, or an opt-out flag is invalid.
 */
export function loadRepositoryPackageManifests(root = repositoryRoot) {
  const discovered = execFileSync(
    "git",
    [
      "ls-files",
      "-z",
      "--cached",
      "--others",
      "--exclude-standard",
      "--",
      ":(glob)**/package.json",
    ],
    {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "inherit"],
    },
  )
    .split("\0")
    .filter(Boolean)
    .filter((relativePath) => existsSync(resolve(root, relativePath)))
    .sort((left, right) => left.localeCompare(right));

  if (!discovered.includes("package.json")) {
    throw new Error("Repository package discovery must include the root package.json.");
  }

  return discovered.map((relativePath) => {
    const manifestPath = resolve(root, relativePath);
    const manifest = readPackageManifest(manifestPath);
    if (manifest.miaixzVersion !== undefined && typeof manifest.miaixzVersion !== "boolean") {
      throw new Error(`${relativePath} miaixzVersion must be a boolean when present.`);
    }
    const rootPath = dirname(manifestPath);
    return {
      directory: relative(root, rootPath).replaceAll("\\", "/") || ".",
      manifest,
      manifestPath,
      relativePath,
      rootPath,
    };
  });
}

/**
 * Returns package manifests that participate in the synchronized repository release version.
 * Every first-party manifest participates; independent version opt-outs are rejected.
 *
 * @param {string} [root=repositoryRoot] Absolute repository root to inspect.
 * @returns {ReturnType<typeof loadRepositoryPackageManifests>} Version-managed package records.
 */
export function loadVersionedPackageManifests(root = repositoryRoot) {
  const manifests = loadRepositoryPackageManifests(root);
  if (manifests.some(({ manifest }) => manifest.miaixzVersion === false)) {
    throw new Error("First-party package manifests cannot opt out of VERSION.");
  }
  return manifests;
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
 * Reads the repository release version from the single authoritative VERSION file.
 *
 * @param {string} [root=repositoryRoot] Absolute repository root to inspect.
 * @returns {string} Validated release version.
 * @throws {Error} If VERSION is missing or does not contain a supported release version.
 */
export function readRepositoryVersion(root = repositoryRoot) {
  const version = readFileSync(join(root, "VERSION"), "utf8").trim();
  assertReleaseVersion(version);
  return version;
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
    if (directory !== workspaceRelativePath.split(sep).join("/")) {
      throw new Error(`Workspace '${directory}' must be a normalized repository-relative path.`);
    }
    return directory;
  });
  if (new Set(directories).size !== directories.length) {
    throw new Error("package.json contains duplicate workspace directories.");
  }
  for (const [index, directory] of directories.entries()) {
    for (const candidate of directories.slice(index + 1)) {
      const directoryRoot = resolve(root, directory);
      const candidateRoot = resolve(root, candidate);
      if (
        isNestedDirectory(directoryRoot, candidateRoot) ||
        isNestedDirectory(candidateRoot, directoryRoot)
      ) {
        throw new Error(
          `Workspace directories cannot be nested: '${directory}' and '${candidate}'.`,
        );
      }
    }
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
  if (typeof rootManifest.name !== "string" || rootManifest.name === "") {
    throw new Error("Root package.json must define a package name.");
  }
  if (names.includes(rootManifest.name)) {
    throw new Error(`Root and workspace package names must be unique: '${rootManifest.name}'.`);
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
 * Loads the complete repository inventory shared by install, audit, lock, and project checks.
 * Every Git-visible package manifest outside the root workspace is a standalone dependency graph.
 *
 * @param {string} [root=repositoryRoot] Absolute repository root to inspect.
 * @returns {RepositoryInventory} Validated repository package and dependency-graph metadata.
 * @throws {Error} If manifests, names, or package directories are ambiguous or nested.
 */
export function loadRepositoryInventory(root = repositoryRoot) {
  const workspaceRepository = loadWorkspaceRepository(root);
  const packageManifests = loadRepositoryPackageManifests(root);
  const normalizedRoot = resolve(root);
  const rootPackage = packageManifests.find(
    ({ manifestPath }) => resolve(manifestPath) === workspaceRepository.rootPackagePath,
  );
  if (rootPackage === undefined) {
    throw new Error("Repository inventory must contain the root package.json.");
  }

  const workspaceManifestPaths = new Set(
    workspaceRepository.workspaces.map(({ manifestPath }) => resolve(manifestPath)),
  );
  const standaloneProjects = packageManifests
    .filter(
      ({ manifestPath }) =>
        resolve(manifestPath) !== workspaceRepository.rootPackagePath &&
        !workspaceManifestPaths.has(resolve(manifestPath)),
    )
    .map((project, index) => {
      const { directory, manifest, rootPath } = project;
      assertRepositoryDirectory(normalizedRoot, rootPath, `Standalone project '${directory}'`);
      if (typeof manifest.name !== "string" || manifest.name === "") {
        throw new Error(`${project.relativePath} must define a package name.`);
      }
      return {
        ...project,
        index,
        lockPath: join(rootPath, "package-lock.json"),
        name: manifest.name,
      };
    });

  const packages = [
    { name: workspaceRepository.rootManifest.name, directory: "." },
    ...workspaceRepository.workspaces,
    ...standaloneProjects,
  ];
  const duplicateNames = packages
    .map(({ name }) => name)
    .filter((name, index, names) => names.indexOf(name) !== index);
  if (duplicateNames.length > 0) {
    throw new Error(
      `Repository package names must be unique: ${[...new Set(duplicateNames)].join(", ")}.`,
    );
  }

  for (const project of standaloneProjects) {
    for (const workspace of workspaceRepository.workspaces) {
      if (isNestedDirectory(workspace.rootPath, project.rootPath)) {
        throw new Error(
          `Standalone project '${project.directory}' cannot be nested in workspace '${workspace.directory}'.`,
        );
      }
    }
  }
  for (const [index, project] of standaloneProjects.entries()) {
    for (const candidate of standaloneProjects.slice(index + 1)) {
      if (
        isNestedDirectory(project.rootPath, candidate.rootPath) ||
        isNestedDirectory(candidate.rootPath, project.rootPath)
      ) {
        throw new Error(
          `Standalone projects cannot be nested: '${project.directory}' and '${candidate.directory}'.`,
        );
      }
    }
  }

  return {
    ...workspaceRepository,
    graphs: [
      {
        directory: ".",
        kind: "workspace",
        lockPath: join(normalizedRoot, "package-lock.json"),
        manifest: workspaceRepository.rootManifest,
        manifestPath: workspaceRepository.rootPackagePath,
        name: workspaceRepository.rootManifest.name,
        rootPath: normalizedRoot,
        workspaces: workspaceRepository.workspaces,
      },
      ...standaloneProjects.map((project) => ({
        ...project,
        kind: "standalone",
        workspaces: [],
      })),
    ],
    packageManifests,
    rootPackage,
    standaloneProjects,
  };
}

/**
 * Finds one required workspace by its public package identity.
 *
 * @param {string} packageName Exact workspace package name.
 * @param {WorkspaceRepository} [repository=loadWorkspaceRepository()] Repository metadata.
 * @returns {WorkspacePackage} Matching workspace record.
 * @throws {Error} If the package is not a workspace in this repository.
 */
export function requireWorkspace(packageName, repository = loadWorkspaceRepository()) {
  const workspace = repository.workspaces.find(({ name }) => name === packageName);
  if (workspace === undefined) {
    throw new Error(`Required workspace '${packageName}' is missing.`);
  }
  return workspace;
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
 * @param {{arguments?: string[], ifPresent?: boolean}} [options={}] Execution options.
 * @returns {void}
 * @throws {Error} If the script name is empty, a workspace omits it, or an npm command fails.
 */
export function runWorkspaceScript(script, repository = loadWorkspaceRepository(), options = {}) {
  const { arguments: scriptArguments = [], ifPresent = false } = options;
  if (typeof script !== "string" || script.trim() === "") {
    throw new Error("A workspace script name is required.");
  }
  for (const workspace of sortWorkspacesByDependencies(repository.workspaces)) {
    if (workspace.manifest.scripts?.[script] === undefined) {
      if (ifPresent) continue;
      throw new Error(`${workspace.name} does not define the '${script}' script.`);
    }
    execFileSync(
      "npm",
      [
        "run",
        script,
        "--workspace",
        workspace.name,
        ...(scriptArguments.length > 0 ? ["--", ...scriptArguments] : []),
      ],
      {
        cwd: repository.root,
        stdio: "inherit",
      },
    );
  }
}

/**
 * Installs every repository dependency graph using the same reproducible npm policy.
 *
 * @param {RepositoryInventory} [inventory=loadRepositoryInventory()] Repository inventory.
 * @returns {void}
 */
export function installRepositoryGraphs(inventory = loadRepositoryInventory()) {
  const parameters = ["ci", "--package-lock=true", "--ignore-scripts", "--legacy-peer-deps"];
  for (const graph of inventory.graphs) {
    execFileSync("npm", parameters, {
      cwd: graph.rootPath,
      stdio: "inherit",
    });
  }
}

/**
 * Runs the required validation scripts for every standalone project.
 *
 * @param {RepositoryInventory} [inventory=loadRepositoryInventory()] Repository inventory.
 * @returns {void}
 */
export function checkStandaloneProjects(inventory = loadRepositoryInventory()) {
  for (const project of inventory.standaloneProjects) {
    for (const script of ["typecheck", "build"]) {
      if (project.manifest.scripts?.[script] === undefined) {
        throw new Error(`${project.name} does not define the required '${script}' script.`);
      }
      execFileSync("npm", ["run", script], {
        cwd: project.rootPath,
        stdio: "inherit",
      });
    }
  }
}

/**
 * Lints repository automation with the existing shared UI ESLint configuration.
 *
 * @param {string[]} arguments_ Additional eslint arguments.
 * @param {WorkspaceRepository} [repository=loadWorkspaceRepository()] Repository metadata.
 * @returns {void}
 */
export function lintAutomationScripts(arguments_, repository = loadWorkspaceRepository()) {
  const uiWorkspace = requireWorkspace("@miaixz/ui", repository);
  execFileSync(
    "npm",
    [
      "exec",
      "--",
      "eslint",
      ".github/scripts",
      "--config",
      join(uiWorkspace.rootPath, "eslint.config.js"),
      ...arguments_,
    ],
    {
      cwd: repository.root,
      stdio: "inherit",
    },
  );
}

/**
 * Runs the existing icon visual helper selected by a stable root command.
 *
 * @param {string} command Stable icon helper command.
 * @param {WorkspaceRepository} [repository=loadWorkspaceRepository()] Repository metadata.
 * @returns {void}
 */
function runIconHelper(command, repository = loadWorkspaceRepository()) {
  const iconWorkspace = requireWorkspace("@miaixz/icons", repository);
  const fontDirectory = join(iconWorkspace.rootPath, "dist/assets/fonts");
  const commands = {
    "font:inspect": [
      join(repository.root, ".github/scripts/modules/icons/fonts/validate-icon-font.mjs"),
      "--mode",
      "inspect",
      "--input",
      fontDirectory,
    ],
    "visual:check": [
      join(iconWorkspace.rootPath, "tests/assets/fonts/compare-visuals.helper.mjs"),
      "--mode",
      "validate",
    ],
    "visual:render": [
      join(iconWorkspace.rootPath, "tests/assets/fonts/render-catalog.helper.mjs"),
      "--font-dir",
      fontDirectory,
      "--browser",
      "all",
    ],
    "visual:validate": [
      join(iconWorkspace.rootPath, "tests/assets/fonts/compare-visuals.helper.mjs"),
      "--mode",
      "validate",
    ],
  };
  const parameters = commands[command];
  if (parameters === undefined) throw new Error(`Unknown icon helper command '${command}'.`);
  execFileSync(process.execPath, parameters, {
    cwd: repository.root,
    stdio: "inherit",
  });
}

/**
 * Ensures a directory is contained by the repository root.
 *
 * @param {string} root Repository root.
 * @param {string} directory Candidate directory.
 * @param {string} label Diagnostic label.
 * @returns {void}
 */
function assertRepositoryDirectory(root, directory, label) {
  const path = relative(root, resolve(directory));
  if (path === "" || path === ".." || path.startsWith(`..${sep}`) || isAbsolute(path)) {
    throw new Error(`${label} must stay below the repository root.`);
  }
}

/**
 * Tests whether one directory is strictly below another directory.
 *
 * @param {string} parent Candidate parent directory.
 * @param {string} child Candidate child directory.
 * @returns {boolean} Whether child is nested below parent.
 */
function isNestedDirectory(parent, child) {
  const path = relative(resolve(parent), resolve(child));
  return path !== "" && path !== ".." && !path.startsWith(`..${sep}`) && !isAbsolute(path);
}

/**
 * Importing this module exposes helpers only; workspace execution occurs solely when this file is
 * the direct CLI entry point.
 */
const entryPath = process.argv[1];
if (entryPath !== undefined && import.meta.url === pathToFileURL(resolve(entryPath)).href) {
  const [command, ...arguments_] = process.argv.slice(2);
  if (!command) throw new Error("Usage: miaixz.mjs <command> [--if-present] [arguments...].");
  if (command === "install:all") installRepositoryGraphs();
  else if (command === "check:projects") checkStandaloneProjects();
  else if (command === "lint:scripts") lintAutomationScripts(arguments_);
  else if (["font:inspect", "visual:check", "visual:render", "visual:validate"].includes(command)) {
    runIconHelper(command);
  } else {
    const ifPresent = arguments_.includes("--if-present");
    runWorkspaceScript(command, loadWorkspaceRepository(), {
      arguments: arguments_.filter((argument) => argument !== "--if-present"),
      ifPresent,
    });
  }
}

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
import { createServer } from "node:http";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { loadWorkspaceRepository, repositoryRoot } from "../miaixz.mjs";

const root = repositoryRoot;
const temporaryDirectory = mkdtempSync(join(tmpdir(), "miaixz-packed-"));
const requestedOutputDirectory = process.env.MIAIXZ_PACKAGE_OUTPUT?.trim();
const packageOutputDirectory = requestedOutputDirectory
  ? resolve(root, requestedOutputDirectory)
  : temporaryDirectory;
const packageFiles = ["dist", "README.md", "LICENSE", "NOTICE"];
const reactMatrix = JSON.parse(
  readFileSync(resolve(root, ".github/scripts/package/react-matrix.json"), "utf8"),
);
const { publicWorkspaces } = loadWorkspaceRepository(root);
const manifests = Object.fromEntries(
  publicWorkspaces.map(({ directory, manifest }) => [directory, manifest]),
);

try {
  mkdirSync(packageOutputDirectory, { recursive: true });
  for (const workspace of publicWorkspaces) validateManifest(workspace);
  for (const { rootPath } of publicWorkspaces) {
    run("npm", ["exec", "--", "publint"], rootPath);
    run("npm", ["exec", "--", "attw", "--pack", "."], rootPath);
  }

  const tarballs = new Map(publicWorkspaces.map((workspace) => [workspace.name, pack(workspace)]));
  writePackageIndex(tarballs);
  createConsumer("react18", reactMatrix.react18, tarballs, false);
  const react19Directory = createConsumer("react19", reactMatrix.react19, tarballs, true);
  await runBrowserSmoke(react19Directory);
  console.log(
    `Packed ${publicWorkspaces.map(({ name }) => name).join(", ")} exports and React 18/19 SSR/browser consumers are valid.`,
  );
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}

/**
 * Validates the files and export targets required for a publishable workspace.
 *
 * @param {{ directory: string, manifest: object, rootPath: string }} workspace Workspace metadata.
 * @returns {void}
 * @throws {Error} If required files or public export targets are invalid.
 */
function validateManifest({ directory, manifest, rootPath }) {
  if (JSON.stringify(manifest.files) !== JSON.stringify(packageFiles)) {
    throw new Error(`${directory}/package.json files must equal ${JSON.stringify(packageFiles)}`);
  }
  for (const file of packageFiles) {
    const stats = statSync(join(rootPath, file));
    if (file === "dist" ? !stats.isDirectory() : !stats.isFile()) {
      throw new Error(`${directory}/${file} has the wrong file type`);
    }
  }
  for (const [subpath, target] of Object.entries(manifest.exports)) {
    const targets = typeof target === "string" ? [target] : Object.values(target);
    for (const candidate of targets) {
      const path = join(rootPath, candidate.replace(/^\.\//u, ""));
      try {
        readFileSync(path);
      } catch {
        throw new Error(`${directory} export ${subpath} target is missing: ${candidate}`);
      }
    }
  }
}

/**
 * Packs a workspace and verifies that repository-level policy files are not duplicated.
 *
 * @param {{ directory: string }} workspace Workspace metadata to package.
 * @returns {string} Absolute path to the generated package tarball.
 * @throws {Error} If npm returns an invalid result or the tarball contains forbidden files.
 */
function pack({ directory }) {
  const output = execFileSync(
    "npm",
    ["pack", "--json", "--pack-destination", packageOutputDirectory, `./${directory}`],
    { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] },
  );
  const result = JSON.parse(output);
  if (!Array.isArray(result) || result.length !== 1 || typeof result[0].filename !== "string") {
    throw new Error(`Unable to resolve ${directory} tarball`);
  }
  const forbiddenPolicyFiles = new Set(["SECURITY.md", "SUPPORT.md", "THIRD_PARTY_NOTICES.md"]);
  for (const file of result[0].files ?? []) {
    const topLevel = file.path.split("/")[0];
    if (forbiddenPolicyFiles.has(topLevel)) {
      throw new Error(`${directory} tarball contains duplicate package-local policy ${topLevel}`);
    }
  }
  return join(packageOutputDirectory, result[0].filename);
}

/**
 * Writes the machine-readable index for all generated workspace tarballs.
 *
 * @param {Map<string, string>} tarballs Tarball paths keyed by package name.
 * @returns {void}
 */
function writePackageIndex(tarballs) {
  const packages = publicWorkspaces.map(({ directory, manifest, name }) => ({
    directory,
    name,
    tarball: basename(tarballs.get(name)),
    version: manifest.version,
  }));
  writeFileSync(
    join(packageOutputDirectory, "workspace-packages.json"),
    `${JSON.stringify({ packages }, null, 2)}\n`,
  );
}

/**
 * Creates and validates an isolated React consumer for the packed workspaces.
 *
 * @param {string} name Temporary consumer directory name.
 * @param {object} matrix React and TypeScript dependency versions for the consumer.
 * @param {Map<string, string>} tarballs Tarball paths keyed by package name.
 * @param {boolean} browser Whether to add and build the browser smoke application.
 * @returns {string} Absolute path to the validated consumer directory.
 */
function createConsumer(name, matrix, tarballs, browser) {
  const directory = join(temporaryDirectory, name);
  mkdirSync(directory);
  writeFileSync(
    join(directory, "package.json"),
    JSON.stringify(
      {
        private: true,
        type: "module",
        dependencies: {
          ...Object.fromEntries(
            [...tarballs].map(([packageName, tarball]) => [packageName, `file:${tarball}`]),
          ),
          react: matrix.react,
          "react-dom": matrix.reactDom,
        },
        devDependencies: {
          "@types/react": matrix.reactTypes,
          "@types/react-dom": matrix.reactDomTypes,
          typescript: "7.0.2",
          ...(browser ? { vite: "8.2.2" } : {}),
        },
      },
      null,
      2,
    ),
  );
  writeFileSync(
    join(directory, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          target: "ES2022",
          module: "NodeNext",
          moduleResolution: "NodeNext",
          jsx: "react-jsx",
          strict: true,
          skipLibCheck: true,
          outDir: "build",
        },
        include: ["main.tsx"],
      },
      null,
      2,
    ),
  );
  writeFileSync(
    join(directory, "main.tsx"),
    `${createPublicExportSource()}\n${createConsumerSource()}`,
  );
  if (browser) {
    writeFileSync(
      join(directory, "index.html"),
      '<div id="root"></div><script type="module" src="/browser.tsx"></script>',
    );
    writeFileSync(join(directory, "browser.tsx"), createBrowserSource());
  }
  run("npm", ["install", "--ignore-scripts", "--package-lock=false"], directory);
  run("npm", ["exec", "--", "tsc"], directory);
  run("node", ["build/main.js"], directory);
  if (browser) run("npm", ["exec", "--", "vite", "build"], directory);
  return directory;
}

/**
 * Generates a consumer source module that verifies every public package export.
 *
 * @returns {string} TypeScript source for the public export smoke test.
 */
function createPublicExportSource() {
  const imports = [];
  const bindings = [];
  const specifiers = [];
  let index = 0;
  for (const { directory, name: packageName } of publicWorkspaces) {
    for (const [subpath, target] of Object.entries(manifests[directory].exports)) {
      if (typeof target === "string") continue;
      const specifier = subpath === "." ? packageName : `${packageName}${subpath.slice(1)}`;
      const binding = `publicExport${index}`;
      imports.push(`import * as ${binding} from ${JSON.stringify(specifier)};`);
      bindings.push(binding);
      specifiers.push(specifier);
      index += 1;
    }
  }
  const removedSubpaths = [
    "@miaixz/sdk/sdk",
    "@miaixz/sdk/models",
    "@miaixz/sdk/validators",
    "@miaixz/ui/confirm-dialog",
    "@miaixz/ui/inline-message",
    "@miaixz/ui/form-field",
    "@miaixz/ui/search-input",
    "@miaixz/ui/loading-overlay",
    "@miaixz/ui/multi-select",
    "@miaixz/ui/data-table",
    "@miaixz/ui/page-layout",
    "@miaixz/ui/file-upload",
    "@miaixz/ui/tree-view",
    "@miaixz/ui/status-indicator",
    "@miaixz/ui/empty-state",
    "@miaixz/ui/visually-hidden",
    "@miaixz/ui/body",
    "@miaixz/ui/body/styles.css",
    "@miaixz/ui/locale-picker",
    "@miaixz/ui/metric",
    "@miaixz/ui/metric-group",
    "@miaixz/ui/module-frame",
    "@miaixz/ui/module-frame/styles.css",
    "@miaixz/ui/grouped-list",
    "@miaixz/ui/grouped-list/styles.css",
    "@miaixz/ui/relation-map",
    "@miaixz/ui/diagram",
    "@miaixz/ui/patterns/action-catalog",
    "@miaixz/ui/miaixz.css",
    "@miaixz/ui/themes.css",
  ];
  return `
${imports.join("\n")}
import * as packedUiRoot from "@miaixz/ui";
${removedSubpaths.map((specifier) => `// @ts-expect-error Removed package subpath must remain unresolvable.\nimport type {} from ${JSON.stringify(specifier)};`).join("\n")}

void [${bindings.join(", ")}];
for (const specifier of ${JSON.stringify(specifiers)}) {
  const resolved = import.meta.resolve(specifier);
  if (!resolved.includes("/node_modules/@miaixz/")) {
    throw new Error(\`Packed export resolved outside the consumer: \${specifier} -> \${resolved}\`);
  }
}
for (const specifier of ${JSON.stringify(removedSubpaths)}) {
  let rejected = false;
  try { import.meta.resolve(specifier); } catch { rejected = true; }
  if (!rejected) throw new Error(\`Removed package subpath resolved: \${specifier}\`);
}
for (const name of ${JSON.stringify([
    "ConfirmDialog",
    "InlineMessage",
    "FormField",
    "SearchInput",
    "LoadingOverlay",
    "MultiSelect",
    "DataTable",
    "PageLayout",
    "FileUpload",
    "TreeView",
    "StatusIndicator",
    "EmptyState",
    "VisuallyHidden",
    "Body",
    "LocalePicker",
    "MetricGroup",
    "ModuleFrame",
    "GroupedList",
    "Sticky",
    "DropzonePanel",
    "ListDistributionItem",
    "ListItemControl",
    "actionCatalog",
    "getActionCatalogEntry",
    "intentDefinitions",
    "getIntentDefinition",
    "PanelRow",
    "EditorFields",
    "EditorActions",
    "EditorBox",
    "EditorGroup",
    "EditorOverview",
    "EditorPicker",
    "EditorStatus",
    "RelationMap",
  ])}) {
  if (Object.hasOwn(packedUiRoot, name)) throw new Error(\`Removed or scoped root value is exported: \${name}\`);
}
`;
}

/**
 * Serves the built browser consumer and verifies its critical runtime interactions.
 *
 * @param {string} directory Absolute consumer directory containing the browser build.
 * @returns {Promise<void>} Promise that resolves after all browser assertions pass.
 * @throws {Error} If the local server cannot start or a browser assertion fails.
 */
async function runBrowserSmoke(directory) {
  const distribution = resolve(directory, "dist");
  const server = createServer((request, response) => {
    const pathname = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
    const requestedPath = pathname === "/" ? "/index.html" : pathname;
    const file = resolve(distribution, `.${decodeURIComponent(requestedPath)}`);
    if (!file.startsWith(`${distribution}/`)) {
      response.writeHead(403).end();
      return;
    }
    try {
      const content = readFileSync(file);
      const contentType = file.endsWith(".js")
        ? "text/javascript"
        : file.endsWith(".css")
          ? "text/css"
          : "text/html";
      response.writeHead(200, { "content-type": contentType }).end(content);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise((resolveListen, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolveListen);
  });
  const address = server.address();
  if (address === null || typeof address === "string")
    throw new Error("Browser server has no port");
  const { chromium } = await import("@playwright/test");
  const browser = await chromium.launch();
  const page = await browser.newPage();
  try {
    await page.goto(`http://127.0.0.1:${address.port}`);
    await page.waitForSelector("#theme-button");
    assertEqual(
      await page.locator("#theme-button").getAttribute("data-variant"),
      "solid",
      "Theme defaultProps",
    );

    await page.locator('input[name="name"]').fill("Ada");
    await page.locator("#submit-button").click();
    assertEqual(await page.locator("#form-result").textContent(), "Ada:one", "native form submit");

    await page.locator("#open-dialog").click();
    await page.locator("dialog[open]").waitFor();
    await page.keyboard.press("Escape");
    await page.locator("dialog[open]").waitFor({ state: "detached" });
    assertEqual(
      await page.evaluate(() => document.activeElement?.id),
      "open-dialog",
      "Dialog focus restoration",
    );

    const leftNode = page.locator('.miaixz-graph-node[aria-label="Left"]');
    await leftNode.focus();
    await page.keyboard.press("ArrowRight");
    assertEqual(
      await page.evaluate(() => document.activeElement?.getAttribute("aria-label")),
      "Right",
      "Graph directional keyboard navigation",
    );
  } finally {
    await browser.close();
    await new Promise((resolveClose) => server.close(resolveClose));
  }
}

/**
 * Asserts strict equality for a named package-consumer contract.
 *
 * @param {unknown} actual Observed value.
 * @param {unknown} expected Required value.
 * @param {string} contract Human-readable contract name.
 * @returns {void}
 * @throws {Error} If the observed value differs from the required value.
 */
function assertEqual(actual, expected, contract) {
  if (actual !== expected) {
    throw new Error(
      `${contract} failed: expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`,
    );
  }
}

/**
 * Executes a command synchronously in the requested working directory.
 *
 * @param {string} command Executable name.
 * @param {string[]} parameters Command-line parameters.
 * @param {string} directory Absolute working directory.
 * @returns {void}
 * @throws {Error} If the child process exits unsuccessfully.
 */
function run(command, parameters, directory) {
  execFileSync(command, parameters, { cwd: directory, stdio: "inherit" });
}

/**
 * Generates the server-rendering consumer smoke-test source.
 *
 * @returns {string} TypeScript and JSX source for the server consumer.
 */
function createConsumerSource() {
  return `
import { createMiaixzAppearanceManager } from "@miaixz/sdk/appearance";
import { createMiaixzI18n } from "@miaixz/sdk/i18n";
import { Button, Dialog, Field, Graph, Input, MiaixzLocaleProvider, Select, Theme } from "@miaixz/ui";
import { ImageView } from "@miaixz/view/image";
import { renderToString } from "react-dom/server";

const appearance = createMiaixzAppearanceManager({ appId: "packed-smoke" });
const i18n = createMiaixzI18n();
const option = { kind: "option" as const, id: "one", value: "one", label: "One", textValue: "One" };
const html = renderToString(
  <MiaixzLocaleProvider i18n={i18n}>
    <Theme appearance={appearance} scope="local">
      <form>
        <Field label="Name"><Input name="name" /></Field>
        <Field label="Choice"><Select aria-label="Choice" defaultValue="one" items={[option]} name="choice" /></Field>
        <Button type="submit">Submit</Button>
      </form>
      <Dialog open={false} onOpenChange={() => {}} title="Dialog">Content</Dialog>
      <Graph aria-label="Graph" edges={[]} nodes={[{ id: "one", label: "One", x: 50, y: 50, tone: "neutral" }]} tableCaption="Graph data" />
      <ImageView alt="Preview" controls={false} src="https://example.test/image.png" />
    </Theme>
  </MiaixzLocaleProvider>,
);
if (!html.includes("miaixz-button") || !html.includes("Graph data") || !html.includes("miaixz-view-image")) throw new Error("Packed SSR output is incomplete");
`;
}

/**
 * Generates the interactive browser consumer smoke-test source.
 *
 * @returns {string} TypeScript and JSX source for the browser consumer.
 */
function createBrowserSource() {
  return `
import "@miaixz/ui/styles.css";
import "@miaixz/view/styles.css";
import { createMiaixzAppearanceManager } from "@miaixz/sdk/appearance";
import { createMiaixzI18n } from "@miaixz/sdk/i18n";
import { Button, Dialog, Field, Graph, Input, MiaixzLocaleProvider, Select, Theme } from "@miaixz/ui";
import { ImageView } from "@miaixz/view/image";
import { useState, type FormEvent } from "react";
import { createRoot } from "react-dom/client";

const appearance = createMiaixzAppearanceManager({ appId: "packed-browser" });
const i18n = createMiaixzI18n();
const option = { kind: "option" as const, id: "one", value: "one", label: "One", textValue: "One" };

function App() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formResult, setFormResult] = useState("");
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setFormResult(\`${'${String(data.get("name"))}'}:${'${String(data.get("choice"))}'}\`);
  };
  return (
    <MiaixzLocaleProvider i18n={i18n}>
      <Theme
        appearance={appearance}
        scope="local"
        components={{ Button: { defaultProps: { variant: "solid" } } }}
      >
        <Button id="theme-button">Themed</Button>
        <form onSubmit={submit}>
          <Field label="Name"><Input name="name" /></Field>
          <Field label="Choice">
            <Select aria-label="Choice" defaultValue="one" items={[option]} name="choice" />
          </Field>
          <Button id="submit-button" type="submit">Submit</Button>
        </form>
        <output id="form-result">{formResult}</output>
        <Button id="open-dialog" onClick={() => setDialogOpen(true)}>Open dialog</Button>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen} title="Dialog">Dialog content</Dialog>
        <Graph
          aria-label="Graph"
          edges={[{ id: "edge", sourceId: "left", targetId: "right", directed: true }]}
          nodes={[
            { id: "left", label: "Left", x: 20, y: 50, tone: "neutral" },
            { id: "right", label: "Right", x: 80, y: 50, tone: "neutral" },
          ]}
          tableCaption="Graph data"
        />
        <ImageView alt="Packed preview" controls={false} src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" />
      </Theme>
    </MiaixzLocaleProvider>
  );
}

const root = document.getElementById("root");
if (root === null) throw new Error("Packed browser root is missing");
createRoot(root).render(<App />);
`;
}

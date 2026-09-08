import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { defineTheme } from "../src/theme/define.js";
import { resolveThemeDefinitions } from "../src/theme/resolve.js";
import { miaixzBuiltInThemes } from "../src/theme/catalog.js";
import { miaixzThemeTypographyDefaults } from "../src/design/typography.js";

const packageDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..");

interface PackageCodeExport {
  /**
   * JavaScript entry emitted by the package.
   */
  readonly import: string;
  /**
   * Declaration entry emitted by the package.
   */
  readonly types: string;
}

interface PackageManifest {
  /**
   * Public package subpaths.
   */
  readonly exports: Readonly<Record<string, string | PackageCodeExport>>;
  /**
   * Files included by npm pack.
   */
  readonly files: readonly string[];
}

const packageManifest = JSON.parse(
  readFileSync(resolve(packageDirectory, "package.json"), "utf8"),
) as PackageManifest;
const cssExports = [
  "./styles.css",
  "./core.css",
  "./theme.css",
  "./miaixz.css",
  "./neutral.css",
  "./contrast.css",
  "./reset.css",
  "./foundation.css",
  "./components.css",
] as const;
const generatedSources = [
  "src/theme/miaixz.css",
  "src/theme/neutral.css",
  "src/theme/contrast.css",
  "src/theme/theme.css",
  "src/styles/core.css",
  "src/styles/reset.css",
] as const;
const remediatedComponents = ["descriptions", "editor", "module-frame", "steps", "table"] as const;

/**
 * Reads direct CSS imports from one aggregate.
 *
 * @param file - CSS file to inspect.
 * @returns Direct relative import values.
 */
function cssImports(file: string): string[] {
  return [...readFileSync(file, "utf8").matchAll(/@import\s+url\(["'](.+?)["']\)/g)].map(
    (match) => match[1]!,
  );
}

/**
 * Expands one CSS import graph while retaining the aggregate itself.
 *
 * @param file - CSS file to expand.
 * @param chain - Active import ancestry used for cycle detection.
 * @returns Aggregate and recursively imported files in source order.
 */
function expandCss(file: string, chain: readonly string[] = []): string[] {
  const normalized = resolve(file);
  if (chain.includes(normalized)) throw new Error(`CSS import cycle: ${normalized}`);
  const imports = cssImports(normalized);
  if (imports.length === 0) return [normalized];
  return [
    normalized,
    ...imports.flatMap((entry) =>
      expandCss(resolve(dirname(normalized), entry), [...chain, normalized]),
    ),
  ];
}

describe("CSS package ownership contract", () => {
  it("keeps the legacy aggregate name as an alias without a second stylesheet", () => {
    expect(packageManifest.exports["./themes.css"]).toBe(packageManifest.exports["./theme.css"]);
    expect(() => readFileSync(resolve(packageDirectory, "src/theme/themes.css"))).toThrow();
  });

  it("exports every supported aggregate from the packed dist directory", () => {
    for (const entry of cssExports) {
      const target = packageManifest.exports[entry];
      expect(typeof target, `${entry} must be a direct CSS export`).toBe("string");
      const name = entry === "./styles.css" ? "miaixz.css" : entry.slice(2);
      const directory = ["miaixz.css", "neutral.css", "contrast.css", "theme.css"].includes(name)
        ? "theme"
        : "styles";
      expect(target).toBe(`./dist/${directory}/${name}`);
    }
    expect(packageManifest.files).toContain("dist");
  });

  it("keeps remediated component JavaScript, types and CSS on the public root graph", () => {
    const componentRoot = readFileSync(
      resolve(packageDirectory, "src/components/index.ts"),
      "utf8",
    );
    const cssRoot = readFileSync(resolve(packageDirectory, "src/styles/components.css"), "utf8");
    const publicRoot = readFileSync(resolve(packageDirectory, "src/index.ts"), "utf8");
    expect(publicRoot).toContain('export * from "./components/index.js"');

    for (const component of remediatedComponents) {
      expect(componentRoot).toContain(`export * from "./${component}/index.js"`);
      expect(() =>
        readFileSync(resolve(packageDirectory, `src/components/${component}/index.ts`), "utf8"),
      ).not.toThrow();
      expect(cssRoot).toContain(
        `@import url("./components/${component}.css") layer(miaixz-components);`,
      );
    }
  });

  it("keeps aggregate entry graphs layered and free of repeated leaf imports", () => {
    const expectedThemeCounts = new Map([
      ["styles.css", 1],
      ["core.css", 0],
      ["theme.css", 3],
      ["miaixz.css", 1],
      ["neutral.css", 1],
      ["contrast.css", 1],
    ]);
    for (const [entry, themeCount] of expectedThemeCounts) {
      const source =
        entry === "styles.css"
          ? resolve(packageDirectory, "src/theme/miaixz.css")
          : resolve(packageDirectory, "src", entry === "core.css" ? "styles" : "theme", entry);
      const leaves = expandCss(source);
      expect(leaves[0]).toBe(source);
      expect(new Set(leaves).size, `${entry} repeats a leaf stylesheet`).toBe(leaves.length);
      const selectors = leaves.flatMap((file) =>
        [
          ...readFileSync(file, "utf8").matchAll(
            /\[data-miaixz-theme="([^"]+)"\]\[data-miaixz-color-mode="(light|dark)"\]/g,
          ),
        ].map((match) => `${match[1]}:${match[2]}`),
      );
      expect(new Set(selectors).size).toBe(themeCount * 2);
      expect(selectors).toHaveLength(themeCount * 2);
      expect(
        readFileSync(resolve(packageDirectory, "src/styles/foundation.css"), "utf8"),
      ).toContain(
        "miaixz-foundation, miaixz-themes, miaixz-components, miaixz-modules, miaixz-pages, miaixz-utilities, miaixz-overrides",
      );
    }
  });

  it("uses one generator template for staged and source outputs", () => {
    const stagingDirectory = mkdtempSync(resolve(tmpdir(), "miaixz-ui-theme-css-"));
    try {
      execFileSync(
        process.execPath,
        [
          "src/theme/generate.mjs",
          "--runtime-dir",
          resolve(packageDirectory, "dist"),
          "--output-dir",
          stagingDirectory,
        ],
        { cwd: packageDirectory, stdio: "pipe" },
      );
      expect(generatedSources).toHaveLength(6);
      for (const source of generatedSources) {
        expect(
          readFileSync(resolve(stagingDirectory, source), "utf8"),
          relative(packageDirectory, source),
        ).toBe(readFileSync(resolve(packageDirectory, source), "utf8"));
      }
    } finally {
      rmSync(stagingDirectory, { force: true, recursive: true });
    }
  });

  it("fills compact typography fields omitted by schema-one custom themes", () => {
    const parent = miaixzBuiltInThemes.find((theme) => theme.name === "miaixz")!;
    const legacy = defineTheme({
      schemaVersion: 1,
      name: "legacy-package-theme",
      label: "Legacy package theme",
      version: "1.0.0",
      extends: parent.name,
      tokens: { typography: { bodySize: 15 } },
      modes: { light: {}, dark: {} },
    });
    const themes = resolveThemeDefinitions(
      new Map([
        [parent.name, parent],
        [legacy.name, legacy],
      ]),
    );
    expect(themes.get(legacy.name)?.tokens.typography).toMatchObject({
      ...miaixzThemeTypographyDefaults,
      bodySize: 15,
    });
  });
});

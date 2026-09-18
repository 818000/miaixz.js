import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { miaixzDefaultAppearance } from "@miaixz/sdk/appearance";
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
   * Versioned application-facing UI metadata.
   */
  readonly miaixzUiContract: {
    readonly components: Readonly<
      Record<
        string,
        { readonly deprecatedProps?: readonly string[]; readonly supportedProps: readonly string[] }
      >
    >;
    readonly deprecatedProps: readonly unknown[];
    readonly exports?: readonly string[];
    readonly publicDomComponents: readonly string[];
    readonly runtimeAttributes: readonly string[];
    readonly stableSelectors: readonly string[];
  };
  /**
   * Public package subpaths.
   */
  readonly exports: Readonly<Record<string, string | PackageCodeExport>>;
  /**
   * Files included by npm pack.
   */
  readonly files: readonly string[];
}

interface AttwConfig {
  /**
   * Non-JavaScript package entrypoints intentionally omitted from type resolution.
   */
  readonly excludeEntrypoints: readonly string[];
}

const packageManifest = JSON.parse(
  readFileSync(resolve(packageDirectory, "package.json"), "utf8"),
) as PackageManifest;
const attwConfig = JSON.parse(
  readFileSync(resolve(packageDirectory, ".attw.json"), "utf8"),
) as AttwConfig;
const cssExports = [
  "./styles.css",
  "./core.css",
  "./theme.css",
  "./neutral.css",
  "./contrast.css",
  "./reset.css",
  "./foundation.css",
  "./components.css",
] as const;
const presetDirectory = resolve(packageDirectory, "src/theme/presets");
const generatedSources = [
  ...readdirSync(presetDirectory, { recursive: true })
    .map((entry) => resolve(presetDirectory, entry.toString()))
    .filter((entry) => entry.endsWith("/preset.json"))
    .filter((entry) => JSON.parse(readFileSync(entry, "utf8")).builtin === true)
    .map((entry) => relative(packageDirectory, resolve(dirname(entry), "styles.css")))
    .sort(),
  "src/theme/default.css",
  "src/theme/theme.css",
  "src/styles/core.css",
  "src/styles/reset.css",
] as const;
const remediatedComponents = ["descriptions", "editor", "steps", "table", "view"] as const;
const stylelessCodeExports = new Set([
  ".",
  "./errors",
  "./i18n",
  "./intents",
  "./theme",
  "./visualization-motion",
]);

/**
 * Reads root-exported DOM component names and their scoped package entry.
 *
 * @returns Public component names paired with their scoped entry.
 */
function rootDomComponentEntries(): Array<readonly [name: string, subpath: string]> {
  const source = readFileSync(resolve(packageDirectory, "src/components/index.ts"), "utf8");
  const entries: Array<readonly [name: string, subpath: string]> = [];
  for (const match of source.matchAll(
    /export\s+\{([^}]+)\}\s+from\s+"\.\/([^";]+)\/index\.js";/gu,
  )) {
    const sourceSubpath = match[2]!;
    const packageSubpath = sourceSubpath === "icon" ? "icons" : sourceSubpath;
    for (const rawName of match[1]!.split(",")) {
      const name = rawName
        .trim()
        .split(/\s+as\s+/u)
        .at(-1)!;
      if (/^[A-Z][A-Za-z0-9]*$/u.test(name) && name !== "DRAWER_WIDTHS") {
        entries.push([name, `./${packageSubpath}`]);
      }
    }
  }
  entries.push(["Appearance", "./appearance"]);
  return entries;
}

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
  it("keeps the documented public-entry table equal to the export map", () => {
    const readme = readFileSync(resolve(packageDirectory, "README.md"), "utf8");
    const documentedEntries = [...readme.matchAll(/^\| `([^`]+)`\s+\| (?:CSS|JavaScript)\s+\|$/gmu)]
      .map((match) => match[1]!)
      .sort();

    expect(documentedEntries).toEqual(Object.keys(packageManifest.exports).sort());
  });

  it("keeps the type-package checker exclusions equal to the CSS export surface", () => {
    const exportedCssSubpaths = Object.entries(packageManifest.exports)
      .filter(([, target]) => typeof target === "string")
      .map(([subpath]) => subpath.slice(2))
      .sort();

    expect([...attwConfig.excludeEntrypoints].sort()).toEqual(exportedCssSubpaths);
  });

  it("publishes one Theme JavaScript entry and the supported Theme CSS aggregates", () => {
    const themeCodeEntries = Object.entries(packageManifest.exports)
      .filter(
        ([, target]) =>
          typeof target !== "string" &&
          (target.import.startsWith("./dist/theme/") || target.types.startsWith("./dist/theme/")),
      )
      .map(([subpath]) => subpath);

    expect(themeCodeEntries).toEqual(["./theme"]);
    expect(packageManifest.exports["./styles.css"]).toBe("./dist/theme/default.css");
    expect(packageManifest.exports["./neutral.css"]).toBe(
      "./dist/theme/presets/neutral/styles.css",
    );
    expect(packageManifest.exports["./contrast.css"]).toBe(
      "./dist/theme/presets/contrast/styles.css",
    );
    expect(packageManifest.exports["./theme.css"]).toBe("./dist/theme/theme.css");
  });

  it("publishes intent definitions through their sole scoped entry", () => {
    expect(packageManifest.exports["./intents"]).toEqual({
      types: "./dist/intents/index.d.ts",
      import: "./dist/intents/index.js",
    });
    expect(packageManifest.exports["./patterns/action-catalog"]).toBeUndefined();
  });

  it("keeps the machine contract and scoped entries aligned with root DOM exports", () => {
    const entries = rootDomComponentEntries();
    const names = entries.map(([name]) => name).sort((left, right) => left.localeCompare(right));

    expect(packageManifest.miaixzUiContract.publicDomComponents).toEqual(names);
    expect(packageManifest.miaixzUiContract.deprecatedProps).toEqual([]);
    expect(packageManifest.miaixzUiContract.exports).toBeUndefined();
    for (const component of Object.values(packageManifest.miaixzUiContract.components)) {
      expect(component.deprecatedProps).toBeUndefined();
    }

    for (const [name, subpath] of entries) {
      const sourceSubpath = subpath === "./icons" ? "icon" : subpath.slice(2);
      expect(packageManifest.exports[subpath], `${name} requires ${subpath}`).toEqual({
        types:
          subpath === "./appearance"
            ? "./dist/appearance/index.d.ts"
            : subpath === "./icons"
              ? "./dist/icons/index.d.ts"
              : `./dist/components/${sourceSubpath}/index.d.ts`,
        import:
          subpath === "./appearance"
            ? "./dist/appearance/index.js"
            : subpath === "./icons"
              ? "./dist/icons/index.js"
              : `./dist/components/${sourceSubpath}/index.js`,
      });
      expect(packageManifest.exports[`${subpath}/styles.css`], `${name} requires CSS`).toBe(
        subpath === "./appearance"
          ? "./dist/styles/components/appearance.css"
          : `./dist/styles/components/${sourceSubpath}.css`,
      );
    }
  });

  it("keeps selector and runtime-attribute metadata backed by current source", () => {
    const styleSource = expandCss(resolve(packageDirectory, "src/styles/components.css"))
      .map((file) => readFileSync(file, "utf8"))
      .join("\n");
    const sourceDirectory = resolve(packageDirectory, "src");
    const componentSource = readdirSync(sourceDirectory, { recursive: true })
      .filter((entry) => /\.tsx?$/u.test(entry.toString()))
      .map((entry) => readFileSync(resolve(sourceDirectory, entry.toString()), "utf8"))
      .join("\n");

    for (const selector of packageManifest.miaixzUiContract.stableSelectors) {
      expect(
        styleSource.includes(`.miaixz-${selector}`) ||
          componentSource.includes(`"data-ui": "${selector}"`),
        `${selector} must exist as a class or data-ui hook`,
      ).toBe(true);
    }
    for (const attribute of packageManifest.miaixzUiContract.runtimeAttributes) {
      const datasetProperty = attribute
        .replace(/^data-/u, "")
        .replaceAll(/-([a-z])/gu, (_, character: string) => character.toUpperCase());
      expect(
        componentSource.includes(attribute) ||
          componentSource.includes(`dataset.${datasetProperty}`),
        `${attribute} must exist`,
      ).toBe(true);
    }
  });

  it("exports every supported aggregate from the packed dist directory", () => {
    for (const entry of cssExports) {
      const target = packageManifest.exports[entry];
      expect(typeof target, `${entry} must be a direct CSS export`).toBe("string");
      const expectedTarget =
        entry === "./styles.css"
          ? "./dist/theme/default.css"
          : entry === "./neutral.css"
            ? "./dist/theme/presets/neutral/styles.css"
            : entry === "./contrast.css"
              ? "./dist/theme/presets/contrast/styles.css"
              : entry === "./theme.css"
                ? "./dist/theme/theme.css"
                : `./dist/styles/${entry.slice(2)}`;
      expect(target).toBe(expectedTarget);
    }
    expect(packageManifest.files).toContain("dist");
  });

  it("exports one unique stylesheet for every public DOM module", () => {
    const componentEntries = Object.entries(packageManifest.exports).filter(
      ([subpath, target]) => typeof target !== "string" && !stylelessCodeExports.has(subpath),
    );
    const targets: string[] = [];

    for (const [subpath] of componentEntries) {
      const componentPath = subpath === "./icons" ? "icon" : subpath.slice(2);
      const styleSubpath = `${subpath}/styles.css`;
      const expectedTarget = `./dist/styles/components/${componentPath}.css`;
      expect(packageManifest.exports[styleSubpath], styleSubpath).toBe(expectedTarget);
      expect(() =>
        readFileSync(resolve(packageDirectory, expectedTarget.replace("./dist/", "src/"))),
      ).not.toThrow();
      targets.push(expectedTarget);
    }

    expect(new Set(targets).size).toBe(targets.length);
  });

  it("keeps remediated component JavaScript, types and CSS on the public root graph", () => {
    const componentRoot = readFileSync(
      resolve(packageDirectory, "src/components/index.ts"),
      "utf8",
    );
    const cssRoot = readFileSync(resolve(packageDirectory, "src/styles/components.css"), "utf8");
    const publicRoot = readFileSync(resolve(packageDirectory, "src/index.ts"), "utf8");
    expect(publicRoot).toContain('from "./components/index.js"');

    for (const component of remediatedComponents) {
      expect(componentRoot).toContain(`from "./${component}/index.js"`);
      expect(() =>
        readFileSync(resolve(packageDirectory, `src/components/${component}/index.ts`), "utf8"),
      ).not.toThrow();
      expect(cssRoot).toContain(
        `@import url("./components/${component}.css") layer(miaixz-components);`,
      );
    }
  });

  it("keeps aggregate entry graphs layered and free of repeated leaf imports", () => {
    const builtInThemeCount = generatedSources.filter((source) =>
      source.endsWith("/styles.css"),
    ).length;
    const expectedThemeCounts = new Map(
      ["styles.css", "core.css", "theme.css", "neutral.css", "contrast.css"].map((entry) => [
        entry,
        entry === "theme.css" ? builtInThemeCount : entry === "core.css" ? 0 : 1,
      ]),
    );
    for (const [entry, themeCount] of expectedThemeCounts) {
      const target = packageManifest.exports[`./${entry}`];
      expect(typeof target).toBe("string");
      const source = resolve(packageDirectory, (target as string).replace("./dist/", "src/"));
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
          "../.github/scripts/codegen/theme-css.mjs",
          "--runtime-dir",
          resolve(packageDirectory, "dist"),
          "--output-dir",
          stagingDirectory,
        ],
        { cwd: packageDirectory, stdio: "pipe" },
      );
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
    const parent = miaixzBuiltInThemes.find(
      (theme) => theme.name === miaixzDefaultAppearance.theme,
    )!;
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

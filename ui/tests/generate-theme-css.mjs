import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { format } from "prettier";
import prettierConfiguration from "../prettier.config.js";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const packageDirectory = resolve(scriptDirectory, "..");
const checkOnly = process.argv.slice(2).includes("--check");
const builtThemesPath = resolve(packageDirectory, "dist/themes/index.js");
const builtTypographyPath = resolve(packageDirectory, "dist/tokens/typography.js");
const builtGeometryPath = resolve(packageDirectory, "dist/tokens/geometry.js");

const themeModule = await import(pathToFileURL(builtThemesPath).href);
const typographyModule = await import(pathToFileURL(builtTypographyPath).href);
const geometryModule = await import(pathToFileURL(builtGeometryPath).href);
const themes = themeModule.miaixzBuiltInThemes;
const contract = themeModule.miaixzThemeSerializationContract;
const typographyFields = typographyModule.miaixzThemeTypographyFields;
const fontFamilyFields = new Set(typographyModule.miaixzThemeFontFamilyFields);
const layoutGeometryRanges = geometryModule.miaixzThemeLayoutGeometryRanges;

if (
  !Array.isArray(themes) ||
  themes.length !== 3 ||
  contract === undefined ||
  !Array.isArray(typographyFields) ||
  layoutGeometryRanges === undefined
) {
  throw new Error("Built theme module does not expose the frozen generator contract.");
}

const outputs = new Map();
for (const theme of themes) {
  outputs.set(
    resolve(packageDirectory, `src/styles/themes/${theme.name}.tokens.css`),
    serializeTheme(theme, contract, typographyFields, fontFamilyFields, layoutGeometryRanges),
  );
}

outputs.set(resolve(packageDirectory, "src/styles/styles.css"), '@import url("./miaixz.css");\n');
outputs.set(
  resolve(packageDirectory, "src/styles/core.css"),
  '@import url("./foundation.css");\n@import url("./components.css");\n',
);
outputs.set(
  resolve(packageDirectory, "src/styles/themes.css"),
  [
    '@import url("./foundation.css");',
    '@import url("./themes/miaixz.tokens.css") layer(miaixz-themes);',
    '@import url("./themes/neutral.tokens.css") layer(miaixz-themes);',
    '@import url("./themes/contrast.tokens.css") layer(miaixz-themes);',
    '@import url("./components.css");',
    "",
  ].join("\n"),
);
for (const name of ["miaixz", "neutral", "contrast"]) {
  outputs.set(
    resolve(packageDirectory, `src/styles/${name}.css`),
    [
      '@import url("./foundation.css");',
      `@import url("./themes/${name}.tokens.css") layer(miaixz-themes);`,
      '@import url("./components.css");',
      "",
    ].join("\n"),
  );
}
outputs.set(resolve(packageDirectory, "src/styles/reset.css"), serializeReset());

let different = false;
for (const [outputPath, source] of outputs) {
  const expected = await format(source, {
    ...prettierConfiguration,
    parser: "css",
  });
  const current = await readFile(outputPath, "utf8").catch(() => undefined);
  if (current === expected) continue;
  different = true;
  if (!checkOnly) {
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, expected, "utf8");
  }
}

if (checkOnly && different) process.exitCode = 1;

function serializeTheme(theme, order, typographyOrder, familyFields, geometryRanges) {
  const blocks = ["/* Generated from ui/src/themes; do not edit. */", ""];
  for (const modeName of ["light", "dark"]) {
    const mode = theme.modes[modeName];
    const declarations = [`color-scheme: ${modeName};`];
    for (const token of order.colors) {
      declarations.push(`--miaixz-color-${token}: ${mode.colors[token]};`);
    }
    for (const field of typographyOrder) {
      const prefix = familyFields.has(field) ? "font-" : "text-";
      const value = theme.tokens.typography[field];
      declarations.push(
        `--miaixz-${prefix}${toKebab(field)}: ${value}${typeof value === "number" ? "px" : ""};`,
      );
    }
    for (const field of order.radius) {
      declarations.push(`--miaixz-radius-${toKebab(field)}: ${theme.tokens.radius[field]}px;`);
    }
    for (const level of order.shadowLevels) {
      const value = theme.tokens.shadow[level];
      const color = level === "high" || level === "overlay" ? "shadow-strong" : "shadow";
      declarations.push(
        `--miaixz-shadow-${level}: 0 ${value.y}px ${value.blur}px ${value.spread}px var(--miaixz-color-${color});`,
      );
    }
    for (const density of order.densities) {
      for (const field of order.densityGeometry) {
        declarations.push(
          `--miaixz-geometry-${density}-${toKebab(field)}: ${theme.tokens.geometry[density][field]}px;`,
        );
      }
    }
    for (const field of order.layoutGeometry) {
      const unit = geometryRanges[field].unit;
      declarations.push(
        `--miaixz-layout-${toKebab(field)}: ${theme.tokens.geometry.layout[field]}${unit};`,
      );
    }
    for (const role of order.surfaceRoles) {
      for (const field of order.surfaceFields) {
        declarations.push(
          `--miaixz-surface-role-${role}-${field}: var(--miaixz-color-${theme.tokens.surfaces[role][field]});`,
        );
      }
    }
    blocks.push(
      `[data-miaixz-theme="${theme.name}"][data-miaixz-color-mode="${modeName}"] {`,
      ...declarations.map((declaration) => `  ${declaration}`),
      "}",
      "",
    );
  }
  return blocks.join("\n");
}

function serializeReset() {
  return [
    "@layer miaixz-foundation {",
    "  html {",
    "    box-sizing: border-box;",
    "    text-size-adjust: 100%;",
    "  }",
    "",
    "  *,",
    "  *::before,",
    "  *::after {",
    "    box-sizing: inherit;",
    "  }",
    "",
    "  body {",
    "    margin: 0;",
    "  }",
    "}",
    "",
  ].join("\n");
}

function toKebab(value) {
  return value.replaceAll(/[A-Z]/g, (character) => `-${character.toLowerCase()}`);
}

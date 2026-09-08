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

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { format } from "prettier";
import prettierConfiguration from "../../prettier.config.js";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const packageDirectory = resolve(scriptDirectory, "../..");
const parameters = process.argv.slice(2);
const checkOnly = parameters.includes("--check");
const sourceHeader = (
  await readFile(resolve(packageDirectory, "../.github/scripts/miaixz.org"), "utf8")
).trim();
const option = (name, fallback) => {
  const inline = parameters.find((value) => value.startsWith(name + "="));
  if (inline) return resolve(inline.slice(name.length + 1));
  const index = parameters.indexOf(name);
  if (index >= 0 && (!parameters[index + 1] || parameters[index + 1].startsWith("--")))
    throw new Error("Missing value for " + name);
  return index < 0 ? fallback : resolve(parameters[index + 1]);
};
const runtimeDirectory = option("--runtime-dir", resolve(packageDirectory, "dist"));
const outputDirectory = option("--output-dir", packageDirectory);
const builtThemesPath = resolve(runtimeDirectory, "theme/catalog.js");
const builtTypographyPath = resolve(runtimeDirectory, "design/typography.js");
const builtGeometryPath = resolve(runtimeDirectory, "design/geometry.js");
const builtOpacityPath = resolve(runtimeDirectory, "design/opacity.js");

const themeModule = await import(pathToFileURL(builtThemesPath).href);
const typographyModule = await import(pathToFileURL(builtTypographyPath).href);
const geometryModule = await import(pathToFileURL(builtGeometryPath).href);
const { serializeThemeOpacity } = await import(pathToFileURL(builtOpacityPath).href);
const themes = themeModule.miaixzBuiltInThemes;
const { miaixzThemeSerializationContract: contract } = await import(
  pathToFileURL(resolve(runtimeDirectory, "theme/serialize.js")).href
);
const typographyFields = typographyModule.miaixzThemeTypographyFields;
const fontFamilyFields = new Set(typographyModule.miaixzThemeFontFamilyFields);
const layoutGeometryRanges = geometryModule.miaixzThemeLayoutGeometryRanges;

if (
  !Array.isArray(themes) ||
  themes.length === 0 ||
  contract === undefined ||
  !Array.isArray(typographyFields) ||
  layoutGeometryRanges === undefined
) {
  throw new Error("Built theme module does not expose the frozen generator contract.");
}

const outputs = new Map();
const imports =
  '@import url("../styles/foundation.css");\n@import url("../styles/components.css");\n';
const render = (values) =>
  sourceHeader +
  "\n\n" +
  imports +
  "\n@layer miaixz-themes {\n" +
  values
    .map((theme) =>
      serializeTheme(theme, contract, typographyFields, fontFamilyFields, layoutGeometryRanges),
    )
    .join("\n") +
  "}\n";
for (const theme of themes) {
  outputs.set(resolve(outputDirectory, `src/theme/${theme.name}.css`), render([theme]));
}
outputs.set(resolve(outputDirectory, "src/theme/theme.css"), render(themes));
outputs.set(
  resolve(outputDirectory, "src/styles/core.css"),
  `${sourceHeader}\n\n@import url("./foundation.css");\n@import url("./components.css");\n`,
);
outputs.set(resolve(outputDirectory, "src/styles/reset.css"), serializeReset());

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
  const blocks = ["/*\n * Generated from ui/src/theme; do not edit.\n */", ""];
  for (const modeName of ["light", "dark"]) {
    const mode = theme.modes[modeName];
    const declarations = [`color-scheme: ${modeName};`];
    for (const token of order.colors) {
      declarations.push(`--miaixz-color-${token}: ${mode.colors[token]};`);
    }
    declarations.push(...serializeThemeOpacity(theme.tokens.opacity));
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
    sourceHeader,
    "",
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

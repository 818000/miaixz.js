import { readFile, readdir } from "node:fs/promises";
import { extname, relative, resolve } from "node:path";
import process from "node:process";
import { URL, fileURLToPath } from "node:url";
import { inspectComponentColors } from "../color-policy.mjs";

const packageDirectory = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const stylesDirectory = resolve(packageDirectory, "src/styles");
const themeDirectory = resolve(packageDirectory, "src/theme");
const files = [
  ...(await collectFiles(stylesDirectory, ".css")),
  ...(await collectFiles(themeDirectory, ".css")),
];
const componentSourceFiles = await collectFiles(
  resolve(packageDirectory, "src/components"),
  ".tsx",
);
const componentIndex = await readFile(resolve(packageDirectory, "src/components/index.ts"), "utf8");
const packageManifest = await readFile(resolve(packageDirectory, "package.json"), "utf8");
const actionTypes = await readFile(
  resolve(packageDirectory, "src/components/action/action.types.ts"),
  "utf8",
);
const actionStyle = await readFile(
  resolve(packageDirectory, "src/styles/components/action.css"),
  "utf8",
);
const pressInteractionSource = await readFile(
  resolve(packageDirectory, "src/shared/press-interaction.ts"),
  "utf8",
);
const buttonSource = await readFile(
  resolve(packageDirectory, "src/components/button/button.tsx"),
  "utf8",
);
const findings = [];
const definitions = new Set();
const uses = [];
const requiredGeneratedThemeVariables = new Set([
  "--miaixz-text-compact-body-size",
  "--miaixz-text-compact-body-line-height",
  "--miaixz-text-compact-caption-size",
  "--miaixz-text-compact-caption-line-height",
  "--miaixz-text-compact-section-title-size",
  "--miaixz-text-compact-section-title-line-height",
  "--miaixz-text-compact-metric-size",
  "--miaixz-text-compact-metric-line-height",
  "--miaixz-radius-summary",
]);

for (const file of files) {
  const source = await readFile(file, "utf8");
  const fileName = relative(packageDirectory, file);
  const isComponent = fileName.includes("/components/");
  const isGeneratedTheme = /^src\/theme\/(?:miaixz|neutral|contrast|theme)\.css$/.test(fileName);
  const isReset = fileName.endsWith("/reset.css");
  for (const match of source.matchAll(/(--miaixz-[a-z0-9-]+)\s*:/g)) definitions.add(match[1]);
  for (const match of source.matchAll(/var\((--miaixz-[a-z0-9-]+)(?:\s*,[^)]*)?\)/g)) {
    uses.push({ fileName, source, index: match.index, property: match[1] });
    if (match[0].includes(",") && !isAllowedTypographyFallback(fileName, match[0]))
      addFinding(fileName, source, match.index, "THEME_VAR_FALLBACK", match[0]);
  }
  if (!isReset) {
    inspect(fileName, source, /(^|[},]\s*)(html|body|:root)(?=[\s,{])/gm, "THEME_HOST_SELECTOR");
  }
  if (isComponent || fileName.includes("/foundation/") || fileName === "src/theme/scope.css") {
    for (const finding of inspectComponentColors(fileName.split("/").at(-1), source)) {
      addFinding(fileName, source, 0, "THEME_COLOR_POLICY", finding);
    }
  }
  if (isComponent) {
    inspect(fileName, source, /#[0-9a-f]{3,8}\b|\b(?:rgb|hsl|oklch)a?\(/gi, "THEME_DIRECT_COLOR");
    inspect(
      fileName,
      source,
      /(?:^|[;{]\s*)[a-z-]+\s*:\s*(?:white|black)(?=\s*[;}])/gim,
      "THEME_NAMED_COLOR",
    );
    inspect(
      fileName,
      source,
      /data-miaixz-theme\s*=\s*["'](?:miaixz|neutral|contrast)["']/g,
      "THEME_COMPONENT_BRANCH",
    );
    inspect(
      fileName,
      source,
      /var\(--miaixz-geometry-(?:compact|standard|comfortable)-/g,
      "THEME_DENSITY_BYPASS",
    );
    inspectThemeBackgroundAssets(fileName, source);
    inspectLiteralFontSizes(fileName, source);
  }
  if (!isGeneratedTheme) {
    inspect(fileName, source, /--miaixz-color-[a-z0-9-]+\s*:/g, "THEME_COLOR_OUTSIDE_THEME");
  } else {
    inspect(fileName, source, /\.miaixz-[a-z0-9-]+/g, "THEME_COMPONENT_SELECTOR");
  }
}

for (const file of componentSourceFiles) {
  const source = await readFile(file, "utf8");
  for (const match of source.matchAll(/["'](--miaixz-[a-z0-9-]+)["']\s*:/g)) {
    definitions.add(match[1]);
  }
  for (const match of source.matchAll(/\.setProperty\(\s*["'](--miaixz-[a-z0-9-]+)["']/g)) {
    definitions.add(match[1]);
  }
}

inspectRemovedActionApi("src/components/index.ts", componentIndex);
inspectRemovedActionApi("package.json", packageManifest);

for (const file of componentSourceFiles) {
  const source = await readFile(file, "utf8");
  const fileName = relative(packageDirectory, file);
  inspect(
    fileName,
    source,
    /<Button\b(?:(?!>).)*(?:\biconOnly\b|\bvariant\s*=\s*(?:\{\s*)?["'](?:action|action-primary|favorite|framed-icon|choice|navigation|plain|plain-primary|text|text-danger|danger-link|ghost|link|outline|refresh)["'])/gs,
    "ACTION_REMOVED_BUTTON_API",
  );
}

inspect(
  "src/components/action/action.types.ts",
  actionTypes,
  /\breadonly\s+(?:className|style)\??\s*:/g,
  "ACTION_PUBLIC_VISUAL_ESCAPE",
);
inspect(
  "src/components/action/action.types.ts",
  actionTypes,
  /\b(?:icon|startIcon|endIcon)\??\s*:\s*ReactNode\b/g,
  "ACTION_PUBLIC_REACT_NODE_ICON",
);
if (!/readonly\s+icon\s*:\s*MiaixzIconName\b/.test(actionTypes)) {
  addFinding(
    "src/components/action/action.types.ts",
    actionTypes,
    0,
    "ACTION_ICON_NAME_TYPE_MISSING",
    "ActionPresentation.icon",
  );
}

for (const entry of ["action-text.tsx", "icon-button.tsx"]) {
  const file = resolve(packageDirectory, "src/components/action", entry);
  const source = await readFile(file, "utf8");
  inspect(
    `src/components/action/${entry}`,
    source,
    /miaixz-interactive|data-miaixz-ripple/g,
    "ACTION_RIPPLE_SCOPE_LEAK",
  );
}
{
  const file = resolve(packageDirectory, "src/components/pressable/pressable.tsx");
  const source = await readFile(file, "utf8");
  inspect(
    "src/components/pressable/pressable.tsx",
    source,
    /miaixz-interactive|data-miaixz-ripple/g,
    "PRESSABLE_RIPPLE_SCOPE_LEAK",
  );
}
if ((buttonSource.match(/data-miaixz-ripple="true"/g) ?? []).length !== 2) {
  addFinding(
    "src/components/button/button.tsx",
    buttonSource,
    0,
    "BUTTON_RIPPLE_HOOK_MISSING",
    'data-miaixz-ripple="true"',
  );
}
for (const broadSelector of [
  /button:not\(\[data-miaixz-ripple/g,
  /\[role=['"]button['"]\]/g,
  /a\.miaixz-interactive/g,
]) {
  for (const match of pressInteractionSource.matchAll(broadSelector)) {
    addFinding(
      "src/shared/press-interaction.ts",
      pressInteractionSource,
      match.index,
      "RIPPLE_GLOBAL_SELECTOR",
      match[0],
    );
  }
}

inspect(
  "src/styles/components/action.css",
  actionStyle,
  /#[0-9a-f]{3,8}\b|\b(?:rgb|hsl|oklch)a?\(/gi,
  "ACTION_HARDCODED_VISUAL",
);
for (const declaration of actionStyle.matchAll(
  /(border-radius|transition-duration|animation-duration)\s*:\s*([^;]+)/gi,
)) {
  if (!declaration[2].includes("var(--miaixz-")) {
    addFinding(
      "src/styles/components/action.css",
      actionStyle,
      declaration.index,
      "ACTION_HARDCODED_VISUAL",
      declaration[0],
    );
  }
}

for (const entry of ["miaixz.css", "neutral.css", "contrast.css", "theme.css"]) {
  const file = resolve(themeDirectory, entry);
  const source = await readFile(file, "utf8").catch(() => "");
  const generatedDefinitions = new Set(
    [...source.matchAll(/(--miaixz-[a-z0-9-]+)\s*:/g)].map((match) => match[1]),
  );
  for (const variable of requiredGeneratedThemeVariables) {
    if (!generatedDefinitions.has(variable)) {
      addFinding(`src/theme/${entry}`, source, 0, "THEME_GENERATED_VARIABLE_MISSING", variable);
    }
  }
}

for (const directory of [
  stylesDirectory,
  themeDirectory,
  resolve(packageDirectory, "dist/styles"),
  resolve(packageDirectory, "dist/theme"),
]) {
  const scopedFiles = await collectFilesIfPresent(directory, ".css");
  for (const file of scopedFiles) {
    const source = await readFile(file, "utf8");
    inspectGlobalBackground(relative(packageDirectory, file), source);
  }
}

for (const use of uses) {
  if (!definitions.has(use.property)) {
    addFinding(use.fileName, use.source, use.index, "THEME_VARIABLE_UNKNOWN", use.property);
  }
}

for (const entry of [
  "styles.css",
  "core.css",
  "theme.css",
  "miaixz.css",
  "neutral.css",
  "contrast.css",
]) {
  const file =
    entry === "styles.css"
      ? resolve(themeDirectory, "miaixz.css")
      : resolve(entry === "core.css" ? stylesDirectory : themeDirectory, entry);
  const source = await readFile(file, "utf8").catch(() => "");
  const foundationCount = (source.match(/foundation\.css/g) ?? []).length;
  const componentCount = (source.match(/components\.css/g) ?? []).length;
  if (foundationCount > 1 || componentCount > 1) {
    addFinding(relative(packageDirectory, file), source, 0, "THEME_ENTRY_DUPLICATE", entry);
  }
}

for (const finding of findings) process.stderr.write(`${finding}\n`);
if (findings.length > 0) process.exitCode = 1;

function isAllowedTypographyFallback(fileName, value) {
  return (
    fileName === "src/styles/foundation/typography.css" &&
    /var\(--miaixz-(?:text|app)-[a-z0-9-]+,\s*var\(--miaixz-(?:font-size|line-height)-\d+/.test(
      value,
    )
  );
}

function inspect(fileName, source, pattern, code) {
  for (const match of source.matchAll(pattern))
    addFinding(fileName, source, match.index, code, match[0]);
}

function inspectRemovedActionApi(fileName, source) {
  inspect(fileName, source, /\b(?:ButtonGroup|getButtonClassName)\b/g, "ACTION_REMOVED_EXPORT");
}

function inspectGlobalBackground(fileName, source) {
  for (const rule of source.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = rule[1].trim();
    if (!/(?:^|[\s>+~,(])(?:html|body|:root)(?=$|[\s>+~.#:[(])/i.test(selector)) continue;
    for (const declaration of rule[2].matchAll(/(?:^|;)\s*(background(?:-color|-image)?)\s*:/gi)) {
      const index = (rule.index ?? 0) + rule[0].indexOf(rule[2]) + (declaration.index ?? 0);
      addFinding(fileName, source, index, "THEME_GLOBAL_BACKGROUND", declaration[1]);
    }
  }
}

function inspectThemeBackgroundAssets(fileName, source) {
  const pattern =
    /background(?:-image)?\s*:\s*(?:url\(|(?:repeating-)?(?:linear|radial|conic)-gradient\()[^;}]*[;}]/gi;
  for (const match of source.matchAll(pattern)) {
    const declaration = match[0];
    const isTokenizedGradient =
      !/url\(/i.test(declaration) &&
      /gradient\(/i.test(declaration) &&
      /var\(--miaixz-/i.test(declaration) &&
      !/#[0-9a-f]{3,8}\b|\b(?:rgb|hsl|oklch)a?\(|\b(?:black|white)\b/i.test(declaration);
    if (!isTokenizedGradient) {
      addFinding(fileName, source, match.index, "THEME_BACKGROUND_ASSET", declaration);
    }
  }
}

function inspectLiteralFontSizes(fileName, source) {
  const allowedSvgGeometry = new Set(["2.5px", "2.8px"]);
  for (const match of source.matchAll(
    /font-size\s*:\s*((?:\d*\.\d+|\d+)(?:px|rem|em|%|vw|vh|vmin|vmax))\b/gi,
  )) {
    const value = match[1];
    if (
      value === "0" ||
      (fileName === "src/styles/components/relation-map.css" && allowedSvgGeometry.has(value))
    ) {
      continue;
    }
    addFinding(fileName, source, match.index, "THEME_LITERAL_FONT_SIZE", match[0]);
  }
}

function addFinding(fileName, source, index, code, value) {
  const line = source.slice(0, index).split("\n").length;
  findings.push(`${fileName}:${line}: ${code}: ${String(value).trim()}`);
}

async function collectFiles(directory, extension) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const target = resolve(directory, entry.name);
      return entry.isDirectory()
        ? collectFiles(target, extension)
        : Promise.resolve(extname(entry.name) === extension ? [target] : []);
    }),
  );
  return nested.flat().sort();
}

async function collectFilesIfPresent(directory, extension) {
  return collectFiles(directory, extension).catch((error) => {
    if (error?.code === "ENOENT") return [];
    throw error;
  });
}

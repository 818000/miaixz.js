import { readFile, readdir } from "node:fs/promises";
import { extname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageDirectory = resolve(fileURLToPath(new URL("..", import.meta.url)));
const stylesDirectory = resolve(packageDirectory, "src/styles");
const files = await collectFiles(stylesDirectory, ".css");
const findings = [];
const definitions = new Set();
const uses = [];

for (const file of files) {
  const source = await readFile(file, "utf8");
  const fileName = relative(packageDirectory, file);
  const isComponent = fileName.includes("/components/");
  const isGeneratedTheme = fileName.includes("/themes/") && fileName.endsWith(".tokens.css");
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
    inspect(
      fileName,
      source,
      /background(?:-image)?\s*:\s*(?:url\(|(?:repeating-)?(?:linear|radial|conic)-gradient\()/gi,
      "THEME_BACKGROUND_ASSET",
    );
  }
  if (!isGeneratedTheme) {
    inspect(fileName, source, /--miaixz-color-[a-z0-9-]+\s*:/g, "THEME_COLOR_OUTSIDE_THEME");
  } else {
    inspect(fileName, source, /\.miaixz-[a-z0-9-]+/g, "THEME_COMPONENT_SELECTOR");
  }
}

for (const directory of [stylesDirectory, resolve(packageDirectory, "dist/styles")]) {
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
  "themes.css",
  "miaixz.css",
  "neutral.css",
  "contrast.css",
]) {
  const file = resolve(stylesDirectory, entry);
  const source = await readFile(file, "utf8").catch(() => "");
  const foundationCount = (source.match(/foundation\.css/g) ?? []).length;
  const componentCount = (source.match(/components\.css/g) ?? []).length;
  if (foundationCount > 1 || componentCount > 1) {
    addFinding(`src/styles/${entry}`, source, 0, "THEME_ENTRY_DUPLICATE", entry);
  }
}

for (const finding of findings) console.error(finding);
if (findings.length > 0) process.exitCode = 1;

function isAllowedTypographyFallback(fileName, value) {
  return (
    fileName === "src/styles/foundation/typography.css" &&
    /var\(--miaixz-(?:text|console)-[a-z0-9-]+,\s*var\(--miaixz-(?:font-size|line-height)-\d+/.test(
      value,
    )
  );
}

function inspect(fileName, source, pattern, code) {
  for (const match of source.matchAll(pattern))
    addFinding(fileName, source, match.index, code, match[0]);
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

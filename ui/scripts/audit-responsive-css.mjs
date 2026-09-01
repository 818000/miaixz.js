import { readFile, readdir } from "node:fs/promises";
import { extname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageDirectory = resolve(fileURLToPath(new URL("..", import.meta.url)));
const styleFiles = await collectFiles(resolve(packageDirectory, "src/styles"), new Set([".css"]));
const sourceFiles = await collectFiles(resolve(packageDirectory, "src"), new Set([".ts", ".tsx"]));
const findings = [];

for (const file of styleFiles) {
  const source = await readFile(file, "utf8");
  const fileName = relative(packageDirectory, file);
  const isFoundation = fileName.includes("/foundation/") || fileName.endsWith("foundation.css");
  const isGeneratedTheme = fileName.includes("/themes/");
  const isResponsive = fileName.endsWith("/foundation/responsive.css");
  if (!isResponsive) {
    inspect(
      fileName,
      source,
      /@media\s*\([^)]*(?:767|768|1023|1024|1279|1280|1439|1440)px[^)]*\)/g,
      "RESPONSIVE_BREAKPOINT_DUPLICATE",
    );
  }
  if (source.includes("100vh") && !source.includes("100dvh")) {
    addFinding(fileName, source, source.indexOf("100vh"), "RESPONSIVE_VH_WITHOUT_DVH", "100vh");
  }
  inspect(
    fileName,
    source,
    /\b(?:margin-left|margin-right|padding-left|padding-right|border-left|border-right|left|right)\s*:/g,
    "RESPONSIVE_PHYSICAL_PROPERTY",
  );
  if (!isFoundation && !isGeneratedTheme && !isResponsive) {
    inspectDimensionDeclarations(fileName, source);
  }
  for (const match of source.matchAll(/@container\s+([a-z0-9-]+)/g)) {
    const name = match[1];
    if (!new RegExp(`container-name\\s*:\\s*${name}\\b`).test(source)) {
      addFinding(fileName, source, match.index, "RESPONSIVE_CONTAINER_UNDECLARED", name);
    }
  }
  for (const match of source.matchAll(/@media[^{}]*\{[\s\S]*?display\s*:\s*none\s*;/g)) {
    addFinding(fileName, source, match.index, "RESPONSIVE_HIDDEN_CONTENT", "display: none");
  }
}

const combinedStyles = (await Promise.all(styleFiles.map((file) => readFile(file, "utf8")))).join(
  "\n",
);
if (!/@media\s*\(pointer:\s*coarse\)[\s\S]*44px/.test(combinedStyles)) {
  addFinding(
    "src/styles",
    combinedStyles,
    0,
    "RESPONSIVE_TOUCH_TARGET",
    "missing 44px coarse-pointer rule",
  );
}
if (
  /\b(?:img|svg|canvas|video)\b/.test(combinedStyles) &&
  !/:is\(img, svg, video, canvas\)[\s\S]*max-inline-size\s*:\s*100%/.test(combinedStyles)
) {
  addFinding("src/styles", combinedStyles, 0, "RESPONSIVE_MEDIA_MAX_SIZE", "media elements");
}

for (const file of sourceFiles) {
  const source = await readFile(file, "utf8");
  const fileName = relative(packageDirectory, file);
  inspect(
    fileName,
    source,
    /(?:window\.innerWidth|document\.documentElement\.clientWidth|matchMedia\(["'][^"']*(?:width|min-width|max-width))/g,
    "RESPONSIVE_SSR_WIDTH_BRANCH",
  );
}

for (const finding of findings) console.error(finding);
if (findings.length > 0) process.exitCode = 1;

function inspect(fileName, source, pattern, code) {
  for (const match of source.matchAll(pattern))
    addFinding(fileName, source, match.index, code, match[0]);
}

function inspectDimensionDeclarations(fileName, source) {
  const declaration =
    /(?:^|[;{]\s*)((?:min-|max-)?(?:inline-size|block-size|width|height)|padding(?:-[a-z]+)?|margin(?:-[a-z]+)?|gap|inset(?:-[a-z]+)?)\s*:\s*([^;{}]+)/gim;
  for (const match of source.matchAll(declaration)) {
    const property = match[1].toLowerCase();
    const value = match[2].trim();
    const dimensions = [...value.matchAll(/-?(?:\d*\.)?\d+(?:px|rem|em|ch|vw|vh|vi|dvh)\b/gi)].map(
      ([dimension]) => dimension.toLowerCase(),
    );
    if (dimensions.length === 0) continue;
    const allowed = dimensions.every(
      (dimension) =>
        dimension === "1em" ||
        dimension === "44px" ||
        dimension === "100vi" ||
        dimension === "100vh" ||
        dimension === "100dvh" ||
        (fileName.endsWith("/components/bar.css") && property === "height" && dimension === "2px"),
    );
    if (!allowed) addFinding(fileName, source, match.index, "RESPONSIVE_FIXED_SIZE", match[0]);
  }
}

function addFinding(fileName, source, index, code, value) {
  const line = source.slice(0, Math.max(index, 0)).split("\n").length;
  findings.push(`${fileName}:${line}: ${code}: ${String(value).trim()}`);
}

async function collectFiles(directory, extensions) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const target = resolve(directory, entry.name);
      return entry.isDirectory()
        ? collectFiles(target, extensions)
        : Promise.resolve(extensions.has(extname(entry.name)) ? [target] : []);
    }),
  );
  return nested.flat().sort();
}

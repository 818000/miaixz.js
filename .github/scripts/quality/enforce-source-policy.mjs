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

import { existsSync } from "node:fs";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { loadWorkspaceRepository, repositoryRoot } from "../miaixz.mjs";

const requireStrictComments = {
  meta: {
    type: "layout",
    docs: {
      description: "Require non-license source comments to use multiline JSDoc blocks.",
    },
    fixable: "whitespace",
    schema: [],
    messages: {
      finalLineText:
        "Only a validated @ts-expect-error directive may share the JSDoc closing line.",
      invalidTypeScriptDirective:
        "TypeScript directives must use @ts-expect-error in multiline JSDoc and include a reason.",
      nonJsdoc: "Every block comment must use the /** ... */ JSDoc form.",
      singleLine: "Every comment must use a multiline JSDoc block.",
    },
  },

  /**
   * Creates the ESLint visitor that enforces multiline source comments.
   *
   * @param {object} context ESLint rule context for the current source file.
   * @returns {object} ESLint syntax visitors for the rule.
   */
  create(context) {
    const sourceCode = context.sourceCode;

    return {
      /**
       * Checks all comments after ESLint has entered the parsed program.
       *
       * @returns {void}
       */
      Program() {
        for (const comment of sourceCode.getAllComments()) {
          const raw = sourceCode.getText(comment);
          const isRepositoryHeader =
            comment.type === "Block" &&
            raw.startsWith("/*\n") &&
            raw.includes("miaixz.org") &&
            sourceCode.text.slice(0, comment.range[0]).trim() === "";
          const typeScriptDirectives = raw.match(/@ts-[\w-]+/gu) ?? [];
          const validTypeScriptDirective =
            typeScriptDirectives.length === 1 &&
            /\n\s*\*\s+@ts-expect-error\s+\S[^\n]*\*\/$/u.test(raw);
          if (typeScriptDirectives.length > 0 && !validTypeScriptDirective) {
            context.report({
              loc: comment.loc,
              messageId: "invalidTypeScriptDirective",
            });
          }
          if (
            comment.type === "Block" &&
            comment.loc.start.line !== comment.loc.end.line &&
            /\S\s*\*\/$/u.test(raw.slice(raw.lastIndexOf("\n") + 1)) &&
            !validTypeScriptDirective
          ) {
            context.report({
              loc: comment.loc,
              messageId: "finalLineText",
            });
          }
          if (comment.type === "Block" && !raw.startsWith("/**") && !isRepositoryHeader) {
            context.report({
              loc: comment.loc,
              messageId: "nonJsdoc",

              /**
               * Converts one descriptive block comment to JSDoc form.
               *
               * @param {object} fixer ESLint source-code fixer.
               * @returns {object} ESLint fix that inserts the JSDoc marker.
               */
              fix(fixer) {
                return fixer.replaceText(comment, raw.replace(/^\/\*/u, "/**"));
              },
            });
            continue;
          }
          if (comment.loc.start.line !== comment.loc.end.line) {
            continue;
          }

          context.report({
            loc: comment.loc,
            messageId: "singleLine",

            /**
             * Rewrites one single-line comment as an equivalent multiline block.
             *
             * @param {object} fixer ESLint source-code fixer.
             * @returns {object} ESLint fix that replaces the original comment.
             */
            fix(fixer) {
              const source = sourceCode.getText();
              const lineStart = source.lastIndexOf("\n", comment.range[0] - 1) + 1;
              const indentation =
                source.slice(lineStart, comment.range[0]).match(/^\s*/)?.[0] ?? "";
              const content =
                comment.type === "Line"
                  ? raw.replace(/^\/\/\/?\s?/, "").trimEnd()
                  : raw
                      .replace(/^\/\*+\s?/, "")
                      .replace(/\s?\*\/$/, "")
                      .trim();
              const replacement = content.startsWith("@ts-")
                ? `/**\n${indentation} * ${content} */`
                : `/**\n${indentation} * ${content}\n${indentation} */`;

              return fixer.replaceText(comment, replacement);
            },
          });
        }
      },
    };
  },
};

const strictComments = {
  rules: {
    "require-jsdoc-comments": requireStrictComments,
  },
};

const scriptPath = fileURLToPath(import.meta.url);

if (process.argv[1] && resolve(process.argv[1]) === scriptPath) {
  await processSourceHeaders(process.argv[2] ?? "--check");
}

/**
 * Checks or writes repository source headers and verifies English-only automation scripts.
 *
 * @param {"--check" | "--write"} mode Whether to report or apply source header changes.
 * @returns {Promise<void>} Promise that resolves after every source file is processed.
 * @throws {Error} If the requested mode is unsupported or a source file cannot be processed.
 */
async function processSourceHeaders(mode) {
  if (mode !== "--check" && mode !== "--write") {
    throw new Error(`Unsupported mode: ${mode}`);
  }

  const rootDirectory = repositoryRoot;
  const sourceDirectories = loadWorkspaceRepository(rootDirectory)
    .workspaces.map(({ rootPath }) => resolve(rootPath, "src"))
    .filter(existsSync);
  const header = normalizeHeader(
    await readFile(resolve(repositoryRoot, ".github/scripts/miaixz.org"), "utf8"),
  );
  const files = (
    await Promise.all(sourceDirectories.map((directory) => collectSourceFiles(directory)))
  ).flat();
  const scriptFiles = await collectScriptFiles(resolve(rootDirectory, ".github/scripts"));
  const changedFiles = [];

  for (const file of files) {
    const source = await readFile(file, "utf8");
    const expected = applyHeader(source, header);

    if (source === expected) continue;
    changedFiles.push(file);
    if (mode === "--write") await writeFile(file, expected, "utf8");
  }

  const scriptLanguageFailures = [];
  for (const file of scriptFiles) {
    const source = await readFile(file, "utf8");
    for (const [index, line] of source.split(/\r?\n/u).entries()) {
      if (/\p{Script=Han}/u.test(line)) {
        scriptLanguageFailures.push(`${file.slice(rootDirectory.length + 1)}:${index + 1}`);
      }
    }
  }

  if (changedFiles.length === 0) {
    process.stdout.write(`Verified source headers in ${files.length} files.\n`);
  } else if (mode === "--write") {
    process.stdout.write(`Updated source headers in ${changedFiles.length} files.\n`);
  } else {
    for (const file of changedFiles) {
      process.stderr.write(`${file.slice(rootDirectory.length + 1)}\n`);
    }
    process.stderr.write(`Source header check failed for ${changedFiles.length} files.\n`);
    process.exitCode = 1;
  }

  if (scriptLanguageFailures.length === 0) {
    process.stdout.write(`Verified English-only content in ${scriptFiles.length} script files.\n`);
  } else {
    for (const location of scriptLanguageFailures) process.stderr.write(`${location}\n`);
    process.stderr.write(
      `Script language check found Han characters in ${scriptLanguageFailures.length} lines.\n`,
    );
    process.exitCode = 1;
  }
}

/**
 * Recursively collects supported source files that require the repository license header.
 *
 * @param {string} directory Absolute source directory to traverse.
 * @returns {Promise<string[]>} Stable absolute source file paths.
 */
async function collectSourceFiles(directory) {
  const supportedExtensions = new Set([".cjs", ".css", ".js", ".jsx", ".mjs", ".ts", ".tsx"]);
  const entries = await readdir(directory, { withFileTypes: true });
  const nestedFiles = await Promise.all(
    entries.map(async (entry) => {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) return collectSourceFiles(path);
      if (entry.isFile() && supportedExtensions.has(extname(entry.name))) return [path];
      return [];
    }),
  );

  return nestedFiles.flat().sort();
}

/**
 * Recursively collects automation scripts for the English-language policy check.
 *
 * @param {string} directory Absolute scripts directory to traverse.
 * @returns {Promise<string[]>} Stable absolute script file paths outside localization folders.
 */
async function collectScriptFiles(directory) {
  const supportedExtensions = new Set([
    ".bash",
    ".cjs",
    ".js",
    ".mjs",
    ".ps1",
    ".py",
    ".sh",
    ".zsh",
  ]);
  const localizedDirectories = new Set(["i18n", "locale", "locales"]);
  const entries = await readdir(directory, { withFileTypes: true });
  const nestedFiles = await Promise.all(
    entries.map(async (entry) => {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory() && !localizedDirectories.has(entry.name)) {
        return collectScriptFiles(path);
      }
      if (entry.isFile() && supportedExtensions.has(extname(entry.name))) return [path];
      return [];
    }),
  );

  return nestedFiles.flat().sort();
}

/**
 * Validates and normalizes the shared repository source header template.
 *
 * @param {string} source Raw header template source.
 * @returns {string} Normalized multiline header without surrounding whitespace.
 * @throws {Error} If the template is not a Miaixz multiline block comment.
 */
function normalizeHeader(source) {
  const header = source.replaceAll("\r\n", "\n").trim();

  if (!/^\/\*\n[\s\S]+\n\s*\*\/$/u.test(header) || !header.includes("miaixz.org")) {
    throw new Error(
      "miaixz.org must contain one multiline block comment with miaixz.org branding.",
    );
  }

  return header;
}

/**
 * Replaces an existing branded header while preserving a byte-order mark and shebang.
 *
 * @param {string} source Complete source file contents.
 * @param {string} header Normalized header block to apply.
 * @returns {string} Source contents with exactly one leading repository header.
 */
function applyHeader(source, header) {
  const byteOrderMark = source.startsWith("\uFEFF") ? "\uFEFF" : "";
  let body = byteOrderMark ? source.slice(1) : source;
  let shebang = "";

  if (body.startsWith("#!")) {
    const lineEnd = body.indexOf("\n");
    shebang = lineEnd < 0 ? body : body.slice(0, lineEnd);
    body = lineEnd < 0 ? "" : body.slice(lineEnd + 1);
  }

  const leadingComment = body.match(/^\/\*[\s\S]*?\*\/(?:\r?\n)*/u)?.[0];
  if (leadingComment?.includes("miaixz.org")) body = body.slice(leadingComment.length);
  body = body.replace(/^(?:[ \t]*\r?\n)+/u, "");
  const prefix = shebang ? `${shebang}\n\n` : "";

  return `${byteOrderMark}${prefix}${header}\n\n${body}`;
}

export default strictComments;

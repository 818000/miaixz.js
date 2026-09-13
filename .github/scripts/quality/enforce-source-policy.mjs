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

import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, extname, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const requireMultilineComments = {
  meta: {
    type: "layout",
    docs: {
      description: "Require every source comment to span multiple lines.",
    },
    fixable: "whitespace",
    schema: [],
    messages: {
      singleLine: "Comments must use a multiline block format.",
    },
  },
  create(context) {
    const sourceCode = context.sourceCode;

    return {
      Program() {
        for (const comment of sourceCode.getAllComments()) {
          if (comment.type !== "Line" && comment.loc.start.line !== comment.loc.end.line) continue;

          context.report({
            loc: comment.loc,
            messageId: "singleLine",
            fix(fixer) {
              const source = sourceCode.getText();
              const lineStart = source.lastIndexOf("\n", comment.range[0] - 1) + 1;
              const indentation =
                source.slice(lineStart, comment.range[0]).match(/^\s*/)?.[0] ?? "";
              const raw = sourceCode.getText(comment);
              const content =
                comment.type === "Line"
                  ? raw.replace(/^\/\/\/?\s?/, "").trimEnd()
                  : raw
                      .replace(/^\/\*+\s?/, "")
                      .replace(/\s?\*\/$/, "")
                      .trim();
              const replacement = raw.startsWith("/* eslint-")
                ? `/* ${content}\n${indentation} */`
                : `/*\n${indentation} * ${content}\n${indentation} */`;

              return fixer.replaceText(comment, replacement);
            },
          });
        }
      },
    };
  },
};

const multilineComments = {
  rules: {
    "require-multiline": requireMultilineComments,
  },
};

const scriptPath = fileURLToPath(import.meta.url);

if (process.argv[1] && resolve(process.argv[1]) === scriptPath) {
  await processSourceHeaders(process.argv[2] ?? "--check");
}

async function processSourceHeaders(mode) {
  if (mode !== "--check" && mode !== "--write") {
    throw new Error(`Unsupported mode: ${mode}`);
  }

  const rootDirectory = resolve(dirname(scriptPath), "../../..");
  const sourceDirectories = [resolve(rootDirectory, "sdk/src"), resolve(rootDirectory, "ui/src")];
  const header = normalizeHeader(
    await readFile(resolve(dirname(scriptPath), "../miaixz.org"), "utf8"),
  );
  const files = (
    await Promise.all(sourceDirectories.map((directory) => collectSourceFiles(directory)))
  ).flat();
  const changedFiles = [];

  for (const file of files) {
    const source = await readFile(file, "utf8");
    const expected = applyHeader(source, header);

    if (source === expected) continue;
    changedFiles.push(file);
    if (mode === "--write") await writeFile(file, expected, "utf8");
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
}

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

function normalizeHeader(source) {
  const header = source.replaceAll("\r\n", "\n").trim();

  if (!/^\/\*\n[\s\S]+\n\s*\*\/$/u.test(header) || !header.includes("miaixz.org")) {
    throw new Error(
      "miaixz.org must contain one multiline block comment with miaixz.org branding.",
    );
  }

  return header;
}

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

export default multilineComments;

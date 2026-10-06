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

/**
 * Recomputes unpublished identities after prevalidating the complete source batch.
 */
import { readFile, writeFile, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  assetsRoot as defaultAssetsRoot,
  FIRST_CODEPOINT,
  MAX_CODEPOINT,
  readIconRecords,
  canonicalJson,
  shardPathFor,
} from "../source.mjs";
import {
  inspectFontSource,
  parseXml,
  parsePlist,
  secureSourcePath,
} from "../fonts/read-font-source.mjs";
import { validateFontProjection } from "../fonts/validate-icon-font.mjs";

/**
 * Assigns ASCII-sorted names to all legal unpublished PUA slots.
 * @param {readonly any[]} records Complete icon records.
 * @returns {any[]} New records with no metadata changes.
 */
export function assignCodepoints(records) {
  if (!Array.isArray(records) || !records.length) throw new Error("Icon set must not be empty.");
  if (records.length > MAX_CODEPOINT - FIRST_CODEPOINT + 1)
    throw new Error("Icon set exceeds U+FFFFD capacity.");
  const names = new Set();
  for (const record of records) {
    if (typeof record.name !== "string" || !/^([a-z][a-z0-9]*)(-[a-z0-9]+)*$/u.test(record.name))
      throw new Error("Invalid canonical name.");
    if (names.has(record.name)) throw new Error("Duplicate canonical name: " + record.name);
    names.add(record.name);
  }
  return [...records]
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
    .map((record, index) => ({ ...record, codepoint: FIRST_CODEPOINT + index }));
}

/**
 * Applies or checks a completely computed source batch; never changes contours.
 * @param {{assetsRoot?:string,mode:"write"|"check"}} options Isolated source root/mode.
 * @returns {Promise<{changedFiles:string[],writtenFiles:string[]}>} Changed/written asset-relative files.
 */
export async function assignIconCodepoints({ assetsRoot = defaultAssetsRoot, mode } = {}) {
  if (!["check", "write"].includes(mode))
    throw new Error("Assignment requires check or write mode.");
  const root = resolve(assetsRoot),
    fontRoot = resolve(root, "fonts");
  const source = await readIconRecords({ assetsRoot: root }),
    font = await inspectFontSource({ fontsRoot: fontRoot });
  validateFontProjection(source, font, { mapping: false });
  const records = assignCodepoints(source.icons),
    order = [".notdef", ...records.map((i) => "miaixz." + i.name)];
  const byName = new Map(records.map((i) => ["miaixz." + i.name, i.codepoint]));
  const shards = new Map();
  for (const record of records) {
    const path = shardPathFor(record.codepoint);
    if (!shards.has(path)) shards.set(path, []);
    shards.get(path).push(record);
  }
  const updates = new Map(),
    removals = source.shardPaths.filter((p) => !shards.has(p));
  updates.set(
    "icons.json",
    canonicalJson({ ...source.manifest, shards: [...shards.keys()] }, "manifest"),
  );
  for (const [path, icons] of shards) updates.set(path, canonicalJson({ icons }, "shard"));
  for (const master of font.masters) {
    const base = "fonts/" + master.relativePath;
    const libPath = base + "/lib.plist",
      libText = await readFile(await secureSourcePath(root, libPath), "utf8"),
      lib = parseXml(libText, libPath);
    const dict = lib.children[0],
      keyIndex = dict.children.findIndex((n) => n.name === "key" && n.text === "public.glyphOrder");
    if (keyIndex < 0 || dict.children[keyIndex + 1]?.name !== "array")
      throw new Error(libPath + ": missing public.glyphOrder.");
    const array = dict.children[keyIndex + 1];
    const leading = libText.slice(libText.lastIndexOf("\n", array.start) + 1, array.start);
    const indent = /^\s*$/u.test(leading) ? leading : "  ";
    /**
     * Escapes XML text before inserting canonical glyph names into plist markup.
     *
     * @param value - Unescaped glyph-name text.
     * @returns Text with ampersand and angle brackets escaped.
     */
    const escape = (value) =>
      value.replace(/&/gu, "&amp;").replace(/</gu, "&lt;").replace(/>/gu, "&gt;");
    const replacement =
      "<array>\n" +
      order.map((n) => indent + "  <string>" + escape(n) + "</string>").join("\n") +
      "\n" +
      indent +
      "</array>";
    updates.set(libPath, libText.slice(0, array.start) + replacement + libText.slice(array.end));
    const contents = parsePlist(
      await readFile(await secureSourcePath(root, base + "/glyphs/contents.plist"), "utf8"),
    );
    for (const [name, filename] of Object.entries(contents)) {
      if (name === ".notdef") continue;
      const path = base + "/glyphs/" + filename,
        text = await readFile(await secureSourcePath(root, path), "utf8"),
        glyph = parseXml(text, path);
      const unicodes = glyph.children.filter((n) => n.name === "unicode"),
        hex = byName.get(name).toString(16).toUpperCase();
      if (unicodes.length === 1) {
        const node = unicodes[0],
          current = text.slice(node.start, node.end);
        const replacement = current.replace(
          /\bhex\s*=\s*(["'])(?:[^"']*)\1/u,
          (_match, quote) => "hex=" + quote + hex + quote,
        );
        updates.set(path, text.slice(0, node.start) + replacement + text.slice(node.end));
      } else {
        const advance = glyph.children.find((n) => n.name === "advance");
        const prefix = text.slice(text.lastIndexOf("\n", advance.start) + 1, advance.start);
        const lineIndent = /^\s*$/u.test(prefix) ? prefix : "  ";
        updates.set(
          path,
          text.slice(0, advance.end) +
            "\n" +
            lineIndent +
            '<unicode hex="' +
            hex +
            '"/>' +
            text.slice(advance.end),
        );
      }
    }
  }
  /**
   * All reads, structural checks and target calculations finish before the first write.
   */
  const changedFiles = [];
  for (const [path, text] of updates) {
    let existing;
    try {
      existing = await readFile(resolve(root, path), "utf8");
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    if (existing !== text) changedFiles.push(path);
  }
  changedFiles.push(...removals);
  if (mode === "check") {
    if (changedFiles.length)
      throw new Error("Unpublished mapping differs: " + changedFiles.join(", "));
    return { changedFiles, writtenFiles: [] };
  }
  const writtenFiles = [];
  for (const path of changedFiles)
    try {
      if (removals.includes(path)) await unlink(resolve(root, path));
      else await writeFile(resolve(root, path), updates.get(path));
      writtenFiles.push(path);
    } catch (error) {
      throw new Error(
        "Assignment write failed at " +
          path +
          "; written=" +
          JSON.stringify(writtenFiles) +
          "; pending=" +
          JSON.stringify(changedFiles.filter((p) => !writtenFiles.includes(p))),
        { cause: error },
      );
    }
  return { changedFiles, writtenFiles };
}

if (
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  const args = process.argv.slice(2);
  if (args.length !== 1 || !["--write", "--check"].includes(args[0]))
    throw new Error("Expected exactly --write or --check.");
  const result = await assignIconCodepoints({ mode: args[0].slice(2) });
  process.stdout.write(
    "Icon assignment " + args[0].slice(2) + ": " + result.changedFiles.length + " changed files.\n",
  );
}

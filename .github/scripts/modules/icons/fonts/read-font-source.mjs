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
 * Structured Designspace, UFO, plist and GLIF reader; never reads business JSON.
 */
import { readFile, readdir, realpath } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { measureGlyph } from "./font-geometry.mjs";
const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../../");
const { SaxesParser } = createRequire(resolve(repositoryRoot, "package.json"))("saxes");
/**
 * Rejects an invalid structured-source invariant.
 * @param {unknown} condition Invariant that must hold.
 * @param {string} message Failure diagnostic.
 * @returns {void} Returns normally when the invariant holds; otherwise throws.
 */
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
/**
 * Selects ordered child nodes with a specific XML name.
 * @param {object} node Parsed XML node with an ordered children array.
 * @param {string} name Exact XML element name to match.
 * @returns {object[]} Matching child nodes in source order.
 */
const children = (node, name) => node.children.filter((child) => child.name === name);
/**
 * Requires exactly one named child node.
 * @param {object} node Parsed parent XML node.
 * @param {string} name Required child element name.
 * @returns {object} The sole matching child; throws on absence or duplicates.
 */
const only = (node, name) => {
  const found = children(node, name);
  assert(found.length === 1, node.name + " requires exactly one " + name);
  return found[0];
};
/**
 * Decodes a finite XML numeric scalar.
 * @param {string} value Numeric XML attribute or scalar text.
 * @param {string} label Source path or metric used in diagnostics.
 * @returns {number} Parsed finite numeric value.
 */
const num = (value, label) => {
  assert(
    typeof value === "string" && /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/u.test(value),
    label + " is not a number.",
  );
  const result = Number(value);
  assert(Number.isFinite(result), label + " must be finite.");
  return result;
};

/**
 * Parses XML into ordered nodes with character ranges for surgical edits.
 * @param {string} text XML text.
 * @param {string} label Diagnostic path.
 * @returns {any} Root node.
 */
export function parseXml(text, label = "XML") {
  const parser = new SaxesParser({ position: true }),
    stack = [];
  let root, start;
  parser.on("error", (error) => {
    throw new Error(label + ": " + error.message);
  });
  parser.on("doctype", (value) => {
    assert(
      value.trim() ===
        'plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd"',
      label + ": unsupported DOCTYPE or entity declaration.",
    );
  });
  parser.on("opentagstart", () => {
    start = text.lastIndexOf("<", parser.position - 1);
  });
  parser.on("opentag", (tag) => {
    const node = {
      name: tag.name,
      attributes: { ...tag.attributes },
      children: [],
      text: "",
      start,
      openEnd: parser.position,
      end: undefined,
    };
    if (stack.length) stack.at(-1).children.push(node);
    else {
      assert(!root, label + ": multiple roots.");
      root = node;
    }
    stack.push(node);
  });
  parser.on("text", (value) => {
    if (stack.length) stack.at(-1).text += value;
    else assert(!value.trim(), label + ": unexpected text.");
  });
  parser.on("cdata", (value) => {
    assert(stack.length, label + ": unexpected CDATA.");
    stack.at(-1).text += value;
  });
  parser.on("closetag", () => {
    stack.pop().end = parser.position;
  });
  parser.write(text).close();
  assert(root && stack.length === 0, label + ": incomplete XML.");
  return root;
}

/**
 * Decodes a typed property list, rejecting ambiguous or nonfinite values.
 * @param {string} text XML property list.
 * @param {string} label Diagnostic path.
 * @returns {any} JSON-serializable typed value.
 */
export function parsePlist(text, label = "plist") {
  const root = parseXml(text, label);
  assert(
    root.name === "plist" &&
      root.attributes.version === "1.0" &&
      root.children.length === 1 &&
      !root.text.trim(),
    label + ": invalid plist root.",
  );
  /**
   * Decodes one plist node without losing scalar types or array order.
   * @param {object} node Parsed plist value node.
   * @returns {unknown} Decoded dictionary, array, scalar, normalized date, or Base64 string.
   */
  function decode(node) {
    const value = node.text;
    if (node.name === "dict") {
      assert(!value.trim() && node.children.length % 2 === 0, label + ": invalid dict.");
      const result = Object.create(null);
      for (let i = 0; i < node.children.length; i += 2) {
        const key = node.children[i];
        assert(key.name === "key" && !key.children.length, label + ": missing dictionary key.");
        assert(!Object.hasOwn(result, key.text), label + ": duplicate key " + key.text);
        result[key.text] = decode(node.children[i + 1]);
      }
      return result;
    }
    if (node.name === "array") {
      assert(!value.trim(), label + ": invalid array text.");
      return node.children.map(decode);
    }
    assert(!node.children.length, label + ": nested scalar.");
    if (node.name === "string") return value;
    if (node.name === "true" || node.name === "false") {
      assert(!value.trim(), label + ": invalid boolean.");
      return node.name === "true";
    }
    if (node.name === "integer") {
      assert(/^[+-]?\d+$/u.test(value.trim()), label + ": invalid integer.");
      const number = num(value.trim(), label);
      assert(Number.isSafeInteger(number), label + ": unsafe integer.");
      return number;
    }
    if (node.name === "real") return num(value.trim(), label);
    if (node.name === "date") {
      const raw = value.trim();
      assert(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/u.test(raw),
        label + ": invalid date.",
      );
      const date = new Date(raw);
      assert(
        Number.isFinite(date.getTime()) && date.toISOString().slice(0, 19) === raw.slice(0, 19),
        label + ": invalid date.",
      );
      return date.toISOString();
    }
    if (node.name === "data") {
      const raw = value.replace(/\s/gu, "");
      assert(
        /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/u.test(raw),
        label + ": invalid Base64.",
      );
      const canonical = Buffer.from(raw, "base64").toString("base64");
      assert(canonical === raw, label + ": noncanonical Base64.");
      return canonical;
    }
    throw new Error(label + ": unsupported plist type " + node.name);
  }
  return decode(root.children[0]);
}

/**
 * Resolves and checks a relative source path against its actual enclosing root.
 * @param {string} root Allowed root.
 * @param {string} pathname Relative path.
 * @returns {Promise<string>} Confined absolute path.
 */
export async function secureSourcePath(root, pathname) {
  assert(
    typeof pathname === "string" &&
      !isAbsolute(pathname) &&
      !pathname.includes("\\") &&
      !/^[A-Za-z]:/u.test(pathname),
    "Source path must be relative: " + pathname,
  );
  const path = resolve(root, pathname),
    lexical = relative(resolve(root), path);
  assert(
    lexical && lexical !== ".." && !lexical.startsWith(".." + sep) && !isAbsolute(lexical),
    "Escaping source path: " + pathname,
  );
  const [actual, base] = await Promise.all([realpath(path), realpath(root)]);
  assert(actual.startsWith(base + sep), "Source symlink escapes root: " + pathname);
  return path;
}

/**
 * Decodes one GLIF while retaining outline child order.
 * @param {string} text GLIF format-2 XML text.
 * @param {string} label Source path used in diagnostics.
 * @returns {object} Glyph name, advance, Unicode values, contours, components, and edit ranges.
 */
function parseGlif(text, label) {
  const root = parseXml(text, label);
  assert(
    root.name === "glyph" &&
      root.attributes.format === "2" &&
      typeof root.attributes.name === "string",
    label + ": invalid GLIF root.",
  );
  const allowed = new Set(["advance", "unicode", "outline", "lib", "note"]);
  assert(
    root.children.every((n) => allowed.has(n.name)),
    label + ": unsupported GLIF structure.",
  );
  const advance = only(root, "advance");
  const codes = children(root, "unicode").map((n) => {
    assert(
      typeof n.attributes.hex === "string" && /^[0-9A-Fa-f]{1,6}$/u.test(n.attributes.hex),
      label + ": invalid Unicode.",
    );
    const code = parseInt(n.attributes.hex, 16);
    assert(
      code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff),
      label + ": invalid Unicode scalar.",
    );
    return code;
  });
  assert(codes.length <= 1, label + ": multiple Unicode values.");
  const outlines = children(root, "outline");
  assert(outlines.length <= 1, label + ": multiple outlines.");
  const contours = [],
    components = [];
  for (const [outlineIndex, node] of (outlines[0]?.children ?? []).entries()) {
    if (node.name === "contour") {
      assert(
        node.children.every((n) => n.name === "point"),
        label + ": unsupported contour child.",
      );
      const points = node.children.map((p) => {
        const type = p.attributes.type ?? "offcurve";
        assert(
          ["move", "line", "curve", "qcurve", "offcurve"].includes(type),
          label + ": invalid point type.",
        );
        assert(
          p.attributes.smooth === undefined ||
            p.attributes.smooth === "yes" ||
            p.attributes.smooth === "no",
          label + ": invalid smooth value.",
        );
        return {
          x: num(p.attributes.x, label + " x"),
          y: num(p.attributes.y, label + " y"),
          type,
          smooth: p.attributes.smooth === "yes",
          name: p.attributes.name ?? null,
        };
      });
      assert(points.length > 0, label + ": empty contour.");
      assert(!points.some((p) => p.type === "move"), label + ": open contour.");
      contours.push({ outlineIndex, closed: true, points });
    } else if (node.name === "component") {
      assert(
        typeof node.attributes.base === "string" && node.attributes.base.length > 0,
        label + ": missing component base.",
      );
      const keys = ["xScale", "xyScale", "yxScale", "yScale", "xOffset", "yOffset"],
        defaults = [1, 0, 0, 1, 0, 0];
      const transform = keys.map((k, i) =>
        node.attributes[k] === undefined ? defaults[i] : num(node.attributes[k], label + " " + k),
      );
      assert(
        Number.isFinite(transform[0] * transform[3] - transform[1] * transform[2]) &&
          transform[0] * transform[3] - transform[1] * transform[2] !== 0,
        label + ": singular component.",
      );
      components.push({ outlineIndex, base: node.attributes.base, transform });
    } else throw new Error(label + ": unsupported outline child " + node.name);
  }
  const topology = JSON.stringify(
    [
      ...contours.map((c) => ({
        index: c.outlineIndex,
        kind: "contour",
        closed: c.closed,
        points: c.points.map((p) => [p.type, p.smooth, p.name]),
      })),
      ...components.map((c) => ({ index: c.outlineIndex, kind: "component", base: c.base })),
    ].sort((a, b) => a.index - b.index),
  );
  return {
    glyphName: root.attributes.name,
    codepoints: codes,
    advance: {
      width: num(advance.attributes.width, label + " advance.width"),
      height:
        advance.attributes.height === undefined
          ? 0
          : num(advance.attributes.height, label + " advance.height"),
    },
    contours,
    components,
    topologySignature: topology,
  };
}

/**
 * Lists the exact source file inputs used by the reader, relative to fontsRoot.
 * @param {{fontsRoot:string,source:any}} input Previously inspected source.
 * @returns {Promise<string[]>} Reader input paths.
 */
export async function fontSourceFiles({ fontsRoot, source }) {
  const files = ["miaixz-icons.designspace"];
  for (const master of source.masters) {
    const base = master.relativePath;
    files.push(
      ...[
        "fontinfo.plist",
        "lib.plist",
        "metainfo.plist",
        "layercontents.plist",
        "glyphs/contents.plist",
      ].map((p) => base + "/" + p),
    );
    const contents = parsePlist(
      await readFile(
        await secureSourcePath(resolve(fontsRoot, base), "glyphs/contents.plist"),
        "utf8",
      ),
    );
    files.push(...Object.values(contents).map((p) => base + "/glyphs/" + p));
  }
  return files.sort();
}

/**
 * Reads the complete six-master matrix without folding or reordering its sources.
 * @param {{fontsRoot:string}} input Font root.
 * @returns {Promise<any>} axes/masters/defaultMaster/glyphOrder/glyphs.
 */
export async function inspectFontSource({ fontsRoot }) {
  const root = resolve(fontsRoot),
    designspace = parseXml(
      await readFile(await secureSourcePath(root, "miaixz-icons.designspace"), "utf8"),
      "miaixz-icons.designspace",
    );
  assert(designspace.name === "designspace", "Invalid Designspace root.");
  const allowedNodes = new Set([
    "designspace",
    "axes",
    "axis",
    "labels",
    "label",
    "labelname",
    "sources",
    "source",
    "location",
    "dimension",
    "info",
    "lib",
    "instances",
    "instance",
    "familyname",
    "stylename",
  ]);
  /**
   * Rejects unsupported Designspace structures.
   * @param {object} node Parsed Designspace node whose descendants are checked recursively.
   * @returns {void} Throws if a node name is outside the supported Designspace vocabulary.
   */
  function checkNodes(node) {
    assert(allowedNodes.has(node.name), "Unsupported Designspace node: " + node.name);
    node.children.forEach(checkNodes);
  }
  checkNodes(designspace);
  const axes = only(designspace, "axes").children.map((node) => {
    assert(node.name === "axis", "Invalid axes child.");
    const a = node.attributes;
    return {
      name: a.name,
      tag: a.tag,
      minimum: num(a.minimum, "axis minimum"),
      default: num(a.default, "axis default"),
      maximum: num(a.maximum, "axis maximum"),
    };
  });
  assert(
    axes.length === 2 && axes[0].tag === "FILL" && axes[1].tag === "opsz",
    "Designspace requires ordered FILL/opsz axes.",
  );
  assert(
    new Set(axes.map((a) => a.name)).size === axes.length &&
      axes.every(
        (a) => typeof a.name === "string" && a.minimum <= a.default && a.default <= a.maximum,
      ),
    "Invalid Designspace axes.",
  );
  const masters = [],
    rawMasters = [],
    actualPaths = new Set(),
    seenLocations = new Set();
  let defaultMaster = -1,
    infoMaster = -1,
    libMaster = -1;
  const sources = only(designspace, "sources").children;
  assert(sources.length === 6, "Designspace requires six source combinations.");
  for (const [index, node] of sources.entries()) {
    assert(node.name === "source", "Invalid sources child.");
    const path = await secureSourcePath(root, node.attributes.filename),
      actual = await realpath(path);
    assert(!actualPaths.has(actual), "Duplicate or aliased master path.");
    actualPaths.add(actual);
    const location = Object.create(null);
    for (const d of only(node, "location").children) {
      assert(
        d.name === "dimension" && d.attributes.yvalue === undefined,
        "Unsupported source dimension.",
      );
      const axis = axes.find((a) => a.name === d.attributes.name);
      assert(axis && !Object.hasOwn(location, axis.tag), "Unknown or duplicate source axis.");
      location[axis.tag] = num(d.attributes.xvalue, "source coordinate");
    }
    assert(Object.keys(location).length === axes.length, "Missing source dimensions.");
    assert(
      [axes[0].minimum, axes[0].maximum].includes(location.FILL) &&
        [axes[1].minimum, axes[1].default, axes[1].maximum].includes(location.opsz),
      "Invalid master location.",
    );
    const locationKey = JSON.stringify([location.FILL, location.opsz]);
    assert(!seenLocations.has(locationKey), "Duplicate master location.");
    seenLocations.add(locationKey);
    if (location.FILL === axes[0].default && location.opsz === axes[1].default) {
      assert(defaultMaster === -1, "Multiple default masters.");
      defaultMaster = index;
    }
    for (const [name, flag] of [
      ["info", 1],
      ["lib", 2],
    ])
      for (const copy of children(node, name)) {
        assert(copy.attributes.copy === "1", "Unsupported source copy flag.");
        if (flag === 1) {
          assert(infoMaster === -1, "Multiple info copies.");
          infoMaster = index;
        } else {
          assert(libMaster === -1, "Multiple lib copies.");
          libMaster = index;
        }
      }
    const metadata = {};
    /**
     * Reads and decodes a plist confined to the current UFO master.
     *
     * @param filename - UFO-relative plist path.
     * @returns Promise resolving to the decoded typed plist value.
     */
    const readPlist = async (filename) =>
      parsePlist(
        await readFile(await secureSourcePath(path, filename), "utf8"),
        node.attributes.filename + "/" + filename,
      );
    metadata.fontinfo = await readPlist("fontinfo.plist");
    metadata.lib = await readPlist("lib.plist");
    const meta = await readPlist("metainfo.plist"),
      layers = await readPlist("layercontents.plist");
    assert(
      meta.formatVersion === 3 &&
        JSON.stringify(layers) === JSON.stringify([["public.default", "glyphs"]]),
      "Unsupported UFO format or layers: " + node.attributes.filename,
    );
    const contents = await readPlist("glyphs/contents.plist"),
      glyphRoot = resolve(path, "glyphs"),
      order = metadata.lib["public.glyphOrder"];
    assert(
      Array.isArray(order) &&
        new Set(order).size === order.length &&
        order.every((n) => typeof n === "string"),
      "Invalid public.glyphOrder: " + node.attributes.filename,
    );
    assert(
      JSON.stringify([...order].sort()) === JSON.stringify(Object.keys(contents).sort()),
      "contents/order set differs: " + node.attributes.filename,
    );
    assert(
      new Set(Object.values(contents)).size === Object.keys(contents).length,
      "Duplicate GLIF file reference.",
    );
    const glifs = (await readdir(glyphRoot)).filter((p) => p.endsWith(".glif")).sort();
    assert(
      JSON.stringify(glifs) === JSON.stringify(Object.values(contents).sort()),
      "contents/disk GLIF set differs: " + node.attributes.filename,
    );
    const glyphs = new Map();
    for (const [name, filename] of Object.entries(contents)) {
      const glyph = parseGlif(
        await readFile(await secureSourcePath(glyphRoot, filename), "utf8"),
        node.attributes.filename + "/" + filename,
      );
      assert(glyph.glyphName === name, "GLIF internal name differs: " + filename);
      if (name === ".notdef")
        assert(glyph.codepoints.length === 0, ".notdef must have no Unicode.");
      glyphs.set(name, glyph);
    }
    const relativePath = relative(root, path).split(sep).join("/");
    masters.push({ relativePath, location, metadata });
    rawMasters.push(glyphs);
  }
  assert(
    defaultMaster !== -1 && infoMaster === defaultMaster && libMaster === defaultMaster,
    "Default info/lib source must be unique default master.",
  );
  const glyphOrder = [...masters[defaultMaster].metadata.lib["public.glyphOrder"]];
  const glyphs = glyphOrder.map((name) => {
    const reference = rawMasters[defaultMaster].get(name);
    const matrix = rawMasters.map((map, index) => {
      assert(
        map.size === glyphOrder.length && map.has(name),
        "Master glyph set differs: " + masters[index].relativePath + "/" + name,
      );
      const glyph = map.get(name);
      assert(
        JSON.stringify(glyph.codepoints) === JSON.stringify(reference.codepoints),
        "Unicode differs: " + masters[index].relativePath + "/" + name,
      );
      const measured = measureGlyph({ glyphName: name, glyphs: map });
      return {
        masterPath: masters[index].relativePath,
        advance: glyph.advance,
        contours: glyph.contours,
        components: glyph.components,
        bounds: measured.bounds,
        center: measured.center,
        nonEmpty: measured.nonEmpty,
        topologySignature: glyph.topologySignature,
      };
    });
    return {
      glyphName: name,
      canonicalName: name === ".notdef" ? null : name.startsWith("miaixz.") ? name.slice(7) : null,
      codepoints: [...reference.codepoints],
      masters: matrix,
    };
  });
  return { axes, masters, defaultMaster, glyphOrder, glyphs };
}

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
 * Creates isolated canonical JSON and six-master font-source fixtures for icon tests.
 * Production UFO files are never modified.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import {
  canonicalJson,
  shardPathFor,
} from "../../../../../.github/scripts/modules/icons/source.mjs";

/**
 * Fixed test input, not a production threshold source.
 */
export const fixtureDesign = {
  font: {
    familyName: "Miaixz Icons",
    outputFile: "miaixz-icons.woff2",
    unitsPerEm: 960,
  },
  axes: {
    fill: {
      tag: "FILL",
      minimum: 0,
      default: 0,
      maximum: 1,
    },
    opticalSize: {
      tag: "opsz",
      minimum: 12,
      default: 24,
      maximum: 40,
    },
  },
  sizes: {
    indicator: {
      pixels: 12,
      opticalSize: 12,
    },
    inline: {
      pixels: 16,
      opticalSize: 16,
    },
    control: {
      pixels: 16,
      opticalSize: 16,
    },
    navigation: {
      pixels: 20,
      opticalSize: 20,
    },
    feature: {
      pixels: 24,
      opticalSize: 24,
    },
    display: {
      pixels: 32,
      opticalSize: 32,
    },
  },
  grid: {
    safeBounds: [60, -100, 900, 740],
    opticalCenter: [480, 320],
    lengthTolerance: 2,
  },
  opticalClasses: {
    regular: {
      longestEdge: [750, 800],
      width: [750, 800],
      height: [750, 800],
      aspectRatio: [0.9, 1.1],
      centerTolerance: 29,
    },
    wide: {
      longestEdge: [790, 830],
      width: [790, 830],
      height: [590, 650],
      aspectRatio: [1.22, 1.42],
      centerTolerance: 32,
    },
    tall: {
      longestEdge: [790, 830],
      width: [610, 670],
      height: [790, 830],
      aspectRatio: [0.72, 0.84],
      centerTolerance: 32,
    },
    directional: {
      longestEdge: [790, 830],
      width: [790, 830],
      height: [650, 710],
      aspectRatio: [1.12, 1.3],
      centerTolerance: 36,
    },
    compound: {
      longestEdge: [770, 810],
      width: [770, 810],
      height: [750, 810],
      aspectRatio: [0.95, 1.12],
      centerTolerance: 32,
    },
    "line-symbol": {
      longestEdge: [730, 790],
      width: [730, 790],
      height: [570, 630],
      aspectRatio: [1.17, 1.37],
      centerTolerance: 29,
    },
  },
  limits: {
    fontBytes: 524288,
    runtimeBytes: 163840,
  },
};

/**
 * Writes a fresh fixture with caller-supplied identities and design.
 * @param {{directory:string,categories:any[],records:any[],design:any}} input Required inputs.
 * @returns {Promise<{assetsRoot:string,fontsRoot:string,writtenFiles:string[]}>} Isolated roots/files.
 */
export async function createIconFixture({ directory, categories, records, design }) {
  if (
    typeof directory !== "string" ||
    !Array.isArray(categories) ||
    !Array.isArray(records) ||
    !design
  )
    throw new TypeError("directory, categories, records and design are required.");
  const assetsRoot = resolve(directory, "assets"),
    fontsRoot = resolve(assetsRoot, "fonts"),
    writtenFiles = [];
  /**
   * Creates one new fixture file and records its normalized relative path.
   *
   * @param path - Path relative to the isolated fixture assets directory.
   * @param text - Fixture contents written with exclusive creation.
   * @returns Promise resolving after the file is written and recorded.
   */
  const write = async (path, text) => {
    const file = resolve(assetsRoot, path);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, text, { flag: "wx" });
    writtenFiles.push(relative(assetsRoot, file).split(sep).join("/"));
  };
  /**
   * Escapes fixture scalar values for XML text and quoted attributes.
   *
   * @param value - Scalar value to convert to text.
   * @returns XML-safe text including escaped double quotes.
   */
  const xmlEscape = (value) =>
    String(value)
      .replace(/&/gu, "&amp;")
      .replace(/</gu, "&lt;")
      .replace(/>/gu, "&gt;")
      .replace(/"/gu, "&quot;");
  /**
   * Serializes fixture dictionaries, arrays, and scalar values into typed plist nodes.
   *
   * @param value - Fixture value to serialize recursively.
   * @returns XML markup for one plist value.
   */
  const plistValue = (value) => {
    if (Array.isArray(value)) return "<array>" + value.map(plistValue).join("") + "</array>";
    if (value && typeof value === "object")
      return (
        "<dict>" +
        Object.entries(value)
          .map(([key, v]) => "<key>" + xmlEscape(key) + "</key>" + plistValue(v))
          .join("") +
        "</dict>"
      );
    if (typeof value === "number")
      return (
        "<" +
        (Number.isInteger(value) ? "integer" : "real") +
        ">" +
        value +
        "</" +
        (Number.isInteger(value) ? "integer" : "real") +
        ">"
      );
    if (typeof value === "boolean") return value ? "<true/>" : "<false/>";
    return "<string>" + xmlEscape(value) + "</string>";
  };
  /**
   * Wraps a typed fixture value in an XML property-list document.
   *
   * @param value - Fixture root value.
   * @returns Complete UTF-8 plist text ending with one line feed.
   */
  const plist = (value) =>
    '<?xml version="1.0" encoding="UTF-8"?>\n<plist version="1.0">' +
    plistValue(value) +
    "</plist>\n";
  const schemaPath = resolve(
    dirname(fileURLToPath(import.meta.url)),
    "../../../src/assets/schema.json",
  );
  await write("schema.json", await readFile(schemaPath, "utf8"));
  const shards = new Map();
  for (const record of records) {
    const path = shardPathFor(record.codepoint);
    if (!shards.has(path)) shards.set(path, []);
    shards.get(path).push(record);
  }
  const shardPaths = [...shards.keys()].sort();
  await write("icons.json", canonicalJson({ categories, shards: shardPaths }, "manifest"));
  await write("design.json", canonicalJson(design, "design"));
  for (const path of shardPaths)
    await write(path, canonicalJson({ icons: shards.get(path) }, "shard"));
  const masterPaths = [],
    sources = [],
    order = [".notdef", ...records.map((r) => "miaixz." + r.name)];
  const names = ["Fill", "Optical Size"],
    axes = Object.values(design.axes);
  for (const fill of [axes[0].minimum, axes[0].maximum])
    for (const opsz of [axes[1].minimum, axes[1].default, axes[1].maximum]) {
      const path = "fixture-" + masterPaths.length + ".ufo";
      masterPaths.push(path);
      const isDefault = fill === axes[0].default && opsz === axes[1].default;
      sources.push(
        '<source filename="' +
          path +
          '">' +
          (isDefault ? '<info copy="1"/><lib copy="1"/>' : "") +
          '<location><dimension name="Fill" xvalue="' +
          fill +
          '"/><dimension name="Optical Size" xvalue="' +
          opsz +
          '"/></location></source>',
      );
      await write(
        "fonts/" + path + "/fontinfo.plist",
        plist({
          familyName: design.font.familyName,
          unitsPerEm: design.font.unitsPerEm,
          ascender: 800,
          descender: -160,
        }),
      );
      await write("fonts/" + path + "/lib.plist", plist({ "public.glyphOrder": order }));
      await write(
        "fonts/" + path + "/metainfo.plist",
        plist({ creator: "org.miaixz.fixture", formatVersion: 3 }),
      );
      await write("fonts/" + path + "/layercontents.plist", plist([["public.default", "glyphs"]]));
      const contents = {
        ".notdef": "_notdef.glif",
        ...Object.fromEntries(
          records.map((r) => ["miaixz." + r.name, "miaixz." + r.name + ".glif"]),
        ),
      };
      await write("fonts/" + path + "/glyphs/contents.plist", plist(contents));
      for (const name of order) {
        const record = records.find((r) => "miaixz." + r.name === name);
        const rectangle =
          '<outline><contour><point x="100" y="-60" type="line"/><point x="860" y="-60" type="line"/><point x="860" y="700" type="line"/><point x="100" y="700" type="line"/></contour></outline>';
        await write(
          "fonts/" + path + "/glyphs/" + contents[name],
          '<?xml version="1.0" encoding="UTF-8"?>\n<glyph name="' +
            name +
            '" format="2"><advance width="' +
            design.font.unitsPerEm +
            '"/>' +
            (record ? '<unicode hex="' + record.codepoint.toString(16).toUpperCase() + '"/>' : "") +
            rectangle +
            "</glyph>\n",
        );
      }
    }
  await write(
    "fonts/miaixz-icons.designspace",
    '<designspace format="5.0"><axes>' +
      axes
        .map(
          (a, i) =>
            '<axis name="' +
            names[i] +
            '" tag="' +
            a.tag +
            '" minimum="' +
            a.minimum +
            '" default="' +
            a.default +
            '" maximum="' +
            a.maximum +
            '"/>',
        )
        .join("") +
      "</axes><sources>" +
      sources.join("") +
      "</sources></designspace>\n",
  );
  return { assetsRoot, fontsRoot, writtenFiles };
}

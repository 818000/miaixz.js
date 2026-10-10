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
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  canonicalJson,
  shardPathFor,
} from "../../../../../.github/scripts/modules/icons/source.mjs";
import {
  fontCopyright,
  fontLicense,
  withFontCopyrightHeader,
} from "../../../../../.github/scripts/modules/icons/fonts/read-font-source.mjs";

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
      longestEdge: [680, 800],
      centerTolerance: 29,
    },
    wide: {
      longestEdge: [740, 840],
      centerTolerance: 32,
    },
    tall: {
      longestEdge: [740, 840],
      centerTolerance: 32,
    },
    directional: {
      longestEdge: [640, 840],
      centerTolerance: 36,
    },
    compound: {
      longestEdge: [720, 840],
      centerTolerance: 32,
    },
    "line-symbol": {
      longestEdge: [560, 800],
      centerTolerance: 29,
    },
  },
  limits: {
    fontBytes: 524288,
    runtimeBytes: 163840,
  },
  visual: {
    strokeWidths: {
      compact: {
        target: 82,
        tolerance: 6,
      },
      standard: {
        target: 70,
        tolerance: 4,
      },
      display: {
        target: 62,
        tolerance: 4,
      },
    },
    frameCornerRadius: {
      standard: 40,
    },
    circleApproximationError: 0.5,
    comparison: {
      alphaThreshold: 128,
      boundaryPixels: 1,
      areaRelativeError: 0.05,
      centroidPixels: 0.5,
      paddingCssPixels: 2,
      compiledOutlineUnits: 1,
      subdivisionUnits: 0.05,
    },
  },
};

/**
 * Constructs an analytic-circle test contour; this is fixture geometry, not a production icon.
 * @param {number} radius Circle radius in font units.
 * @returns {object} Four cubic arcs with true on-curve positions and independent controls.
 */
export function circleFixtureContour(radius = 320) {
  const k = (4 / 3) * Math.tan(Math.PI / 8),
    points = [];
  const on = (x, y, type) => ({
    x,
    y,
    type,
    smooth: type === "curve",
    name: null,
  });
  points.push(on(480 + radius, 320, "curve"));
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2,
      b = ((i + 1) * Math.PI) / 2;
    points.push(
      on(
        480 + radius * (Math.cos(a) - k * Math.sin(a)),
        320 + radius * (Math.sin(a) + k * Math.cos(a)),
        "offcurve",
      ),
    );
    points.push(
      on(
        480 + radius * (Math.cos(b) + k * Math.sin(b)),
        320 + radius * (Math.sin(b) - k * Math.cos(b)),
        "offcurve",
      ),
    );
    if (i < 3) points.push(on(480 + radius * Math.cos(b), 320 + radius * Math.sin(b), "curve"));
  }
  return { closed: true, outlineIndex: 0, points };
}

/**
 * Defines explicit geometry expectations using arithmetic, not the implementation under test.
 * @param {object[]} previous Existing exact-curve cases whose measurements remain applicable.
 * @returns {object[]} ASCII-ordered new-rule cases, preserving all original curve measurement cases.
 */
export function refinementGeometryCases(previous) {
  const cases = previous.filter((c) => c.kind === "measureGlyph");
  const rectangle = (width, height, cx = 480, cy = 320) => ({
    bounds: [cx - width / 2, cy - height / 2, cx + width / 2, cy + height / 2],
    width,
    height,
    longestEdge: Math.max(width, height),
    aspectRatio: width / height,
    center: [cx, cy],
    nonEmpty: true,
  });
  for (const [opticalClass, rule] of Object.entries(fixtureDesign.opticalClasses)) {
    const measurement = rectangle((rule.longestEdge[0] + rule.longestEdge[1]) / 2, 140);
    const input = { measurement, opticalClass, design: fixtureDesign };
    cases.push({
      id: "validate-" + opticalClass + "-natural-width-height",
      kind: "validateGlyphGeometry",
      input,
      expected: { centerDistance: 0, violations: [] },
    });
    for (const side of ["lower", "upper"])
      for (const outside of [false, true]) {
        const index = side === "lower" ? 0 : 1,
          sign = index === 0 ? -1 : 1;
        const actual =
          rule.longestEdge[index] +
          sign * (fixtureDesign.grid.lengthTolerance + (outside ? 0.000001 : 0));
        const m = { ...measurement, longestEdge: actual };
        cases.push({
          id:
            "validate-" +
            opticalClass +
            "-longestEdge-" +
            side +
            "-" +
            (outside ? "outside" : "boundary"),
          kind: "validateGlyphGeometry",
          input: { ...input, measurement: m },
          expected: {
            centerDistance: 0,
            violations: outside
              ? [
                  {
                    metric: "longestEdge",
                    actual,
                    expected: rule.longestEdge,
                    tolerance: 2,
                  },
                ]
              : [],
          },
        });
      }
    for (const outside of [false, true]) {
      const distance = rule.centerTolerance + (outside ? 0.000001 : 0),
        m = { ...measurement, center: [480, 320 + distance] };
      cases.push({
        id: "validate-" + opticalClass + "-center-" + (outside ? "outside" : "boundary"),
        kind: "validateGlyphGeometry",
        input: { ...input, measurement: m },
        expected: {
          centerDistance: Math.abs(m.center[1] - 320),
          violations: outside
            ? [
                {
                  metric: "centerDistance",
                  actual: Math.abs(m.center[1] - 320),
                  expected: [0, rule.centerTolerance],
                  tolerance: 0,
                },
              ]
            : [],
        },
      });
    }
    for (const outside of [false, true]) {
      const bounds = [60 - (outside ? 0.000001 : 0), ...measurement.bounds.slice(1)];
      cases.push({
        id: "validate-" + opticalClass + "-safe-" + (outside ? "outside" : "boundary"),
        kind: "validateGlyphGeometry",
        input: { ...input, measurement: { ...measurement, bounds } },
        expected: {
          centerDistance: 0,
          violations: outside
            ? [
                {
                  metric: "safeBounds",
                  actual: bounds,
                  expected: fixtureDesign.grid.safeBounds,
                  tolerance: 0,
                },
              ]
            : [],
        },
      });
    }
    const invalid = structuredClone(fixtureDesign);
    invalid.opticalClasses[opticalClass].longestEdge = [900, 920];
    cases.push({
      id: "design-" + opticalClass + "-unreachable-edge",
      kind: "validateDesignGeometry",
      input: invalid,
      expected: {
        throws: true,
        messageIncludes: [opticalClass, "contradictory"],
      },
    });
  }
  cases.push({
    id: "design-production",
    kind: "validateDesignGeometry",
    input: fixtureDesign,
    expected: { returnsUndefined: true },
  });
  return cases.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

/**
 * Writes a fresh fixture with caller-supplied identities and design.
 * @param {{directory:string,categories:any[],records:any[],design:any}} input Required isolated source inputs; no process records are created.
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
    await writeFile(file, path.startsWith("fonts/") ? withFontCopyrightHeader(text) : text, {
      flag: "wx",
    });
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
          copyright: fontCopyright,
          openTypeNameLicense: fontLicense,
          openTypeNameLicenseURL: "https://www.apache.org/licenses/LICENSE-2.0",
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

/**
 * Regenerates only the checked-in test cases, retaining exact-curve measurement fixtures.
 * @returns {Promise<void>} Completion of test-only case regeneration.
 */
export async function refreshGeometryCases() {
  const path = resolve(dirname(fileURLToPath(import.meta.url)), "geometry-cases.fixture.json");
  const previous = JSON.parse(await readFile(path, "utf8"));
  await writeFile(path, JSON.stringify(refinementGeometryCases(previous), null, 2) + "\n");
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (process.argv.length !== 3 || process.argv[2] !== "--refresh-cases")
    throw new Error("Expected --refresh-cases; production sources are never fixture outputs.");
  await refreshGeometryCases();
}

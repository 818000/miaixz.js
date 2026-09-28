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
 * Exercises safe codec fallbacks, error paths, and Office geometry branches.
 */

import { ByteReader } from "../../src/codecs/binary/byte-codec.js";
import { drawioDriver } from "../../src/codecs/diagram/drawio-codec.js";
import { xmindDriver } from "../../src/codecs/diagram/xmind-codec.js";
import { epubDriver } from "../../src/codecs/ebook/epub-codec.js";
import {
  arrayField,
  numberField,
  objectField,
  stringField,
} from "../../src/codecs/json/field-codec.js";
import { wasmDriver } from "../../src/codecs/misc/wasm-codec.js";
import { decodeOfficeGeometry } from "../../src/codecs/office/geometry-codec.js";
import {
  defaultOfficeTheme,
  parseOfficeTheme,
  resolveOfficeColor,
} from "../../src/codecs/office/theme-codec.js";
import { emailDriver } from "../../src/codecs/text/email-codec.js";
import { textDriver } from "../../src/codecs/text/legacy-codec.js";
import {
  elementsByLocalName,
  firstElementByLocalName,
  localAttribute,
  parseXmlDocument,
  textFromElements,
  type XmlElement,
} from "../../src/codecs/xml/xml-codec.js";
import { defaultResourceBudget } from "../../src/runtime/resource-budget.js";
import { formatDriver as pdfDriver } from "../../src/formats/pdf/driver.js";
import type { DriverContext } from "../../src/shared/contracts/driver.js";
import { assertWorkerProtocolVersion } from "../../src/workers/protocol/worker-protocol.js";
import { storedZip } from "../support/stored-zip.js";

const encoder = new TextEncoder();

/**
 * Creates a driver context over immutable test bytes.
 *
 * @param bytes - Complete source bytes.
 * @param extension - Optional format extension supplied to the driver.
 * @param budgetCharacters - Optional text character limit.
 * @returns Bounded driver context.
 */
function context(
  bytes: Uint8Array,
  extension?: string,
  budgetCharacters = defaultResourceBudget.maxTextCharacters,
): DriverContext {
  return {
    resource: {
      id: "codec-edge-fixture",
      name: extension === undefined ? "fixture" : `fixture.${extension}`,
      mimeType: undefined,
      size: bytes.length,
      etag: undefined,
      /**
       * Reads a bounded source range.
       *
       * @param start - Zero-based source offset.
       * @param length - Maximum bytes returned.
       * @returns Owned source bytes.
       */
      async read(start, length) {
        return bytes.slice(start, start + length);
      },
      /**
       * Reads the complete source.
       *
       * @returns Owned complete bytes.
       */
      async readAll() {
        return bytes.slice();
      },
      /**
       * Returns the deterministic fixture URL.
       *
       * @returns Test object URL.
       */
      async createObjectUrl() {
        return "blob:codec-edge-fixture";
      },
      /**
       * Releases fixture resources.
       */
      dispose() {},
    },
    decision: {
      ...(extension === undefined ? {} : { extension }),
      confidence: 1,
      evidence: [],
      conflicts: [],
    },
    budget: { ...defaultResourceBudget, maxTextCharacters: budgetCharacters },
    signal: new AbortController().signal,
    /**
     * Accepts parser progress without side effects.
     */
    reportProgress() {},
  };
}

/**
 * Parses one XML fragment and returns its document element.
 *
 * @param source - Well-formed XML fragment.
 * @returns Parsed document element.
 */
function element(source: string): XmlElement {
  return parseXmlDocument(source, 10_000).documentElement;
}

describe("primitive codecs", () => {
  it("normalizes every supported JSON field shape", () => {
    expect(numberField(4)).toBe(4);
    expect(numberField(Number.NaN, 7)).toBe(7);
    expect(numberField("4", 8)).toBe(8);
    expect(stringField("value")).toBe("value");
    expect(stringField("")).toBeUndefined();
    expect(stringField(1)).toBeUndefined();
    expect(objectField({ value: 1 })).toEqual({ value: 1 });
    expect(objectField(null)).toBeUndefined();
    expect(objectField([])).toBeUndefined();
    expect(arrayField([1])).toEqual([1]);
    expect(arrayField({})).toEqual([]);
  });

  it("reads bounded integers and rejects every invalid byte range", () => {
    const reader = new ByteReader(new Uint8Array([1, 2, 3, 4, 5]));
    expect(reader.length).toBe(5);
    expect(reader.uint16(0)).toBe(513);
    expect(reader.uint16(0, false)).toBe(258);
    expect(reader.uint32(0)).toBe(67_305_985);
    expect(Array.from(reader.slice(1, 2))).toEqual([2, 3]);
    for (const operation of [
      () => reader.slice(-1, 1),
      () => reader.slice(0, -1),
      () => reader.slice(Number.NaN, 1),
      () => reader.slice(4, 2),
    ]) {
      expect(operation).toThrow("[PARSE_FAILED]");
    }
  });

  it("parses inert XML and rejects entities, malformed input, and oversized trees", () => {
    const document = parseXmlDocument(
      '<root xmlns:x="urn:test" x:id="one"><x:t>A</x:t><t>B</t></root>',
      3,
    );
    expect(elementsByLocalName(document, "t")).toHaveLength(2);
    expect(firstElementByLocalName(document, "t")?.textContent).toBe("A");
    expect(localAttribute(document.documentElement, "id")).toBe("one");
    expect(localAttribute(document.documentElement, "missing")).toBeUndefined();
    expect(textFromElements(document)).toBe("AB");
    expect(textFromElements(document, "missing")).toBe("");
    expect(() => parseXmlDocument("<!DOCTYPE root><root/>", 2)).toThrow("[PARSE_FAILED]");
    expect(() => parseXmlDocument("<root>", 2)).toThrow("[PARSE_FAILED]");
    expect(() => parseXmlDocument("<root><a/><b/></root>", 2)).toThrow("[RESOURCE_LIMIT_EXCEEDED]");
  });

  it("handles inert XML syntax while rejecting every malformed boundary", () => {
    const document = parseXmlDocument(
      "<?xml version=\"1.0\"?><root a='&quot;&apos;&#65;&#x42;'><!--ignored--><![CDATA[<safe>]]><child/>tail&amp;</root>",
      3,
      3,
    );
    expect(localAttribute(document.documentElement, "a")).toBe("\"'AB");
    expect(document.documentElement.ownText).toBe("<safe>tail&");
    expect(document.documentElement.textContent).toBe("<safe>tail&");
    for (const source of [
      "<root></other>",
      "<root/><second/>",
      "outside<root/>",
      "<root a=value/>",
      '<root a="open/>',
      "<root>&unknown;</root>",
      "<root>&#x110000;</root>",
      "<root><!--open</root>",
      "<root><?open</root>",
      "<root><![CDATA[open</root>",
      "<1root/>",
      '<root bad?="x"/>',
      "",
    ]) {
      expect(() => parseXmlDocument(source, 10)).toThrow("[PARSE_FAILED]");
    }
    expect(() => parseXmlDocument("<a><b><c/></b></a>", 10, 2)).toThrow(
      "[RESOURCE_LIMIT_EXCEEDED]",
    );
  });

  it("validates the versioned worker boundary", () => {
    expect(() => assertWorkerProtocolVersion(2)).not.toThrow();
    expect(() => assertWorkerProtocolVersion(1)).toThrow("[INVALID_CONFIGURATION]");
  });
});

describe("text, email, and WebAssembly codecs", () => {
  it("opens text with BOM, line counting, language, empty content, and limits", async () => {
    const text = await textDriver.open(context(encoder.encode("\uFEFFone\r\ntwo\nthree"), "txt"));
    expect(text).toMatchObject({
      status: "complete",
      model: { content: "one\r\ntwo\nthree", lineCount: 3, language: "txt" },
    });
    const empty = await textDriver.open(context(new Uint8Array()));
    expect(empty).toMatchObject({ status: "complete", model: { lineCount: 0 } });
    const limited = await textDriver.open(context(encoder.encode("long"), "txt", 2));
    expect(limited).toMatchObject({
      status: "rejected",
      error: { code: "RESOURCE_LIMIT_EXCEEDED" },
    });
  });

  it("opens inert EML and MBOX content while rejecting MSG", async () => {
    const eml = await emailDriver.open(
      context(encoder.encode("Subject: Example\r\n X\r\nFrom: sender\r\n\r\n<p>Hello</p>"), "eml"),
    );
    expect(eml).toMatchObject({
      status: "complete",
      model: { sections: [{ title: "Example X", text: "Hello" }] },
    });
    const mbox = await emailDriver.open(
      context(
        encoder.encode(
          "From sender@example.test\nSubject: First\n\nOne\nFrom other@example.test\n\nTwo",
        ),
        "mbox",
      ),
    );
    expect(mbox.status === "complete" ? mbox.model.sections : []).toHaveLength(2);
    expect(mbox).toMatchObject({
      status: "complete",
      model: { sections: [{ title: "First" }, { title: "Message 2" }] },
    });
    const headerOnly = await emailDriver.open(context(encoder.encode("Subject: Header"), "eml"));
    expect(headerOnly).toMatchObject({ status: "complete", model: { sections: [{ text: "" }] } });
    const msg = await emailDriver.open(context(new Uint8Array(), "msg"));
    expect(msg).toMatchObject({ status: "rejected", error: { code: "FORMAT_UNSUPPORTED" } });
  });

  it("inspects valid modules and rejects malformed section encodings", async () => {
    const header = [0, 0x61, 0x73, 0x6d, 1, 0, 0, 0];
    const valid = await wasmDriver.open(context(new Uint8Array([...header, 1, 1, 0]), "wasm"));
    expect(valid).toMatchObject({
      status: "complete",
      model: {
        summary: [
          { label: "Version", value: "1" },
          { label: "Sections", value: "1" },
        ],
      },
    });
    const generic = await wasmDriver.open(context(new Uint8Array([1, 2]), "asset"));
    expect(generic).toMatchObject({ status: "partial", model: { format: "asset" } });
    await expect(wasmDriver.open(context(new Uint8Array([1, 2]), "wasm"))).rejects.toMatchObject({
      code: "PARSE_FAILED",
    });
    await expect(
      wasmDriver.open(context(new Uint8Array([...header, 1, 4, 0]), "wasm")),
    ).rejects.toMatchObject({ code: "PARSE_FAILED" });
    await expect(
      wasmDriver.open(
        context(new Uint8Array([...header, 1, 0x80, 0x80, 0x80, 0x80, 0x80]), "wasm"),
      ),
    ).rejects.toMatchObject({ code: "PARSE_FAILED" });
  });
});

describe("drawing and publication codecs", () => {
  it("normalizes Draw.io XML vertices and edges", async () => {
    const source =
      '<mxGraphModel><root><mxCell/><mxCell id="node" vertex="1" value="&lt;b&gt;Node&lt;/b&gt;"><mxGeometry x="10" y="20" width="0" height="0"/></mxCell><mxCell id="blank" vertex="1"/><mxCell id="edge" edge="1" source="node" target="blank" value="Link"/><mxCell id="loose-edge" edge="1"/><mxCell id="ignored"/></root></mxGraphModel>';
    const outcome = await drawioDriver.open(context(encoder.encode(source), "drawio"));
    expect(outcome).toMatchObject({
      status: "complete",
      model: {
        shapes: [
          { id: "node", text: "Node", width: 1, height: 1 },
          { id: "blank", width: 120, height: 60 },
        ],
        edges: [
          { id: "edge-edge", from: "node", to: "blank", label: "Link" },
          { id: "edge-loose-edge" },
        ],
      },
    });
    const invalid = await drawioDriver.open(context(encoder.encode("<broken>"), "dio"));
    expect(invalid).toMatchObject({ status: "rejected", error: { code: "PARSE_FAILED" } });
  });

  it("normalizes Excalidraw and tldraw JSON variants", async () => {
    const excalidraw = {
      elements: [
        null,
        { id: "deleted", isDeleted: true },
        { id: "ellipse", type: "ellipse", x: 1, y: 2, width: 20, height: 10, text: "Circle" },
        { id: "text", type: "text", x: 3, y: 4, width: 0, height: -1 },
        { id: "image", type: "image", backgroundColor: "red", strokeColor: "blue" },
        {
          id: "arrow",
          type: "arrow",
          startBinding: { elementId: "ellipse" },
          endBinding: { elementId: "text" },
        },
        { id: "loose", type: "arrow" },
      ],
    };
    const first = await drawioDriver.open(
      context(encoder.encode(JSON.stringify(excalidraw)), "excalidraw"),
    );
    expect(first).toMatchObject({ status: "complete" });
    if (first.status === "complete") {
      expect(first.model.shapes).toHaveLength(5);
      expect(first.model.shapes.map((shape) => shape.kind)).toEqual([
        "ellipse",
        "text",
        "image",
        "line",
        "line",
      ]);
      expect(first.model.edges).toHaveLength(2);
    }
    const tldraw = {
      records: [
        { typeName: "asset" },
        {
          id: "geo",
          typeName: "shape",
          x: 5,
          y: 6,
          props: { geo: "ellipse", w: 25, h: 30, text: "Geo" },
        },
      ],
    };
    const second = await drawioDriver.open(
      context(encoder.encode(JSON.stringify(tldraw)), "tldraw"),
    );
    expect(second).toMatchObject({
      status: "complete",
      model: { shapes: [{ id: "geo", kind: "ellipse", text: "Geo" }] },
    });
    const invalid = await drawioDriver.open(context(encoder.encode("{"), "excalidraw"));
    expect(invalid).toMatchObject({ status: "rejected" });
  });

  it("walks XMind topic groups and rejects archives without content", async () => {
    const bytes = storedZip({
      "content.json": JSON.stringify([
        {
          rootTopic: {
            title: "Root",
            children: {
              attached: [{ id: "child", title: "Child", children: { detached: [null] } }],
            },
          },
        },
        {},
      ]),
    });
    const outcome = await xmindDriver.open(context(bytes, "xmind"));
    expect(outcome).toMatchObject({
      status: "complete",
      model: {
        shapes: [
          { id: "topic-1", text: "Root" },
          { id: "child", text: "Child" },
        ],
        edges: [{ from: "topic-1", to: "child" }],
      },
    });
    const unsupported = await xmindDriver.open(context(storedZip({}), "xmind"));
    expect(unsupported).toMatchObject({
      status: "rejected",
      error: { code: "FORMAT_UNSUPPORTED" },
    });
  });

  it("resolves EPUB spine paths and strips executable content", async () => {
    const bytes = storedZip({
      "META-INF/container.xml":
        '<container><rootfiles><rootfile full-path="OPS/package.opf"/></rootfiles></container>',
      "OPS/package.opf":
        '<package><manifest><item id="chapter" href="text/../chapter.xhtml"/><item href="ignored.xhtml"/></manifest><spine><itemref/><itemref idref="missing"/><itemref idref="chapter"/></spine></package>',
      "OPS/chapter.xhtml":
        "<html><head><title> </title><style>hidden</style></head><body>Hello <script>bad</script><object>bad</object><iframe>bad</iframe> world</body></html>",
    });
    const outcome = await epubDriver.open(context(bytes, "epub"));
    expect(outcome).toMatchObject({
      status: "complete",
      model: { sections: [{ title: "OPS/chapter.xhtml", text: "Hello world" }] },
    });
    const missingContainer = await epubDriver.open(context(storedZip({}), "epub"));
    expect(missingContainer).toMatchObject({ status: "rejected", error: { code: "PARSE_FAILED" } });
    const missingRoot = await epubDriver.open(
      context(storedZip({ "META-INF/container.xml": "<container/>" }), "epub"),
    );
    expect(missingRoot).toMatchObject({ status: "rejected", error: { code: "PARSE_FAILED" } });
  });
});

describe("local PDF codec", () => {
  it("extracts literal, hexadecimal, array, and line text without PDF.js", async () => {
    const source = `%PDF-1.7
1 0 obj
<< /Type /Page /CropBox [10 20 110 220] /Contents [2 0 R 3 0 R 9 0 R] >>
endobj
2 0 obj
<< /Length 80 >>
stream
(Hi\\n\\050\\051\\101) Tj T* <FEFF0042> Tj [(C)<44>] TJ (E) ' (F) "
endstream
endobj
3 0 obj
<< /Filter /ASCIIHexDecode >>
stream
(Skipped) Tj
endstream
endobj
%%EOF`;
    const outcome = await pdfDriver.open(context(encoder.encode(source), "pdf"));
    expect(outcome).toMatchObject({
      status: "partial",
      model: { pages: [{ width: 100, height: 200 }] },
      warnings: [{ code: "PDF_FILTER_UNSUPPORTED" }],
    });
    if (outcome.status !== "rejected") {
      expect(outcome.model.pages[0]?.text).toContain("Hi\n()A");
      expect(outcome.model.pages[0]?.text).toContain("BCDE");
    }
  });

  it("uses page defaults and reports malformed, encrypted, empty, and failed streams", async () => {
    const complete = `%PDF-1.4
1 0 obj
<< /Type /Page /Contents 2 0 R >>
endobj
2 0 obj
stream
(Hello) Tj
endstream
endobj`;
    expect(await pdfDriver.open(context(encoder.encode(complete), "pdf"))).toMatchObject({
      status: "complete",
      model: { pages: [{ width: 612, height: 792, text: "Hello" }] },
    });
    expect(await pdfDriver.open(context(encoder.encode("not-pdf"), "pdf"))).toMatchObject({
      status: "rejected",
      error: { code: "PARSE_FAILED" },
    });
    expect(
      await pdfDriver.open(context(encoder.encode("%PDF-1.4\n/Encrypt"), "pdf")),
    ).toMatchObject({ status: "rejected", error: { code: "FORMAT_UNSUPPORTED" } });
    expect(await pdfDriver.open(context(encoder.encode("%PDF-1.4"), "pdf"))).toMatchObject({
      status: "rejected",
      error: { code: "PARSE_FAILED" },
    });
    const failed = `%PDF-1.4
1 0 obj
<< /Type /Page /MediaBox [0 0 0 0] /Contents 2 0 R >>
endobj
2 0 obj
<< /Filter /FlateDecode >>
stream
invalid
endstream
endobj`;
    expect(await pdfDriver.open(context(encoder.encode(failed), "pdf"))).toMatchObject({
      status: "partial",
      model: { pages: [{ width: 1, height: 1 }] },
      warnings: [{ code: "PDF_STREAM_FAILED" }],
    });
  });
});

describe("Office geometry and themes", () => {
  it("decodes every maintained flowchart and connector preset", () => {
    const presets = [
      "ellipse",
      "flowChartConnector",
      "roundRect",
      "straightConnector1",
      "bentConnector2",
      "bentConnector3",
      "bentConnector4",
      "bentConnector5",
      "curvedConnector2",
      "curvedConnector3",
      "flowChartDecision",
      "flowChartInputOutput",
      "flowChartMagneticDisk",
      "flowChartMultidocument",
      "mathPlus",
      "triangle",
      "hexagon",
      "chevron",
      "pentagon",
      "flowChartDocument",
      "borderCallout1",
      "unknownPreset",
    ];
    for (const preset of presets) {
      const properties = element(
        `<spPr><prstGeom prst="${preset}"><avLst><gd name="adj1" fmla="val 30000"/><gd name="adj2" fmla="val 70000"/></avLst></prstGeom></spPr>`,
      );
      const decoded = decodeOfficeGeometry(properties, 200, 100, /connector/iu.test(preset));
      expect(decoded.preset).toBe(preset);
      expect(decoded.geometry.kind).toMatch(/^(ellipse|line|path|rectangle)$/u);
    }
    expect(decodeOfficeGeometry(element("<spPr/>"), 10, 10, false).preset).toBe("rect");
    expect(decodeOfficeGeometry(element("<spPr/>"), 10, 10, true).preset).toBe(
      "straightConnector1",
    );
  });

  it("evaluates custom guides and converts every supported path command", () => {
    const formulas = [
      "val 5",
      "*/ 2 3 4",
      "+- 2 3 1",
      "+/ 2 3 5",
      "?: 1 8 9",
      "?: -1 8 9",
      "abs -4",
      "min 3 4",
      "max 3 4",
      "sqrt 9",
      "mod 3 4 0",
      "sin 10 5400000",
      "cos 10 0",
      "tan 10 2700000",
      "at2 1 1",
      "cat2 10 1 1",
      "sat2 10 1 1",
      "pin 0 8 5",
      "*/ 2 3 0",
      "+/ 2 3 0",
      "unknown 1 2 3",
    ];
    const guides = formulas
      .map((formula, index) => `<gd name="g${index}" fmla="${formula}"/>`)
      .join("");
    const properties = element(
      `<spPr><custGeom><avLst>${guides}</avLst><gdLst><gd name="named" fmla="val wd2"/></gdLst><pathLst><path w="100" h="100"><moveTo><pt x="0" y="0"/></moveTo><lnTo><pt x="named" y="20"/></lnTo><quadBezTo><pt x="30" y="40"/><pt x="50" y="60"/></quadBezTo><cubicBezTo><pt x="55" y="65"/><pt x="70" y="75"/><pt x="80" y="85"/></cubicBezTo><arcTo wR="wd4" hR="hd4" stAng="0" swAng="10800000"/><close/></path></pathLst></custGeom></spPr>`,
    );
    const decoded = decodeOfficeGeometry(properties, 200, 100, false);
    expect(decoded).toMatchObject({ preset: "custom", geometry: { kind: "path" } });
    expect(decoded.geometry.path).toContain("M0 0");
    expect(decoded.geometry.path).toContain("Q");
    expect(decoded.geometry.path).toContain("C");
    expect(decoded.geometry.path).toContain("A");
    expect(decoded.geometry.path).toContain("Z");
    expect(decodeOfficeGeometry(element("<spPr><custGeom/></spPr>"), 10, 10, false)).toMatchObject({
      preset: "custom",
      geometry: { kind: "path" },
    });
  });

  it("resolves theme, direct, preset, system, and transformed colors", () => {
    const theme = parseOfficeTheme(
      parseXmlDocument(
        '<theme><clrScheme><dk1><sysClr lastClr="112233"/></dk1><lt1><srgbClr val="FAFAFA"/></lt1><accent1><prstClr val="red"/></accent1><accent2><hslClr val="ignored"/></accent2><accent3/></clrScheme></theme>',
        100,
      ),
    );
    expect(theme.colors.get("dk1")).toBe("#112233");
    expect(theme.colors.get("accent1")).toBe("#FF0000");
    expect(theme.colors.get("dk2")).toBe("#44546A");
    expect(theme.colors.get("bg1")).toBe("#FAFAFA");
    const fallback = defaultOfficeTheme();
    expect(resolveOfficeColor(undefined, fallback, "#123456")).toBe("#123456");
    expect(resolveOfficeColor(element("<solidFill/>"), fallback, "#123456")).toBe("#123456");
    expect(
      resolveOfficeColor(
        element('<schemeClr val="accent1"><tint val="50000"/></schemeClr>'),
        fallback,
        "#000000",
      ),
    ).toBe("#A2B9E2");
    expect(resolveOfficeColor(element('<sysClr lastClr="ABCDEF"/>'), fallback, "#000000")).toBe(
      "#ABCDEF",
    );
    expect(resolveOfficeColor(element('<prstClr val="blue"/>'), fallback, "#000000")).toBe(
      "#0000FF",
    );
    expect(
      resolveOfficeColor(
        element('<srgbClr val="123456"><shade val="50000"/><lumOff val="10000"/></srgbClr>'),
        fallback,
        "#000000",
      ),
    ).toMatch(/^#[\dA-F]{6}$/u);
    expect(
      resolveOfficeColor(element('<scrgbClr r="100000" g="50000" b="0"/>'), fallback, "#000000"),
    ).toBe("#FF8000");
    expect(resolveOfficeColor(element('<hslClr val="invalid"/>'), fallback, "#135790")).toBe(
      "#135790",
    );
  });
});

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
 * Opens a valid minimal source through every installed format driver.
 */

import { formatDescriptors, formatLoaders } from "../../src/autogen/format-registry.js";
import { defaultResourceBudget } from "../../src/runtime/resource-budget.js";
import type { DriverContext } from "../../src/shared/contracts/driver.js";
import { storedZip } from "../support/stored-zip.js";

const encoder = new TextEncoder();

/**
 * Returns valid minimal bytes for one installed ready driver.
 *
 * @param id - Canonical format identifier.
 * @returns Source bytes accepted by the selected driver.
 */
function fixtureBytes(id: string): Uint8Array {
  const text = (source: string): Uint8Array => encoder.encode(source);
  const fixtures: Readonly<Record<string, () => Uint8Array>> = {
    docx: () =>
      storedZip({
        "word/document.xml":
          '<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Hello</w:t></w:r></w:p></w:body></w:document>',
      }),
    drawio: () =>
      text(
        '<mxGraphModel><root><mxCell id="1" vertex="1" value="Start"><mxGeometry x="0" y="0" width="80" height="40"/></mxCell></root></mxGraphModel>',
      ),
    dxf: () => text("0\nLINE\n10\n0\n20\n0\n11\n10\n21\n10\n0\nEOF\n"),
    epub: () =>
      storedZip({
        "META-INF/container.xml":
          '<?xml version="1.0"?><container><rootfiles><rootfile full-path="OPS/package.opf"/></rootfiles></container>',
        "OPS/package.opf":
          '<?xml version="1.0"?><package><manifest><item id="chapter" href="chapter.xhtml"/></manifest><spine><itemref idref="chapter"/></spine></package>',
        "OPS/chapter.xhtml": "<html><head><title>Chapter</title></head><body>Hello</body></html>",
      }),
    geojson: () => text('{"type":"Point","coordinates":[120,30]}'),
    gif: () => text("GIF89a"),
    jpeg: () => new Uint8Array([0xff, 0xd8, 0xff, 0xd9]),
    mp3: () => text("ID3"),
    mp4: () => new Uint8Array([0, 0, 0, 16, 0x66, 0x74, 0x79, 0x70]),
    obj: () => text("v 0 0 0\nv 1 0 0\nv 0 1 0\nf 1 2 3\n"),
    ofd: () =>
      storedZip({
        "Doc_0/Pages/Page_0/Content.xml":
          '<Page PhysicalBox="0 0 210 297"><TextCode>Hello</TextCode></Page>',
      }),
    pdf: () =>
      text(
        "%PDF-1.4\n1 0 obj\n<< /Type /Page /MediaBox [0 0 612 792] /Contents 2 0 R >>\nendobj\n2 0 obj\n<< /Length 12 >>\nstream\n(Hello) Tj\nendstream\nendobj\n%%EOF",
      ),
    png: () => new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pptx: () =>
      storedZip({
        "ppt/slides/slide1.xml":
          '<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree><p:nvGrpSpPr/><p:grpSpPr/></p:spTree></p:cSld></p:sld>',
      }),
    svg: () => text('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>'),
    wasm: () => new Uint8Array([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]),
    xlsx: () =>
      storedZip({
        "xl/workbook.xml":
          '<workbook xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Sheet1" r:id="rId1"/></sheets></workbook>',
        "xl/_rels/workbook.xml.rels":
          '<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>',
        "xl/worksheets/sheet1.xml":
          '<worksheet><sheetData><row><c r="A1" t="inlineStr"><is><t>Hello</t></is></c></row></sheetData></worksheet>',
      }),
    xmind: () =>
      storedZip({
        "content.json": '[{"rootTopic":{"id":"root","title":"Root","children":{"attached":[]}}}]',
      }),
    xps: () =>
      storedZip({
        "Documents/1/Pages/1.fpage":
          '<FixedPage Width="794" Height="1123"><Glyphs UnicodeString="Hello"/></FixedPage>',
      }),
    zip: () => storedZip({ "hello.txt": "Hello" }),
  };
  return fixtures[id]?.() ?? new Uint8Array();
}

/**
 * Creates a bounded driver context for one format smoke fixture.
 *
 * @param id - Canonical format identifier.
 * @param extension - Filename extension selected by detection.
 * @param bytes - Complete immutable fixture bytes.
 * @returns Driver context suitable for direct driver invocation.
 */
function driverContext(id: string, extension: string, bytes: Uint8Array): DriverContext {
  return {
    resource: {
      id: `fixture-${id}`,
      name: `fixture.${extension}`,
      mimeType: undefined,
      size: bytes.length,
      etag: undefined,
      /**
       * Reads a bounded fixture byte range.
       *
       * @param start - Zero-based source offset.
       * @param length - Maximum bytes returned.
       * @returns Owned fixture bytes.
       */
      async read(start, length) {
        return bytes.slice(start, start + length);
      },
      /**
       * Reads an owned copy of the complete fixture.
       *
       * @returns Complete fixture bytes.
       */
      async readAll() {
        return bytes.slice();
      },
      /**
       * Returns the deterministic fixture object URL.
       *
       * @returns Fixture object URL.
       */
      async createObjectUrl() {
        return `blob:fixture-${id}`;
      },
      /**
       * Releases fixture resources after the test.
       */
      dispose() {},
    },
    decision: { extension, driver: id, confidence: 1, evidence: [], conflicts: [] },
    budget: defaultResourceBudget,
    signal: new AbortController().signal,
    /**
     * Accepts parser progress without mutating test state.
     */
    reportProgress() {},
  };
}

describe("installed format drivers", () => {
  it("opens every ready format and explicitly rejects every recognized-only format", async () => {
    for (const descriptor of formatDescriptors) {
      const loader = formatLoaders.get(descriptor.id);
      if (loader === undefined) throw new Error(`Missing loader for ${descriptor.id}`);
      const extension = descriptor.extensions[0];
      if (extension === undefined) throw new Error(`Missing extension for ${descriptor.id}`);
      const driver = await loader();
      const outcome = await driver.open(
        driverContext(descriptor.id, extension, fixtureBytes(descriptor.id)),
      );
      if (descriptor.id === "xlsx" && typeof Worker === "undefined") {
        expect(outcome.status, descriptor.id).toBe("rejected");
        if (outcome.status === "rejected") {
          expect(outcome.error.code, descriptor.id).toBe("UNSUPPORTED_RUNTIME");
        }
      } else if (descriptor.implementation === "ready") {
        expect(outcome.status, descriptor.id).not.toBe("rejected");
      } else {
        expect(outcome.status, descriptor.id).toBe("rejected");
      }
    }
  });
});

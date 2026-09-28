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
 * Verifies materialized DiagramML drawings embedded through SmartArt frames.
 */

import { createOoxmlDriver } from "../../../src/codecs/office/ooxml-codec.js";
import { defaultResourceBudget } from "../../../src/runtime/resource-budget.js";
import type { DriverContext } from "../../../src/shared/contracts/driver.js";
import { storedZip } from "../../support/stored-zip.js";

const formatDriver = createOoxmlDriver("xlsx", "spreadsheet");

/**
 * Creates a minimal workbook containing one materialized SmartArt shape.
 *
 * @returns Complete OOXML workbook bytes.
 */
function smartArtWorkbook(): Uint8Array {
  return storedZip({
    "xl/workbook.xml":
      '<workbook xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Flow" r:id="rId1"/></sheets></workbook>',
    "xl/_rels/workbook.xml.rels":
      '<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>',
    "xl/worksheets/sheet1.xml":
      '<worksheet xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheetData/><drawing r:id="rId1"/></worksheet>',
    "xl/worksheets/_rels/sheet1.xml.rels":
      '<Relationships><Relationship Id="rId1" Target="../drawings/drawing1.xml"/></Relationships>',
    "xl/drawings/drawing1.xml":
      '<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:dgm="http://schemas.openxmlformats.org/drawingml/2006/diagram" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><xdr:absoluteAnchor><xdr:pos x="0" y="0"/><xdr:ext cx="3810000" cy="1905000"/><xdr:graphicFrame><xdr:nvGraphicFramePr><xdr:cNvPr id="1" name="SmartArt"/></xdr:nvGraphicFramePr><xdr:xfrm><a:off x="0" y="0"/><a:ext cx="3810000" cy="1905000"/></xdr:xfrm><a:graphic><a:graphicData><dgm:relIds r:dm="rId1" r:lo="rId2" r:qs="rId3" r:cs="rId4"/></a:graphicData></a:graphic></xdr:graphicFrame><xdr:clientData/></xdr:absoluteAnchor></xdr:wsDr>',
    "xl/drawings/_rels/drawing1.xml.rels":
      '<Relationships><Relationship Id="rId1" Target="../diagrams/data1.xml"/></Relationships>',
    "xl/diagrams/data1.xml":
      '<dgm:dataModel xmlns:dgm="http://schemas.openxmlformats.org/drawingml/2006/diagram"/>',
    "xl/diagrams/_rels/data1.xml.rels":
      '<Relationships><Relationship Id="rId1" Target="drawing1.xml"/></Relationships>',
    "xl/diagrams/drawing1.xml":
      '<dsp:drawing xmlns:dsp="http://schemas.microsoft.com/office/drawing/2008/diagram" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><dsp:spTree><dsp:sp><dsp:nvSpPr><dsp:cNvPr id="10" name="Process"/></dsp:nvSpPr><dsp:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="952500" cy="476250"/></a:xfrm><a:prstGeom prst="roundRect"/><a:solidFill><a:srgbClr val="4472C4"/></a:solidFill></dsp:spPr><dsp:txBody><a:bodyPr anchor="ctr"/><a:p><a:pPr algn="ctr"/><a:r><a:rPr sz="1200"><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill></a:rPr><a:t>Process</a:t></a:r></a:p></dsp:txBody></dsp:sp></dsp:spTree></dsp:drawing>',
  });
}

/**
 * Creates a driver context for the SmartArt workbook.
 *
 * @returns Bounded XLSX driver context.
 */
function smartArtContext(): DriverContext {
  const bytes = smartArtWorkbook();
  return {
    resource: {
      id: "smartart-fixture",
      name: "smartart.xlsx",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
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
       * Reads the complete fixture.
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
        return "blob:smartart-fixture";
      },
      /**
       * Releases fixture resources after the test.
       */
      dispose() {},
    },
    decision: { extension: "xlsx", driver: "xlsx", confidence: 1, evidence: [], conflicts: [] },
    budget: defaultResourceBudget,
    signal: new AbortController().signal,
    /**
     * Accepts parser progress without mutating test state.
     */
    reportProgress() {},
  };
}

describe("XLSX SmartArt", () => {
  it("replaces a graphic frame with its materialized DiagramML drawing", async () => {
    const outcome = await formatDriver.open(smartArtContext());
    if (outcome.status !== "complete" || outcome.model.kind !== "spreadsheet") {
      throw new Error("Expected a complete spreadsheet model");
    }
    const drawing = outcome.model.drawings[0];
    expect(drawing?.features).toMatchObject({
      smartArtCount: 1,
      shapeCount: 1,
      unsupportedCount: 0,
    });
    expect(drawing?.shapes).toHaveLength(1);
    expect(drawing?.shapes[0]).toMatchObject({
      id: "1-10",
      preset: "roundRect",
      text: "Process",
      fill: "#4472C4",
    });
    expect(drawing?.width).toBeCloseTo(400);
    expect(drawing?.height).toBeCloseTo(200);
  });
});

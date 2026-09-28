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
 * Verifies legacy VML drawings referenced by OOXML worksheets.
 */

import { createOoxmlDriver } from "../../../src/codecs/office/ooxml-codec.js";
import { defaultResourceBudget } from "../../../src/runtime/resource-budget.js";
import type { DriverContext } from "../../../src/shared/contracts/driver.js";
import { storedZip } from "../../support/stored-zip.js";

const formatDriver = createOoxmlDriver("xlsx", "spreadsheet");

/**
 * Creates a minimal workbook containing legacy VML process geometry.
 *
 * @returns Complete OOXML workbook bytes.
 */
function vmlWorkbook(): Uint8Array {
  return storedZip({
    "xl/workbook.xml":
      '<workbook xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Legacy Flow" r:id="rId1"/></sheets></workbook>',
    "xl/_rels/workbook.xml.rels":
      '<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>',
    "xl/worksheets/sheet1.xml":
      '<worksheet xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheetData/><legacyDrawing r:id="rId1"/></worksheet>',
    "xl/worksheets/_rels/sheet1.xml.rels":
      '<Relationships><Relationship Id="rId1" Target="../drawings/vmlDrawing1.vml"/></Relationships>',
    "xl/drawings/vmlDrawing1.vml":
      '<xml xmlns:v="urn:schemas-microsoft-com:vml"><v:roundrect id="process" style="margin-left:12pt;margin-top:18pt;width:120pt;height:48pt" fillcolor="#4472C4" strokecolor="#203864"><v:textbox><div>Legacy process</div></v:textbox></v:roundrect><v:line id="connector" from="10pt,80pt" to="170pt,80pt" strokecolor="#000000" strokeweight="1.5pt"/></xml>',
  });
}

/**
 * Creates a bounded driver context for the VML workbook.
 *
 * @returns XLSX driver context backed by the in-memory fixture.
 */
function vmlContext(): DriverContext {
  const bytes = vmlWorkbook();
  return {
    resource: {
      id: "vml-fixture",
      name: "legacy-flow.xlsx",
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
        return "blob:vml-fixture";
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

describe("XLSX VML drawings", () => {
  it("loads shapes and connectors referenced through legacyDrawing", async () => {
    const outcome = await formatDriver.open(vmlContext());
    if (outcome.status !== "complete" || outcome.model.kind !== "spreadsheet") {
      throw new Error("Expected a complete spreadsheet model");
    }
    const drawing = outcome.model.drawings[0];
    expect(drawing).toMatchObject({ sheetId: "sheet-1", sheetName: "Legacy Flow" });
    expect(drawing?.features).toMatchObject({ shapeCount: 1, connectorCount: 1 });
    expect(drawing?.shapes).toHaveLength(2);
    expect(drawing?.shapes[0]).toMatchObject({
      id: "process",
      kind: "rectangle",
      text: "Legacy process",
      fill: "#4472C4",
    });
    expect(drawing?.shapes[1]).toMatchObject({ id: "connector", kind: "line" });
  });
});

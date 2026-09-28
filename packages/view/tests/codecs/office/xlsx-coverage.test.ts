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
 * Verifies that unsupported visible spreadsheet features can never report complete.
 */

import { ZipArchive } from "../../../src/codecs/archive/zip-codec.js";
import { parseSpreadsheet } from "../../../src/codecs/office/ooxml-codec.js";
import { spreadsheetParseOutcome } from "../../../src/codecs/office/spreadsheet-feature-codec.js";
import { defaultResourceBudget } from "../../../src/runtime/resource-budget.js";
import { storedZip } from "../../support/stored-zip.js";

describe("spreadsheet coverage ledger", () => {
  it("names every discovered visible feature family which is not modeled", async () => {
    const bytes = storedZip({
      "xl/workbook.xml":
        '<workbook xmlns:r="urn:r"><sheets><sheet name="Features" r:id="rId1"/></sheets></workbook>',
      "xl/_rels/workbook.xml.rels":
        '<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>',
      "xl/worksheets/sheet1.xml":
        '<worksheet><sheetData><row r="1"><c r="A1"><v>1</v></c></row></sheetData><conditionalFormatting sqref="A1"/><tableParts><tablePart/></tableParts><autoFilter ref="A1"/><sparklineGroup/><hyperlinks><hyperlink ref="A1"/></hyperlinks><oleObjects><oleObject/></oleObjects></worksheet>',
      "xl/charts/chart1.xml": "<chart/>",
      "xl/pivotTables/pivotTable1.xml": "<pivotTable/>",
      "xl/comments1.xml": "<comments/>",
      "xl/connections.xml": "<connections/>",
    });
    const model = await parseSpreadsheet(
      new ZipArchive(bytes, defaultResourceBudget),
      bytes,
      "Visible features",
      defaultResourceBudget,
    );
    const incomplete = model.coverage.entries.filter((entry) => entry.skipped > 0);
    expect(incomplete.map((entry) => entry.feature).sort()).toEqual([
      "active-content-preview",
      "chart",
      "comment",
      "conditional-format",
      "external-data-cache",
      "filter",
      "hyperlink",
      "pivot-view",
      "sparkline",
      "table",
    ]);
    const outcome = spreadsheetParseOutcome(model, []);
    expect(outcome.status).toBe("partial");
    if (outcome.status !== "partial") return;
    expect(outcome.skipped.map((feature) => feature.code)).toContain(
      "XLSX_CONDITIONAL_FORMAT_SKIPPED",
    );
    expect(outcome.warnings).toContainEqual({
      code: "XLSX_UNSUPPORTED_VISIBLE_FEATURE",
      messageKey: "xlsx.unsupportedVisibleFeature",
    });
  });

  it("does not classify invalid cell style references as renderable", async () => {
    const bytes = storedZip({
      "xl/workbook.xml":
        '<workbook xmlns:r="urn:r"><sheets><sheet name="Invalid style" r:id="rId1"/></sheets></workbook>',
      "xl/_rels/workbook.xml.rels":
        '<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>',
      "xl/worksheets/sheet1.xml":
        '<worksheet><sheetData><row r="1"><c r="A1" s="9"><v>1</v></c></row></sheetData></worksheet>',
    });
    const model = await parseSpreadsheet(
      new ZipArchive(bytes, defaultResourceBudget),
      bytes,
      "Invalid style",
      defaultResourceBudget,
    );
    expect(model.coverage.entries.find((entry) => entry.feature === "cell")).toMatchObject({
      discovered: 1,
      modeled: 1,
      renderable: 0,
      skipped: 1,
    });
    expect(spreadsheetParseOutcome(model, []).status).toBe("partial");
  });

  it("uses a partial placeholder instead of rejecting unsupported WMF pictures", async () => {
    const bytes = storedZip({
      "xl/workbook.xml":
        '<workbook xmlns:r="urn:r"><sheets><sheet name="WMF" r:id="rId1"/></sheets></workbook>',
      "xl/_rels/workbook.xml.rels":
        '<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>',
      "xl/worksheets/sheet1.xml":
        '<worksheet xmlns:r="urn:r"><sheetData/><drawing r:id="rIdDrawing"/></worksheet>',
      "xl/worksheets/_rels/sheet1.xml.rels":
        '<Relationships><Relationship Id="rIdDrawing" Target="../drawings/drawing1.xml"/></Relationships>',
      "xl/drawings/drawing1.xml":
        '<xdr:wsDr xmlns:xdr="urn:xdr" xmlns:a="urn:a" xmlns:r="urn:r"><xdr:twoCellAnchor><xdr:from><xdr:col>0</xdr:col><xdr:row>0</xdr:row></xdr:from><xdr:to><xdr:col>1</xdr:col><xdr:row>1</xdr:row></xdr:to><xdr:pic><xdr:nvPicPr><xdr:cNvPr id="1" name="Unsupported WMF"/></xdr:nvPicPr><xdr:blipFill><a:blip r:embed="rIdImage"/></xdr:blipFill><xdr:spPr/></xdr:pic></xdr:twoCellAnchor></xdr:wsDr>',
      "xl/drawings/_rels/drawing1.xml.rels":
        '<Relationships><Relationship Id="rIdImage" Target="../media/image1.wmf"/></Relationships>',
      "xl/media/image1.wmf": "unsupported-wmf",
    });
    const model = await parseSpreadsheet(
      new ZipArchive(bytes, defaultResourceBudget),
      bytes,
      "WMF",
      defaultResourceBudget,
    );
    expect(model.drawings[0]?.shapes[0]?.kind).toBe("image");
    expect(model.drawings[0]?.shapes[0]?.source).toBeUndefined();
    const outcome = spreadsheetParseOutcome(model, []);
    expect(outcome.status).toBe("partial");
    if (outcome.status !== "partial") return;
    expect(outcome.skipped.map((entry) => entry.code)).toEqual(
      expect.arrayContaining(["XLSX_DRAWING_SKIPPED", "XLSX_IMAGE_SKIPPED"]),
    );
  });

  it("accounts for visible workbook relationships whose target part is missing", async () => {
    const bytes = storedZip({
      "xl/workbook.xml":
        '<workbook xmlns:r="urn:r"><sheets><sheet name="Missing" r:id="rId1"/></sheets></workbook>',
      "xl/_rels/workbook.xml.rels":
        '<Relationships><Relationship Id="rId1" Target="worksheets/missing.xml"/></Relationships>',
    });
    const model = await parseSpreadsheet(
      new ZipArchive(bytes, defaultResourceBudget),
      bytes,
      "Missing sheet",
      defaultResourceBudget,
    );
    expect(model.coverage.entries).toContainEqual({
      feature: "sheet-layout",
      part: "xl/workbook.xml",
      discovered: 1,
      modeled: 0,
      renderable: 0,
      skipped: 1,
    });
    expect(spreadsheetParseOutcome(model, []).status).toBe("partial");
  });
});

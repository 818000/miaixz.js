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
 * Verifies Word page geometry and DrawingML flowchart anchors.
 */

import { createOoxmlDriver } from "../../../src/codecs/office/ooxml-codec.js";
import { defaultResourceBudget } from "../../../src/runtime/resource-budget.js";
import type { DriverContext } from "../../../src/shared/contracts/driver.js";
import { storedZip } from "../../support/stored-zip.js";

const driver = createOoxmlDriver("docx", "document");

/**
 * Builds a single-page Word flowchart with two page-relative anchors.
 *
 * @param unsupported - Whether the second object is intentionally unknown.
 * @param includeSection - Whether saved page geometry is included.
 * @returns Complete deterministic document fixture.
 */
function wordFixture(unsupported = false, includeSection = true): Uint8Array {
  const secondObject = unsupported
    ? "<a:graphic><a:graphicData><a:graphicFrame/></a:graphicData></a:graphic>"
    : '<a:graphic><a:graphicData><wps:wsp><wps:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="952500" cy="476250"/></a:xfrm><a:prstGeom prst="straightConnector1"/><a:ln><a:tailEnd type="triangle"/></a:ln></wps:spPr></wps:wsp></a:graphicData></a:graphic>';
  return storedZip({
    "word/document.xml": `<w:document xmlns:w="w" xmlns:wp="wp" xmlns:a="a" xmlns:wps="wps"><w:body><w:p><w:r><w:rPr><w:sz w:val="22"/></w:rPr><w:t>Overview</w:t></w:r></w:p><w:p><w:r><w:drawing><wp:anchor simplePos="0"><wp:positionH relativeFrom="page"><wp:posOffset>952500</wp:posOffset></wp:positionH><wp:positionV relativeFrom="page"><wp:posOffset>1905000</wp:posOffset></wp:positionV><wp:extent cx="1905000" cy="952500"/><a:graphic><a:graphicData><wps:wsp><wps:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="1905000" cy="952500"/></a:xfrm><a:prstGeom prst="flowChartDecision"/><a:solidFill><a:srgbClr val="70AD47"/></a:solidFill></wps:spPr><wps:txbx><w:txbxContent><w:p><w:r><w:rPr><w:sz w:val="18"/><w:b/></w:rPr><w:t>Approve?</w:t></w:r></w:p></w:txbxContent></wps:txbx></wps:wsp></a:graphicData></a:graphic></wp:anchor></w:drawing></w:r></w:p><w:p><w:r><w:drawing><wp:anchor simplePos="0"><wp:positionH relativeFrom="page"><wp:posOffset>2857500</wp:posOffset></wp:positionH><wp:positionV relativeFrom="page"><wp:posOffset>2381250</wp:posOffset></wp:positionV><wp:extent cx="952500" cy="476250"/>${secondObject}</wp:anchor></w:drawing></w:r></w:p>${includeSection ? '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>' : ""}</w:body></w:document>`,
  });
}

/**
 * Creates a bounded driver context.
 *
 * @param unsupported - Whether the second object is intentionally unknown.
 * @param includeSection - Whether saved page geometry is included.
 * @returns Driver context.
 */
function context(unsupported = false, includeSection = true): DriverContext {
  const bytes = wordFixture(unsupported, includeSection);
  return {
    resource: {
      id: "docx-flowchart",
      name: "flowchart.docx",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      size: bytes.length,
      etag: undefined,
      /**
       * Reads one bounded byte range.
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
       * Returns the deterministic fixture URL.
       *
       * @returns Fixture object URL.
       */
      async createObjectUrl() {
        return "blob:docx-flowchart";
      },
      /**
       * Releases fixture resources.
       */
      dispose() {},
    },
    decision: { extension: "docx", driver: "docx", confidence: 1, evidence: [], conflicts: [] },
    budget: defaultResourceBudget,
    signal: new AbortController().signal,
    /**
     * Accepts parser progress without side effects.
     */
    reportProgress() {},
  };
}

describe("DOCX flowcharts", () => {
  it("renders paragraphs and page-relative WordprocessingML anchors on one page scene", async () => {
    const outcome = await driver.open(context());
    expect(outcome.status).toBe("complete");
    if (outcome.status !== "complete" || outcome.model.kind !== "paged") {
      throw new Error("Expected a complete paged Word document");
    }
    expect(outcome.model.pages).toHaveLength(1);
    expect(outcome.model.pages[0]).toMatchObject({ width: 816, height: 1056, text: "" });
    const drawing = outcome.model.pages[0]?.drawing;
    expect(drawing?.background).toBe("#FFFFFF");
    expect(drawing?.shapes.some((shape) => shape.text === "Overview")).toBe(true);
    const decision = drawing?.shapes.find((shape) => shape.text === "Approve?");
    expect(decision).toMatchObject({ preset: "flowChartDecision", width: 200, height: 100 });
    expect(decision?.transform).toMatchObject({ e: 100, f: 200 });
    expect(decision?.textStyle).toMatchObject({ bold: true });
    const paragraph = drawing?.shapes.find((shape) => shape.text === "Overview");
    expect(paragraph).toMatchObject({ x: 96, y: 96 });
    expect(drawing?.features).toMatchObject({ connectorCount: 1, unsupportedCount: 0 });
    expect(outcome.model.coverage?.entries.every((entry) => entry.skipped === 0)).toBe(true);
  });

  it("returns partial instead of hiding an unsupported visible graphic", async () => {
    const outcome = await driver.open(context(true));
    expect(outcome).toMatchObject({
      status: "partial",
      warnings: [{ code: "OFFICE_CONTENT_SKIPPED" }],
      skipped: [{ code: "OFFICE_DRAWING_OBJECT_SKIPPED", count: 1 }],
    });
  });

  it("marks defaulted page geometry as partial instead of reporting an exact Word page", async () => {
    const outcome = await driver.open(context(false, false));
    expect(outcome.status).toBe("partial");
    if (outcome.status !== "partial") throw new Error("Expected partial Word output");
    expect(outcome.skipped).toEqual(
      expect.arrayContaining([
        { code: "OFFICE_WORD_SECTION_SKIPPED", count: 1 },
        { code: "OFFICE_WORD_PAGE_GEOMETRY_SKIPPED", count: 2 },
      ]),
    );
  });
});

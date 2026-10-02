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
 * Verifies fixed-canvas PowerPoint flowchart parsing and completion coverage.
 */

import { createOoxmlDriver } from "../../../src/codecs/office/ooxml-codec.js";
import { defaultResourceBudget } from "../../../src/runtime/resource-budget.js";
import type { DriverContext } from "../../../src/shared/contracts/driver.js";
import { storedZip } from "../../support/stored-zip.js";

const driver = createOoxmlDriver("pptx", "presentation");

/**
 * Builds a two-slide presentation whose relationship order differs from its filenames.
 *
 * @returns Complete deterministic presentation fixture.
 */
function presentationFixture(): Uint8Array {
  return storedZip({
    "ppt/presentation.xml":
      '<p:presentation xmlns:p="p" xmlns:r="r"><p:sldIdLst><p:sldId id="257" r:id="rId2"/><p:sldId id="256" r:id="rId1"/></p:sldIdLst><p:sldSz cx="9144000" cy="5143500"/></p:presentation>',
    "ppt/_rels/presentation.xml.rels":
      '<Relationships><Relationship Id="rId1" Target="slides/slide1.xml"/><Relationship Id="rId2" Target="slides/slide2.xml"/></Relationships>',
    "ppt/slides/slide2.xml":
      '<p:sld xmlns:p="p" xmlns:a="a"><p:cSld><p:bg><p:bgPr><a:solidFill><a:srgbClr val="FFF2CC"/></a:solidFill></p:bgPr></p:bg><p:spTree><p:nvGrpSpPr/><p:grpSpPr/><p:sp><p:nvSpPr><p:cNvPr id="20" name="Second"/></p:nvSpPr><p:spPr><a:xfrm><a:off x="952500" y="952500"/><a:ext cx="1905000" cy="952500"/></a:xfrm><a:prstGeom prst="roundRect"/><a:solidFill><a:srgbClr val="4472C4"/></a:solidFill></p:spPr><p:txBody><a:bodyPr anchor="ctr"/><a:p><a:pPr algn="ctr"/><a:r><a:rPr sz="1800"/><a:t>Second</a:t></a:r></a:p></p:txBody></p:sp></p:spTree></p:cSld></p:sld>',
    "ppt/slides/slide1.xml":
      '<p:sld xmlns:p="p" xmlns:a="a"><p:cSld><p:spTree><p:nvGrpSpPr/><p:grpSpPr/><p:sp><p:nvSpPr><p:cNvPr id="1" name="Decision"/></p:nvSpPr><p:spPr><a:xfrm><a:off x="1905000" y="1428750"/><a:ext cx="1905000" cy="952500"/></a:xfrm><a:prstGeom prst="flowChartDecision"/><a:solidFill><a:srgbClr val="70AD47"/></a:solidFill></p:spPr><p:txBody><a:bodyPr anchor="ctr"/><a:p><a:pPr algn="ctr"/><a:r><a:rPr sz="1600"/><a:t>Approve?</a:t></a:r></a:p></p:txBody></p:sp><p:cxnSp><p:nvCxnSpPr><p:cNvPr id="2" name="Connector"/><p:cNvCxnSpPr><a:stCxn id="1"/><a:endCxn id="1"/></p:cNvCxnSpPr></p:nvCxnSpPr><p:spPr><a:xfrm><a:off x="3800000" y="1905000"/><a:ext cx="952500" cy="476250"/></a:xfrm><a:prstGeom prst="straightConnector1"/><a:ln><a:tailEnd type="triangle"/></a:ln></p:spPr></p:cxnSp></p:spTree></p:cSld></p:sld>',
    "ppt/slides/_rels/slide1.xml.rels":
      '<Relationships><Relationship Id="rId1" Target="../slideLayouts/slideLayout1.xml"/></Relationships>',
    "ppt/slideLayouts/slideLayout1.xml":
      '<p:sldLayout xmlns:p="p" xmlns:a="a"><p:cSld><p:spTree><p:nvGrpSpPr/><p:grpSpPr/><p:sp><p:nvSpPr><p:cNvPr id="10" name="Prompt"/><p:nvPr><p:ph type="title"/></p:nvPr></p:nvSpPr><p:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="1000000" cy="500000"/></a:xfrm><a:prstGeom prst="rect"/></p:spPr><p:txBody><a:bodyPr/><a:p><a:r><a:t>Click to edit</a:t></a:r></a:p></p:txBody></p:sp></p:spTree></p:cSld></p:sldLayout>',
    "ppt/slideLayouts/_rels/slideLayout1.xml.rels":
      '<Relationships><Relationship Id="rId1" Target="../slideMasters/slideMaster1.xml"/></Relationships>',
    "ppt/slideMasters/slideMaster1.xml":
      '<p:sldMaster xmlns:p="p" xmlns:a="a"><p:cSld><p:bg><p:bgPr><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill></p:bgPr></p:bg><p:spTree><p:nvGrpSpPr/><p:grpSpPr/><p:sp><p:nvSpPr><p:cNvPr id="30" name="Master band"/></p:nvSpPr><p:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="9144000" cy="190500"/></a:xfrm><a:prstGeom prst="rect"/><a:solidFill><a:srgbClr val="203864"/></a:solidFill></p:spPr></p:sp></p:spTree></p:cSld></p:sldMaster>',
    "ppt/slideMasters/_rels/slideMaster1.xml.rels":
      '<Relationships><Relationship Id="rId1" Target="../theme/theme1.xml"/></Relationships>',
    "ppt/theme/theme1.xml":
      '<a:theme xmlns:a="a"><a:themeElements><a:clrScheme><a:dk1><a:srgbClr val="000000"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1></a:clrScheme></a:themeElements></a:theme>',
  });
}

/**
 * Creates a bounded driver context for the fixture.
 *
 * @param bytes - Presentation package used by the driver.
 * @returns Driver context.
 */
function context(bytes = presentationFixture()): DriverContext {
  return {
    resource: {
      id: "pptx-flowchart",
      name: "flowchart.pptx",
      mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
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
        return "blob:pptx-flowchart";
      },
      /**
       * Releases fixture resources.
       */
      dispose() {},
    },
    decision: { extension: "pptx", driver: "pptx", confidence: 1, evidence: [], conflicts: [] },
    budget: defaultResourceBudget,
    signal: new AbortController().signal,
    /**
     * Accepts parser progress without side effects.
     */
    reportProgress() {},
  };
}

describe("PPTX flowcharts", () => {
  it("uses presentation order, saved slide size, inherited artwork, and one text rendering path", async () => {
    const outcome = await driver.open(context());
    expect(outcome.status).toBe("complete");
    if (outcome.status !== "complete" || outcome.model.kind !== "paged") {
      throw new Error("Expected a complete paged presentation");
    }
    expect(outcome.model.pages).toHaveLength(2);
    expect(outcome.model.pages[0]).toMatchObject({ width: 960, height: 540, text: "" });
    expect(outcome.model.pages[0]?.drawing?.background).toBe("#FFF2CC");
    expect(outcome.model.pages[0]?.drawing?.shapes.some((shape) => shape.text === "Second")).toBe(
      true,
    );
    const second = outcome.model.pages[1]?.drawing;
    expect(second?.shapes.some((shape) => shape.name === "Master band")).toBe(true);
    expect(second?.shapes.some((shape) => shape.text === "Approve?")).toBe(true);
    expect(second?.shapes.some((shape) => shape.text === "Click to edit")).toBe(false);
    expect(second?.features).toMatchObject({ connectorCount: 1, unsupportedCount: 0 });
    expect(outcome.model.coverage?.entries.every((entry) => entry.skipped === 0)).toBe(true);
  });

  it("does not retain a filename-order compatibility path when presentation metadata is missing", async () => {
    const bytes = storedZip({
      "ppt/slides/slide1.xml":
        '<p:sld xmlns:p="p"><p:cSld><p:spTree><p:nvGrpSpPr/><p:grpSpPr/></p:spTree></p:cSld></p:sld>',
    });
    const outcome = await driver.open(context(bytes));
    expect(outcome).toMatchObject({
      status: "partial",
      model: { pages: [] },
      skipped: [{ code: "OFFICE_PRESENTATION_METADATA_SKIPPED", count: 1 }],
    });
  });
});

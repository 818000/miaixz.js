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
 * Supplies compact fixed-layout Office flowcharts to real-browser tests.
 */

import { storedZip } from "../../support/stored-zip.js";

/**
 * Creates one 16:9 presentation flowchart.
 *
 * @returns Deterministic PPTX package bytes.
 */
export function browserPresentationFixture(): Uint8Array {
  return storedZip({
    "ppt/presentation.xml":
      '<p:presentation xmlns:p="p" xmlns:r="r"><p:sldIdLst><p:sldId id="256" r:id="rId1"/></p:sldIdLst><p:sldSz cx="9144000" cy="5143500"/></p:presentation>',
    "ppt/_rels/presentation.xml.rels":
      '<Relationships><Relationship Id="rId1" Target="slides/slide1.xml"/></Relationships>',
    "ppt/slides/slide1.xml":
      '<p:sld xmlns:p="p" xmlns:a="a"><p:cSld><p:bg><p:bgPr><a:solidFill><a:srgbClr val="F2F2F2"/></a:solidFill></p:bgPr></p:bg><p:spTree><p:nvGrpSpPr/><p:grpSpPr/><p:sp><p:nvSpPr><p:cNvPr id="1" name="Start"/></p:nvSpPr><p:spPr><a:xfrm><a:off x="952500" y="1905000"/><a:ext cx="1524000" cy="762000"/></a:xfrm><a:prstGeom prst="flowChartTerminator"/><a:solidFill><a:srgbClr val="4472C4"/></a:solidFill></p:spPr><p:txBody><a:bodyPr anchor="ctr"/><a:p><a:pPr algn="ctr"/><a:r><a:rPr sz="1800"><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill></a:rPr><a:t>Start</a:t></a:r></a:p></p:txBody></p:sp><p:cxnSp><p:nvCxnSpPr><p:cNvPr id="2" name="Arrow"/></p:nvCxnSpPr><p:spPr><a:xfrm><a:off x="2476500" y="2286000"/><a:ext cx="1428750" cy="0"/></a:xfrm><a:prstGeom prst="straightConnector1"/><a:ln w="19050"><a:solidFill><a:srgbClr val="203864"/></a:solidFill><a:tailEnd type="triangle"/></a:ln></p:spPr></p:cxnSp><p:sp><p:nvSpPr><p:cNvPr id="3" name="Decision"/></p:nvSpPr><p:spPr><a:xfrm><a:off x="3905250" y="1666875"/><a:ext cx="1905000" cy="1238250"/></a:xfrm><a:prstGeom prst="flowChartDecision"/><a:gradFill><a:gsLst><a:gs pos="0"><a:srgbClr val="A9D18E"/></a:gs><a:gs pos="100000"><a:srgbClr val="70AD47"/></a:gs></a:gsLst><a:lin ang="5400000"/></a:gradFill></p:spPr><p:txBody><a:bodyPr anchor="ctr"/><a:p><a:pPr algn="ctr"/><a:r><a:rPr sz="1600"/><a:t>Approved?</a:t></a:r></a:p></p:txBody></p:sp></p:spTree></p:cSld></p:sld>',
  });
}

/**
 * Creates one anchored Word flowchart page.
 *
 * @returns Deterministic DOCX package bytes.
 */
export function browserWordFixture(): Uint8Array {
  return storedZip({
    "word/document.xml":
      '<w:document xmlns:w="w" xmlns:wp="wp" xmlns:a="a" xmlns:wps="wps"><w:body><w:p><w:r><w:rPr><w:sz w:val="28"/><w:b/></w:rPr><w:t>Approval flow</w:t></w:r></w:p><w:p><w:r><w:drawing><wp:anchor simplePos="0"><wp:positionH relativeFrom="page"><wp:posOffset>952500</wp:posOffset></wp:positionH><wp:positionV relativeFrom="page"><wp:posOffset>2381250</wp:posOffset></wp:positionV><wp:extent cx="1524000" cy="762000"/><a:graphic><a:graphicData><wps:wsp><wps:bodyPr anchor="ctr"/><wps:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="1524000" cy="762000"/></a:xfrm><a:prstGeom prst="flowChartTerminator"/><a:solidFill><a:srgbClr val="4472C4"/></a:solidFill></wps:spPr><wps:txbx><w:txbxContent><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:sz w:val="18"/><w:b/><w:color w:val="FFFFFF"/></w:rPr><w:t>Start</w:t></w:r></w:p></w:txbxContent></wps:txbx></wps:wsp></a:graphicData></a:graphic></wp:anchor></w:drawing></w:r></w:p><w:p><w:r><w:drawing><wp:anchor simplePos="0"><wp:positionH relativeFrom="page"><wp:posOffset>2476500</wp:posOffset></wp:positionH><wp:positionV relativeFrom="page"><wp:posOffset>2762250</wp:posOffset></wp:positionV><wp:extent cx="1428750" cy="1"/><a:graphic><a:graphicData><wps:wsp><wps:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="1428750" cy="1"/></a:xfrm><a:prstGeom prst="straightConnector1"/><a:ln w="19050"><a:solidFill><a:srgbClr val="203864"/></a:solidFill><a:tailEnd type="triangle"/></a:ln></wps:spPr></wps:wsp></a:graphicData></a:graphic></wp:anchor></w:drawing></w:r></w:p><w:p><w:r><w:drawing><wp:anchor simplePos="0"><wp:positionH relativeFrom="page"><wp:posOffset>3905250</wp:posOffset></wp:positionH><wp:positionV relativeFrom="page"><wp:posOffset>2143125</wp:posOffset></wp:positionV><wp:extent cx="1905000" cy="1238250"/><a:graphic><a:graphicData><wps:wsp><wps:bodyPr anchor="ctr"/><wps:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="1905000" cy="1238250"/></a:xfrm><a:prstGeom prst="flowChartDecision"/><a:solidFill><a:srgbClr val="70AD47"/></a:solidFill></wps:spPr><wps:txbx><w:txbxContent><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:sz w:val="18"/><w:b/></w:rPr><w:t>Approved?</w:t></w:r></w:p></w:txbxContent></wps:txbx></wps:wsp></a:graphicData></a:graphic></wp:anchor></w:drawing></w:r></w:p><w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr></w:body></w:document>',
  });
}

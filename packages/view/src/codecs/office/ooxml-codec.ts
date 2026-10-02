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
 * Provides the local OOXML codec and Office diagram recognition.
 */

import { ZipArchive } from "../archive/zip-codec.js";
import {
  allElements,
  elementsByLocalName as elements,
  firstElementByLocalName as first,
  localAttribute as attribute,
  parseXmlDocument as parseXml,
  textFromElements as textContent,
  type XmlDocument,
  type XmlElement,
} from "../xml/xml-codec.js";
import type {
  DiagramEdge,
  DiagramNode,
  DrawingScene,
  DrawingShape,
  OfficeCoverageEntry,
  PagedDocument,
  ParseOutcome,
  SkippedFeature,
  SpreadsheetCoverageEntry,
  SpreadsheetRenderCell,
  SpreadsheetRenderDocument,
  SpreadsheetRenderSheet,
  SpreadsheetRange,
  ViewerDocument,
  ViewerWarning,
} from "../../shared/contracts/document.js";
import type { ViewerDriver } from "../../shared/contracts/driver.js";
import type { ResourceBudget } from "../../shared/contracts/resource-budget.js";
import { documentTitle, stableDocumentId } from "../../shared/document/document-identity.js";
import { ViewerError, sanitizeViewerError } from "../../shared/errors/viewer-error.js";
import { parseOfficeDrawing, type OfficeDrawingImage } from "./drawing-codec.js";
import { decodeEmf } from "./emf-codec.js";
import { buildSpreadsheetCoverage, spreadsheetParseOutcome } from "./spreadsheet-feature-codec.js";
import {
  parseSpreadsheetAddress,
  parseSpreadsheetLayout,
  parseSpreadsheetRange,
  type SpreadsheetLayoutOptions,
} from "./spreadsheet-layout-codec.js";
import {
  formatSpreadsheetValue,
  parseSpreadsheetStyles,
  spreadsheetNormalMaximumDigitWidth,
} from "./spreadsheet-style-codec.js";
import {
  defaultOfficeTheme,
  parseOfficeTheme,
  resolveOfficeColor,
  type OfficeTheme,
} from "./theme-codec.js";
import { parseVmlDrawing, parseVmlElements } from "./vml-codec.js";

type XMLDocument = XmlDocument;

/**
 * Reads visible spreadsheet string content while excluding phonetic guides.
 *
 * SpreadsheetML stores ruby readings in `rPh` children beside the displayed
 * text. Excel hides those readings unless phonetic guides are explicitly
 * enabled, so concatenating every descendant text node corrupts the preview.
 *
 * @param element - Shared-string, inline-string, or rich-text container.
 * @returns Visible text without phonetic-guide nodes.
 */
function spreadsheetStringText(element: XmlElement): string {
  let value = "";
  for (const child of element.children) {
    if (child.localName === "rPh" || child.localName === "phoneticPr") continue;
    if (child.localName === "t") value += child.textContent;
    else value += spreadsheetStringText(child);
  }
  return value;
}

/**
 * Converts an OOXML ARGB tab color to an opaque browser RGB color.
 *
 * @param value - Six- or eight-digit hexadecimal OOXML color.
 * @returns CSS color when the value is valid.
 */
function spreadsheetTabColor(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const match = /^(?:[\dA-F]{2})?([\dA-F]{6})$/iu.exec(value);
  return match?.[1] === undefined ? undefined : `#${match[1].toUpperCase()}`;
}

/**
 * Extracts the A1 range after a workbook-qualified defined name.
 *
 * @param source - Defined-name formula such as `'Sheet 1'!$A$1:$D$20`.
 * @returns Parsed first rectangular range when the name has a static A1 target.
 */
function workbookDefinedRange(source: string): SpreadsheetRange | undefined {
  const separator = source.lastIndexOf("!");
  const reference = (separator < 0 ? source : source.slice(separator + 1))
    .split(",", 1)[0]
    ?.replaceAll("$", "")
    .trim();
  return reference === undefined ? undefined : parseSpreadsheetRange(reference);
}

/**
 * Extracts a whole-row print-title range into the shared range contract.
 *
 * @param source - Defined-name formula containing an absolute whole-row range.
 * @returns Zero-based title rows when the definition is static.
 */
function workbookPrintTitleRows(source: string): SpreadsheetRange | undefined {
  const match = /\$(\d+):\$(\d+)/u.exec(source);
  if (match === null) return undefined;
  const startRow = Math.max(0, Number(match[1]) - 1);
  const endRow = Math.max(startRow, Number(match[2]) - 1);
  return {
    reference: `${match[1]}:${match[2]}`,
    startRow,
    startColumn: 0,
    endRow,
    endColumn: 0,
  };
}

/**
 * Resolves print-area and repeating-row names by zero-based sheet index.
 *
 * @param workbook - Parsed workbook document.
 * @returns Per-sheet layout options consumed before coordinate generation.
 */
function workbookPrintSettings(
  workbook: XmlDocument,
): ReadonlyMap<number, SpreadsheetLayoutOptions> {
  const settings = new Map<number, SpreadsheetLayoutOptions>();
  for (const name of elements(workbook, "definedName")) {
    const sheetIndex = Number(attribute(name, "localSheetId"));
    if (!Number.isInteger(sheetIndex) || sheetIndex < 0) continue;
    const current = settings.get(sheetIndex) ?? {};
    const definedName = attribute(name, "name");
    if (definedName === "_xlnm.Print_Area") {
      const printArea = workbookDefinedRange(name.textContent);
      if (printArea !== undefined) settings.set(sheetIndex, { ...current, printArea });
    } else if (definedName === "_xlnm.Print_Titles") {
      const printTitleRows = workbookPrintTitleRows(name.textContent);
      if (printTitleRows !== undefined) settings.set(sheetIndex, { ...current, printTitleRows });
    }
  }
  return settings;
}

/**
 * Identifies the three OOXML document models implemented by the shared decoder.
 */
export type OoxmlDocumentKind = "document" | "presentation" | "spreadsheet";

/**
 * Rejects one input as soon as a named resource budget is exceeded.
 *
 * @param field - Resource budget field being enforced.
 * @param actual - Observed resource count.
 * @param allowed - Maximum permitted resource count.
 */
function assertResourceLimit(field: keyof ResourceBudget, actual: number, allowed: number): void {
  if (actual <= allowed) return;
  throw new ViewerError("RESOURCE_LIMIT_EXCEEDED", "parse", false, [], {
    field,
    actual,
    allowed,
  });
}

/**
 * Resolves an OPC relationship target against its owning package part.
 *
 * @param basePart - Normalized path of the relationship owner.
 * @param target - Relative target stored in the relationship record.
 * @returns Normalized package path of the resolved target.
 */
function normalizePartPath(basePart: string, target: string): string {
  const base = target.startsWith("/") ? [] : basePart.split("/");
  if (!target.startsWith("/")) base.pop();
  for (const segment of target.split("/")) {
    if (segment === "..") base.pop();
    else if (segment !== "." && segment !== "") base.push(segment);
  }
  return base.join("/");
}

/**
 * Reads internal OPC relationships for one package part.
 *
 * @param archive - Open package container.
 * @param part - Normalized path of the relationship owner.
 * @param maxNodes - Maximum number of XML nodes accepted by the parser.
 * @param maxDepth - Maximum XML nesting depth accepted by the parser.
 * @returns Relationship identifier map containing only internal targets.
 */
async function relationships(
  archive: ZipArchive,
  part: string,
  maxNodes: number,
  maxDepth = 128,
): Promise<Map<string, string>> {
  const segments = part.split("/");
  const filename = segments.pop();
  const relationshipPath = `${segments.join("/")}/_rels/${filename}.rels`;
  if (!archive.entries.some((entry) => entry.path === relationshipPath)) return new Map();
  const document = parseXml(await archive.text(relationshipPath), maxNodes, maxDepth);
  const result = new Map<string, string>();
  for (const relation of elements(document, "Relationship")) {
    const id = attribute(relation, "Id");
    const target = attribute(relation, "Target");
    const mode = attribute(relation, "TargetMode");
    if (id !== undefined && target !== undefined && mode !== "External") {
      result.set(id, normalizePartPath(part, target));
    }
  }
  return result;
}

/**
 * Encodes binary package content as a browser-safe base64 string.
 *
 * @param bytes - Binary content being embedded in a data URL.
 * @returns Base64 representation without line breaks.
 */
function base64(bytes: Uint8Array): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let result = "";
  for (let index = 0; index < bytes.length; index += 3) {
    const firstByte = bytes[index] ?? 0;
    const secondByte = bytes[index + 1] ?? 0;
    const thirdByte = bytes[index + 2] ?? 0;
    const value = (firstByte << 16) | (secondByte << 8) | thirdByte;
    result += alphabet[(value >>> 18) & 63] ?? "";
    result += alphabet[(value >>> 12) & 63] ?? "";
    result += index + 1 < bytes.length ? (alphabet[(value >>> 6) & 63] ?? "") : "=";
    result += index + 2 < bytes.length ? (alphabet[value & 63] ?? "") : "=";
  }
  return result;
}

/**
 * Resolves a package media path to a conservative browser MIME type.
 *
 * @param path - Normalized media-part path.
 * @returns MIME type suitable for a data URL.
 */
function imageMimeType(path: string): string {
  const extension = path.split(".").at(-1)?.toLowerCase();
  if (extension === "png") return "image/png";
  if (extension === "gif") return "image/gif";
  if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
  if (extension === "svg") return "image/svg+xml";
  if (extension === "emf") return "image/emf";
  if (extension === "wmf") return "image/wmf";
  return "application/octet-stream";
}

/**
 * Reads safe raster dimensions without invoking a browser image decoder.
 *
 * @param bytes - Complete embedded image bytes.
 * @param mimeType - Validated media relationship MIME type.
 * @returns Image dimensions when the header is valid and supported.
 */
function rasterDimensions(
  bytes: Uint8Array,
  mimeType: string,
): { readonly width: number; readonly height: number } | undefined {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (
    mimeType === "image/png" &&
    bytes.length >= 24 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return { width: view.getUint32(16), height: view.getUint32(20) };
  }
  if (
    mimeType === "image/gif" &&
    bytes.length >= 10 &&
    new TextDecoder().decode(bytes.subarray(0, 3)) === "GIF"
  ) {
    return { width: view.getUint16(6, true), height: view.getUint16(8, true) };
  }
  if (mimeType === "image/jpeg" && bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = bytes[offset + 1] ?? 0;
      const length = view.getUint16(offset + 2);
      if (length < 2 || offset + 2 + length > bytes.length) return undefined;
      if ((marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7)) {
        return { width: view.getUint16(offset + 7), height: view.getUint16(offset + 5) };
      }
      offset += 2 + length;
    }
  }
  return undefined;
}

/**
 * Validates one embedded SVG as inert, self-contained image markup.
 *
 * @param bytes - Complete embedded SVG bytes.
 * @param budget - XML resource limits applied to the SVG tree.
 */
function validateSvg(bytes: Uint8Array, budget: ResourceBudget): void {
  let source: string;
  try {
    source = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new ViewerError("PARSE_FAILED", "parse");
  }
  const document = parseXml(source, budget.maxXmlNodes, budget.maxXmlDepth);
  if (document.documentElement.localName !== "svg") {
    throw new ViewerError("PARSE_FAILED", "parse");
  }
  for (const element of [document.documentElement, ...allElements(document)]) {
    if (["script", "foreignObject", "iframe", "object"].includes(element.localName)) {
      throw new ViewerError("SECURITY_BLOCKED", "parse");
    }
    for (const attributeValue of element.attributes) {
      if (attributeValue.localName.toLowerCase().startsWith("on")) {
        throw new ViewerError("SECURITY_BLOCKED", "parse");
      }
      if (
        /(?:javascript\s*:|https?\s*:|\/\/)/iu.test(attributeValue.value) ||
        /url\(\s*['"]?https?:/iu.test(attributeValue.value) ||
        (/^data\s*:/iu.test(attributeValue.value) &&
          !/^data:image\/(?:gif|jpe?g|png);base64,/iu.test(attributeValue.value))
      ) {
        throw new ViewerError("SECURITY_BLOCKED", "parse");
      }
    }
  }
}

/**
 * Enforces image dimensions and self-contained SVG security before rendering.
 *
 * @param bytes - Complete embedded image bytes.
 * @param mimeType - Validated image MIME type.
 * @param budget - Image and XML resource limits.
 */
export function validateOfficeImage(
  bytes: Uint8Array,
  mimeType: string,
  budget: ResourceBudget,
): void {
  if (mimeType === "image/svg+xml") {
    validateSvg(bytes, budget);
    return;
  }
  const dimensions = rasterDimensions(bytes, mimeType);
  if (dimensions === undefined || dimensions.width <= 0 || dimensions.height <= 0) {
    throw new ViewerError("PARSE_FAILED", "parse");
  }
  assertResourceLimit(
    "maxImagePixels",
    dimensions.width * dimensions.height,
    budget.maxImagePixels,
  );
}

/**
 * Loads image relationships owned by one drawing part.
 *
 * @param archive - Open OOXML package.
 * @param drawingPart - Normalized drawing-part path.
 * @param budget - Resource limits applied to XML and image decoding.
 * @param signal - Optional cancellation signal for related media traversal.
 * @returns Relationship identifier map containing inert data URLs.
 */
async function drawingImages(
  archive: ZipArchive,
  drawingPart: string,
  budget: ResourceBudget,
  signal?: AbortSignal,
): Promise<Map<string, OfficeDrawingImage>> {
  const related = await relationships(archive, drawingPart, budget.maxXmlNodes, budget.maxXmlDepth);
  const images = new Map<string, OfficeDrawingImage>();
  for (const [id, path] of related) {
    signal?.throwIfAborted();
    if (
      !archive.entries.some((entry) => entry.path === path) ||
      !/\.(?:emf|gif|jpe?g|png|svg|wmf)$/iu.test(path)
    )
      continue;
    const bytes = await archive.read(path);
    const mimeType = imageMimeType(path);
    if (mimeType === "image/emf") {
      const decoded = decodeEmf(bytes, budget);
      images.set(id, {
        mimeType: decoded.mimeType,
        source: decoded.source,
        ...(decoded.unsupportedRecords.length === 0 && decoded.visible
          ? {}
          : {
              unsupportedRecords: decoded.unsupportedRecords.length + (decoded.visible ? 0 : 1),
            }),
      });
    } else if (mimeType === "image/wmf") {
      continue;
    } else {
      validateOfficeImage(bytes, mimeType, budget);
      images.set(id, {
        mimeType,
        source: `data:${mimeType};base64,${base64(bytes)}`,
      });
    }
  }
  return images;
}

/**
 * Loads one package theme or returns deterministic Office-compatible defaults.
 *
 * @param archive - Open OOXML package.
 * @param path - Normalized package path of the requested theme.
 * @param maxNodes - Maximum XML nodes accepted in the theme part.
 * @param maxDepth - Maximum XML nesting depth accepted in the theme part.
 * @returns Parsed Office theme.
 */
async function packageTheme(
  archive: ZipArchive,
  path: string,
  maxNodes: number,
  maxDepth = 128,
): Promise<OfficeTheme> {
  if (!archive.entries.some((entry) => entry.path === path)) return defaultOfficeTheme();
  return parseOfficeTheme(parseXml(await archive.text(path), maxNodes, maxDepth));
}

/**
 * Resolves materialized SmartArt drawings referenced by one DrawingML part.
 *
 * @param archive - Open OOXML package.
 * @param drawingPart - Normalized owner drawing path.
 * @param drawingDocument - Parsed owner drawing document.
 * @param theme - Active Office theme.
 * @param budget - Resource limits applied to related diagram parts.
 * @param signal - Optional cancellation signal for diagram traversal.
 * @returns Data-model relationship identifiers mapped to materialized scenes.
 */
async function drawingDiagrams(
  archive: ZipArchive,
  drawingPart: string,
  drawingDocument: XMLDocument,
  theme: OfficeTheme,
  budget: ResourceBudget,
  signal?: AbortSignal,
): Promise<Map<string, DrawingScene>> {
  const ownerRelationships = await relationships(
    archive,
    drawingPart,
    budget.maxXmlNodes,
    budget.maxXmlDepth,
  );
  const diagrams = new Map<string, DrawingScene>();
  for (const relationIds of elements(drawingDocument, "relIds")) {
    signal?.throwIfAborted();
    const dataId = attribute(relationIds, "dm");
    const dataPart = dataId === undefined ? undefined : ownerRelationships.get(dataId);
    if (dataId === undefined || dataPart === undefined) continue;
    const dataRelationships = await relationships(
      archive,
      dataPart,
      budget.maxXmlNodes,
      budget.maxXmlDepth,
    );
    const materializedPart = [...dataRelationships.values()].find((path) =>
      /(?:^|\/)diagrams\/drawing\d+\.xml$/iu.test(path),
    );
    if (
      materializedPart === undefined ||
      !archive.entries.some((entry) => entry.path === materializedPart)
    ) {
      continue;
    }
    diagrams.set(
      dataId,
      parseOfficeDrawing(
        parseXml(await archive.text(materializedPart), budget.maxXmlNodes, budget.maxXmlDepth),
        {
          id: `${drawingPart}-${dataId}-smartart`,
          title: "SmartArt",
          theme,
          images: await drawingImages(archive, materializedPart, budget, signal),
        },
      ),
    );
  }
  return diagrams;
}

/**
 * Parses workbook sheets, cells, formulas, drawings, and flowchart semantics.
 *
 * @param archive - Open OOXML package container.
 * @param bytes - Complete workbook source bytes used for stable identity.
 * @param title - Safe display title for the workbook.
 * @param budget - Resource limits applied to the complete workbook.
 * @param signal - Optional cancellation signal for workbook traversal.
 * @returns Format-neutral spreadsheet document with attached drawings.
 */
export async function parseSpreadsheet(
  archive: ZipArchive,
  bytes: Uint8Array,
  title: string,
  budget: ResourceBudget,
  signal?: AbortSignal,
): Promise<SpreadsheetRenderDocument> {
  signal?.throwIfAborted();
  const maxNodes = budget.maxXmlNodes;
  const documentId = stableDocumentId(title, bytes);
  const sharedStrings = archive.entries.some((entry) => entry.path === "xl/sharedStrings.xml")
    ? elements(
        parseXml(await archive.text("xl/sharedStrings.xml"), maxNodes, budget.maxXmlDepth),
        "si",
      ).map((element) => spreadsheetStringText(element))
    : [];
  const workbook = parseXml(await archive.text("xl/workbook.xml"), maxNodes, budget.maxXmlDepth);
  const workbookRels = await relationships(
    archive,
    "xl/workbook.xml",
    maxNodes,
    budget.maxXmlDepth,
  );
  const theme = await packageTheme(archive, "xl/theme/theme1.xml", maxNodes, budget.maxXmlDepth);
  const stylesDocument = archive.entries.some((entry) => entry.path === "xl/styles.xml")
    ? parseXml(await archive.text("xl/styles.xml"), maxNodes, budget.maxXmlDepth)
    : parseXml("<styleSheet/>", maxNodes, budget.maxXmlDepth);
  const styleCount = ["cellXfs", "cellStyleXfs", "dxfs"].reduce((count, name) => {
    const container = first(stylesDocument, name);
    if (container === undefined) return count;
    const childName = name === "dxfs" ? "dxf" : "xf";
    return count + container.children.filter((child) => child.localName === childName).length;
  }, 0);
  assertResourceLimit("maxSpreadsheetStyles", styleCount, budget.maxSpreadsheetStyles);
  const styles = parseSpreadsheetStyles(stylesDocument, theme);
  const maximumDigitWidth = spreadsheetNormalMaximumDigitWidth(stylesDocument);
  const date1904 =
    attribute(first(workbook, "workbookPr") ?? workbook.documentElement, "date1904") === "1";
  const activeSheetIndex = Math.max(
    0,
    Number(
      attribute(first(workbook, "workbookView") ?? workbook.documentElement, "activeTab") ?? 0,
    ),
  );
  const printSettings = workbookPrintSettings(workbook);
  const sheets: SpreadsheetRenderSheet[] = [];
  const drawings: DrawingScene[] = [];
  const unsupportedCounts = new Map<
    SpreadsheetCoverageEntry["feature"],
    { readonly count: number; readonly part: string }
  >();
  /**
   * Adds one unsupported visible feature family to the coverage inventory.
   *
   * @param feature - Stable feature family identifier.
   * @param count - Number of visible occurrences discovered.
   * @param part - Representative package part containing the feature.
   */
  const recordUnsupported = (
    feature: SpreadsheetCoverageEntry["feature"],
    count: number,
    part: string,
  ): void => {
    if (count === 0) return;
    const current = unsupportedCounts.get(feature);
    unsupportedCounts.set(feature, {
      count: (current?.count ?? 0) + count,
      part: current?.part ?? part,
    });
  };
  const workbookSheets = elements(workbook, "sheet");
  assertResourceLimit("maxSpreadsheetSheets", workbookSheets.length, budget.maxSpreadsheetSheets);
  let cellCount = 0;
  let drawingObjectCount = 0;
  let estimatedMemoryBytes =
    bytes.byteLength + sharedStrings.join("").length * 2 + styleCount * 256;
  for (const [sheetIndex, sheet] of workbookSheets.entries()) {
    signal?.throwIfAborted();
    const relationId = attribute(sheet, "id");
    const part = relationId === undefined ? undefined : workbookRels.get(relationId);
    if (part === undefined || !archive.entries.some((entry) => entry.path === part)) {
      recordUnsupported("sheet-layout", 1, "xl/workbook.xml");
      continue;
    }
    const sheetDocument = parseXml(await archive.text(part), maxNodes, budget.maxXmlDepth);
    recordUnsupported(
      "conditional-format",
      elements(sheetDocument, "conditionalFormatting").length,
      part,
    );
    recordUnsupported("table", elements(sheetDocument, "tablePart").length, part);
    recordUnsupported("sparkline", elements(sheetDocument, "sparklineGroup").length, part);
    recordUnsupported("filter", elements(sheetDocument, "autoFilter").length, part);
    recordUnsupported("hyperlink", elements(sheetDocument, "hyperlink").length, part);
    recordUnsupported(
      "active-content-preview",
      elements(sheetDocument, "oleObject").length + elements(sheetDocument, "control").length,
      part,
    );
    const layout = parseSpreadsheetLayout(sheetDocument, {
      ...printSettings.get(sheetIndex),
      maximumDigitWidth,
    });
    assertResourceLimit(
      "maxSpreadsheetRows",
      layout.dimension.endRow + 1,
      budget.maxSpreadsheetRows,
    );
    assertResourceLimit(
      "maxSpreadsheetColumns",
      layout.dimension.endColumn + 1,
      budget.maxSpreadsheetColumns,
    );
    const cellElements = elements(sheetDocument, "c");
    cellCount += cellElements.length;
    assertResourceLimit("maxSpreadsheetCells", cellCount, budget.maxSpreadsheetCells);
    estimatedMemoryBytes +=
      cellElements.length * 160 +
      (layout.rowOffsets.length + layout.columnOffsets.length) * Float64Array.BYTES_PER_ELEMENT;
    assertResourceLimit(
      "maxEstimatedMemoryBytes",
      estimatedMemoryBytes,
      budget.maxEstimatedMemoryBytes,
    );
    const cells: SpreadsheetRenderCell[] = cellElements.map((cell) => {
      const address = attribute(cell, "r") ?? `cell-${sheetIndex + 1}`;
      const position = parseSpreadsheetAddress(address) ?? { row: 0, column: 0 };
      const type = attribute(cell, "t");
      const rawValue = first(cell, "v")?.textContent ?? "";
      const inline = first(cell, "is");
      let value: SpreadsheetRenderCell["value"];
      if (type === "s") value = sharedStrings[Number(rawValue)] ?? "";
      else if (type === "inlineStr" && inline !== undefined) value = spreadsheetStringText(inline);
      else if (type === "b") value = rawValue === "1";
      else if (type === "e" || type === "str") value = rawValue;
      else if (rawValue === "") value = null;
      else value = Number.isFinite(Number(rawValue)) ? Number(rawValue) : rawValue;
      const formula = first(cell, "f")?.textContent ?? undefined;
      const styleId = Math.max(0, Number(attribute(cell, "s") ?? 0));
      const style = styles.cellStyles[styleId] ?? styles.cellStyles[0];
      return {
        address,
        value,
        row: position.row,
        column: position.column,
        styleId,
        displayValue:
          style === undefined
            ? String(value ?? "")
            : formatSpreadsheetValue(value, style, date1904),
        ...(formula === undefined ? {} : { formula }),
      };
    });
    const sheetId = `sheet-${sheetIndex + 1}`;
    const sheetName = attribute(sheet, "name") ?? `Sheet ${sheetIndex + 1}`;
    const stateValue = attribute(sheet, "state");
    const state = stateValue === "hidden" || stateValue === "veryHidden" ? stateValue : "visible";
    const tabColor = spreadsheetTabColor(
      attribute(first(sheetDocument, "tabColor") ?? sheetDocument.documentElement, "rgb"),
    );
    sheets.push({
      id: sheetId,
      name: sheetName,
      state,
      ...(tabColor === undefined ? {} : { tabColor }),
      cells,
      layout,
    });
    const sheetRels = await relationships(archive, part, maxNodes, budget.maxXmlDepth);
    for (const drawingReference of elements(sheetDocument, "drawing")) {
      const id = attribute(drawingReference, "id");
      const drawingPart = id === undefined ? undefined : sheetRels.get(id);
      if (
        drawingPart === undefined ||
        !archive.entries.some((entry) => entry.path === drawingPart)
      ) {
        recordUnsupported("drawing", 1, part);
        continue;
      }
      const drawingDocument = parseXml(
        await archive.text(drawingPart),
        maxNodes,
        budget.maxXmlDepth,
      );
      const drawing = parseOfficeDrawing(drawingDocument, {
        id: `${documentId}-drawing-${drawings.length + 1}`,
        title: `${sheetName} drawing`,
        sheetId,
        sheetName,
        theme,
        layout,
        images: await drawingImages(archive, drawingPart, budget, signal),
        diagrams: await drawingDiagrams(
          archive,
          drawingPart,
          drawingDocument,
          theme,
          budget,
          signal,
        ),
      });
      drawings.push(drawing);
      drawingObjectCount +=
        drawing.shapes.length +
        (drawing.features?.groupCount ?? 0) +
        (drawing.features?.smartArtCount ?? 0);
      assertResourceLimit("maxDrawingObjects", drawingObjectCount, budget.maxDrawingObjects);
      estimatedMemoryBytes += drawing.shapes.length * 512;
      assertResourceLimit(
        "maxEstimatedMemoryBytes",
        estimatedMemoryBytes,
        budget.maxEstimatedMemoryBytes,
      );
    }
    for (const legacyReference of elements(sheetDocument, "legacyDrawing")) {
      const relationId = attribute(legacyReference, "id");
      const legacyPart = relationId === undefined ? undefined : sheetRels.get(relationId);
      if (legacyPart === undefined || !archive.entries.some((entry) => entry.path === legacyPart)) {
        recordUnsupported("vml", 1, part);
        continue;
      }
      const drawing = parseVmlDrawing(
        await archive.text(legacyPart),
        `${documentId}-drawing-${drawings.length + 1}`,
        `${sheetName} legacy drawing`,
        maxNodes,
        sheetId,
        sheetName,
        budget.maxXmlDepth,
      );
      drawings.push(drawing);
      drawingObjectCount += drawing.shapes.length;
      assertResourceLimit("maxDrawingObjects", drawingObjectCount, budget.maxDrawingObjects);
    }
  }
  recordUnsupported(
    "chart",
    archive.entries.filter((entry) => /^xl\/charts\/chart\d+\.xml$/u.test(entry.path)).length,
    "xl/charts/*",
  );
  recordUnsupported(
    "pivot-view",
    archive.entries.filter((entry) => /^xl\/pivotTables\/pivotTable\d+\.xml$/u.test(entry.path))
      .length,
    "xl/pivotTables/*",
  );
  recordUnsupported(
    "comment",
    archive.entries.filter((entry) =>
      /^xl\/(?:comments\d+\.xml|threadedComments\/threadedComment\d+\.xml)$/u.test(entry.path),
    ).length,
    "xl/comments*",
  );
  recordUnsupported(
    "external-data-cache",
    archive.entries.filter((entry) => /^xl\/(?:externalLinks|connections\.xml)/u.test(entry.path))
      .length,
    "xl/externalLinks/*",
  );
  recordUnsupported(
    "active-content-preview",
    archive.entries.filter((entry) => /^xl\/(?:activeX|embeddings)\//u.test(entry.path)).length,
    "xl/activeX/*",
  );
  const activeSheetId =
    sheets[activeSheetIndex]?.id ??
    sheets.find((sheet) => sheet.state === "visible")?.id ??
    sheets[0]?.id ??
    "";
  const modelWithoutCoverage: Omit<SpreadsheetRenderDocument, "coverage"> = {
    schemaVersion: 1,
    id: documentId,
    kind: "spreadsheet",
    title,
    layoutVersion: 1,
    activeSheetId,
    styles,
    sheets,
    drawings,
  };
  const unsupportedEntries: SpreadsheetCoverageEntry[] = [...unsupportedCounts].map(
    ([feature, value]) => ({
      feature,
      part: value.part,
      discovered: value.count,
      modeled: 0,
      renderable: 0,
      skipped: value.count,
    }),
  );
  return {
    ...modelWithoutCoverage,
    coverage: buildSpreadsheetCoverage(modelWithoutCoverage, unsupportedEntries),
  };
}

const emuPerPixel = 9525;
const twipsPerPixel = 15;

/**
 * Returns a direct child by namespace-independent local name.
 *
 * @param parent - Element whose direct children are inspected.
 * @param localName - Requested local name.
 * @returns Matching child when present.
 */
function directChild(parent: XmlElement, localName: string): XmlElement | undefined {
  return parent.children.find((element) => element.localName === localName);
}

/**
 * Converts an OOXML length to CSS pixels.
 *
 * @param value - Optional numeric length.
 * @param divisor - Source units contained in one CSS pixel.
 * @param fallback - Value used when the source is not finite.
 * @returns Finite CSS pixel length.
 */
function officePixels(value: string | undefined, divisor: number, fallback = 0): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric / divisor : fallback;
}

/**
 * Returns whether a package contains a normalized part path.
 *
 * @param archive - Open OOXML package.
 * @param path - Normalized package part.
 * @returns Whether the part exists.
 */
function hasPart(archive: ZipArchive, path: string): boolean {
  return archive.entries.some((entry) => entry.path === path);
}

/**
 * Prefixes scene identifiers so multiple package parts can share one canvas.
 *
 * @param scene - Source drawing scene.
 * @param prefix - Stable owning-part prefix.
 * @returns Scene whose shape, node, and edge identifiers are unique.
 */
function prefixScene(scene: DrawingScene, prefix: string): DrawingScene {
  const idMap = new Map(scene.shapes.map((shape) => [shape.id, `${prefix}-${shape.id}`]));
  const edgeId = (id: string): string => `${prefix}-${id}`;
  const edges: DiagramEdge[] = scene.edges.map((edge) => ({
    ...edge,
    id: edgeId(edge.id),
    ...(edge.from === undefined ? {} : { from: idMap.get(edge.from) ?? `${prefix}-${edge.from}` }),
    ...(edge.to === undefined ? {} : { to: idMap.get(edge.to) ?? `${prefix}-${edge.to}` }),
  }));
  const nodes: DiagramNode[] = (scene.graph?.nodes ?? []).map((node) => ({
    ...node,
    id: idMap.get(node.id) ?? `${prefix}-${node.id}`,
  }));
  return {
    ...scene,
    id: `${prefix}-${scene.id}`,
    shapes: scene.shapes.map((shape) => ({
      ...shape,
      id: idMap.get(shape.id) ?? `${prefix}-${shape.id}`,
    })),
    edges,
    graph: {
      nodes,
      edges,
      warnings: (scene.graph?.warnings ?? []).map((warning) => ({
        ...warning,
        ...(warning.edgeId === undefined ? {} : { edgeId: edgeId(warning.edgeId) }),
        ...(warning.nodeId === undefined
          ? {}
          : { nodeId: idMap.get(warning.nodeId) ?? `${prefix}-${warning.nodeId}` }),
      })),
    },
  };
}

/**
 * Combines drawing parts in their visible z-order on one fixed canvas.
 *
 * @param id - Stable merged scene identifier.
 * @param title - Accessible scene title.
 * @param width - Canvas width in CSS pixels.
 * @param height - Canvas height in CSS pixels.
 * @param background - Resolved canvas background.
 * @param scenes - Source scenes in back-to-front order.
 * @returns One complete drawing scene.
 */
function mergeScenes(
  id: string,
  title: string,
  width: number,
  height: number,
  background: string,
  scenes: readonly DrawingScene[],
): DrawingScene {
  const prefixed = scenes.map((scene, index) => prefixScene(scene, `${id}-${index + 1}`));
  const shapes = prefixed.flatMap((scene) => scene.shapes);
  const edges = prefixed.flatMap((scene) => scene.edges);
  const nodes = prefixed.flatMap((scene) => scene.graph?.nodes ?? []);
  const totals = {
    shapeCount: 0,
    connectorCount: 0,
    groupCount: 0,
    pictureCount: 0,
    customGeometryCount: 0,
    smartArtCount: 0,
    unsupportedCount: 0,
  };
  for (const scene of prefixed) {
    const features = scene.features;
    if (features === undefined) continue;
    totals.shapeCount += features.shapeCount;
    totals.connectorCount += features.connectorCount;
    totals.groupCount += features.groupCount;
    totals.pictureCount += features.pictureCount;
    totals.customGeometryCount += features.customGeometryCount;
    totals.smartArtCount += features.smartArtCount;
    totals.unsupportedCount += features.unsupportedCount;
  }
  return {
    schemaVersion: 1,
    id,
    kind: "drawing",
    title,
    width,
    height,
    background,
    shapes,
    edges,
    graph: {
      nodes,
      edges,
      warnings: prefixed.flatMap((scene) => scene.graph?.warnings ?? []),
    },
    features: totals,
  };
}

/**
 * Removes non-content placeholders inherited from presentation masters/layouts.
 *
 * @param scene - Parsed master or layout scene.
 * @param source - Owning PresentationML part.
 * @returns Scene without empty edit-mode placeholder boxes.
 */
function removeEmptyPlaceholders(scene: DrawingScene, source: XMLDocument): DrawingScene {
  const placeholderIds = new Set<string>();
  for (const shape of allElements(source).filter((element) => element.localName === "sp")) {
    if (first(shape, "ph") === undefined) continue;
    const text = textContent(shape).replaceAll(/\s+/gu, " ").trim();
    if (text !== "" && !/click to|クリックして|单击|按一下/iu.test(text)) continue;
    const metadata = first(shape, "cNvPr");
    const id = attribute(metadata ?? shape, "id");
    if (id !== undefined) placeholderIds.add(id);
  }
  if (placeholderIds.size === 0) return scene;
  const shapes = scene.shapes.filter((shape) => !placeholderIds.has(shape.id));
  const nodes = (scene.graph?.nodes ?? []).filter((node) => !placeholderIds.has(node.id));
  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges = scene.edges.filter(
    (edge) =>
      (edge.from === undefined || nodeIds.has(edge.from)) &&
      (edge.to === undefined || nodeIds.has(edge.to)),
  );
  return {
    ...scene,
    shapes,
    edges,
    graph: { nodes, edges, warnings: scene.graph?.warnings ?? [] },
    ...(scene.features === undefined
      ? {}
      : {
          features: {
            ...scene.features,
            shapeCount: Math.max(
              0,
              scene.features.shapeCount - (scene.shapes.length - shapes.length),
            ),
          },
        }),
  };
}

/**
 * Converts one parsed drawing into a coverage entry.
 *
 * @param part - Owning package part.
 * @param scene - Parsed drawing scene.
 * @returns Coverage entry used by the Office completion gate.
 */
function drawingCoverage(part: string, scene: DrawingScene): OfficeCoverageEntry {
  const unsupported = scene.features?.unsupportedCount ?? 0;
  return {
    feature: "drawing-object",
    part,
    discovered: scene.shapes.length + unsupported,
    modeled: scene.shapes.length,
    renderable: scene.shapes.length,
    skipped: unsupported,
  };
}

/**
 * Resolves a static PresentationML background color.
 *
 * @param document - Slide, layout, or master document.
 * @param theme - Active presentation theme.
 * @returns Resolved background color when declared.
 */
function presentationBackground(document: XMLDocument, theme: OfficeTheme): string | undefined {
  const background = first(document, "bg");
  if (background === undefined) return undefined;
  return resolveOfficeColor(
    first(background, "solidFill") ?? first(background, "bgRef"),
    theme,
    "#FFFFFF",
  );
}

/**
 * Parses one presentation drawing part on a fixed slide canvas.
 *
 * @param archive - Open OOXML package.
 * @param path - Slide, layout, or master part.
 * @param document - Parsed part document.
 * @param id - Stable scene identifier.
 * @param title - Accessible scene title.
 * @param theme - Active theme.
 * @param budget - Resource limits.
 * @param width - Slide width.
 * @param height - Slide height.
 * @returns Parsed fixed-layout scene.
 */
async function presentationPartScene(
  archive: ZipArchive,
  path: string,
  document: XMLDocument,
  id: string,
  title: string,
  theme: OfficeTheme,
  budget: ResourceBudget,
  width: number,
  height: number,
): Promise<DrawingScene> {
  return parseOfficeDrawing(document, {
    id,
    title,
    theme,
    images: await drawingImages(archive, path, budget),
    diagrams: await drawingDiagrams(archive, path, document, theme, budget),
    canvas: { width, height },
  });
}

/**
 * Parses presentation slides using the saved slide order and canvas geometry.
 *
 * @param archive - Open OOXML package container.
 * @param bytes - Complete presentation source bytes used for stable identity.
 * @param title - Safe display title for the presentation.
 * @param budget - Resource limits applied to presentation parts.
 * @returns Fixed-layout presentation with explicit coverage.
 */
async function parsePresentation(
  archive: ZipArchive,
  bytes: Uint8Array,
  title: string,
  budget: ResourceBudget,
): Promise<PagedDocument> {
  const maxNodes = budget.maxXmlNodes;
  const id = stableDocumentId(title, bytes);
  const presentationPath = "ppt/presentation.xml";
  const coverage: OfficeCoverageEntry[] = [];
  if (!hasPart(archive, presentationPath)) {
    return {
      schemaVersion: 1,
      id,
      kind: "paged",
      title,
      pages: [],
      coverage: {
        entries: [
          {
            feature: "presentation-metadata",
            part: presentationPath,
            discovered: 1,
            modeled: 0,
            renderable: 0,
            skipped: 1,
          },
        ],
      },
    };
  }
  const presentation = parseXml(await archive.text(presentationPath), maxNodes, budget.maxXmlDepth);
  const size = first(presentation, "sldSz");
  const width = Math.max(
    1,
    officePixels(attribute(size ?? presentation.documentElement, "cx"), emuPerPixel, 960),
  );
  const height = Math.max(
    1,
    officePixels(attribute(size ?? presentation.documentElement, "cy"), emuPerPixel, 720),
  );
  const related = await relationships(archive, presentationPath, maxNodes, budget.maxXmlDepth);
  const slideIdentifiers = elements(presentation, "sldId");
  const slidePaths = slideIdentifiers
    .map((slide) => {
      const relationId = slide.attributes.find((item) => item.name === "r:id")?.value;
      return related.get(relationId ?? attribute(slide, "id") ?? "");
    })
    .filter((path): path is string => path !== undefined && hasPart(archive, path));
  coverage.push({
    feature: "presentation-metadata",
    part: presentationPath,
    discovered: 1,
    modeled: 1,
    renderable: 1,
    skipped: 0,
  });
  coverage.push({
    feature: "presentation-slide-size",
    part: presentationPath,
    discovered: 1,
    modeled: size === undefined ? 0 : 1,
    renderable: size === undefined ? 0 : 1,
    skipped: size === undefined ? 1 : 0,
  });
  coverage.push({
    feature: "presentation-slide-reference",
    part: presentationPath,
    discovered: slideIdentifiers.length,
    modeled: slidePaths.length,
    renderable: slidePaths.length,
    skipped: Math.max(0, slideIdentifiers.length - slidePaths.length),
  });
  const pages = [];
  for (const [index, path] of slidePaths.entries()) {
    const slide = parseXml(await archive.text(path), maxNodes, budget.maxXmlDepth);
    const slideRelations = await relationships(archive, path, maxNodes, budget.maxXmlDepth);
    const layoutPath = [...slideRelations.values()].find((part) => /\/slideLayouts\//u.test(part));
    const layout =
      layoutPath === undefined || !hasPart(archive, layoutPath)
        ? undefined
        : parseXml(await archive.text(layoutPath), maxNodes, budget.maxXmlDepth);
    const layoutRelations =
      layoutPath === undefined
        ? new Map<string, string>()
        : await relationships(archive, layoutPath, maxNodes, budget.maxXmlDepth);
    const masterPath = [...layoutRelations.values()].find((part) => /\/slideMasters\//u.test(part));
    const master =
      masterPath === undefined || !hasPart(archive, masterPath)
        ? undefined
        : parseXml(await archive.text(masterPath), maxNodes, budget.maxXmlDepth);
    const masterRelations =
      masterPath === undefined
        ? new Map<string, string>()
        : await relationships(archive, masterPath, maxNodes, budget.maxXmlDepth);
    const themePath = [...masterRelations.values()].find((part) =>
      /\/theme\/theme\d+\.xml$/u.test(part),
    );
    const theme = await packageTheme(
      archive,
      themePath ?? "ppt/theme/theme1.xml",
      maxNodes,
      budget.maxXmlDepth,
    );
    const scenes: DrawingScene[] = [];
    if (master !== undefined && attribute(slide.documentElement, "showMasterSp") !== "0") {
      const scene = removeEmptyPlaceholders(
        await presentationPartScene(
          archive,
          masterPath ?? "",
          master,
          `${id}-master-${index + 1}`,
          `Slide ${index + 1} master`,
          theme,
          budget,
          width,
          height,
        ),
        master,
      );
      scenes.push(scene);
      coverage.push(drawingCoverage(masterPath ?? "ppt/slideMasters", scene));
    }
    if (layout !== undefined) {
      const scene = removeEmptyPlaceholders(
        await presentationPartScene(
          archive,
          layoutPath ?? "",
          layout,
          `${id}-layout-${index + 1}`,
          `Slide ${index + 1} layout`,
          theme,
          budget,
          width,
          height,
        ),
        layout,
      );
      scenes.push(scene);
      coverage.push(drawingCoverage(layoutPath ?? "ppt/slideLayouts", scene));
    }
    const slideScene = await presentationPartScene(
      archive,
      path,
      slide,
      `${id}-slide-${index + 1}`,
      `Slide ${index + 1}`,
      theme,
      budget,
      width,
      height,
    );
    scenes.push(slideScene);
    coverage.push(drawingCoverage(path, slideScene));
    const background =
      presentationBackground(slide, theme) ??
      (layout === undefined ? undefined : presentationBackground(layout, theme)) ??
      (master === undefined ? undefined : presentationBackground(master, theme)) ??
      "#FFFFFF";
    pages.push({
      id: `${id}-page-${index + 1}`,
      width,
      height,
      text: "",
      drawing: mergeScenes(
        `${id}-drawing-${index + 1}`,
        `Slide ${index + 1}`,
        width,
        height,
        background,
        scenes,
      ),
    });
  }
  return {
    schemaVersion: 1,
    id,
    kind: "paged",
    title,
    pages,
    coverage: { entries: coverage },
  };
}

interface WordPageMetrics {
  readonly width: number;
  readonly height: number;
  readonly marginTop: number;
  readonly marginRight: number;
  readonly marginBottom: number;
  readonly marginLeft: number;
}

/**
 * Reads the saved Word section page size and margins.
 *
 * @param document - Parsed WordprocessingML document.
 * @returns CSS-pixel page metrics.
 */
function wordPageMetrics(document: XMLDocument): WordPageMetrics {
  const sections = elements(document, "sectPr");
  const section = sections.at(-1);
  const size = section === undefined ? undefined : directChild(section, "pgSz");
  const margins = section === undefined ? undefined : directChild(section, "pgMar");
  return {
    width: Math.max(
      1,
      officePixels(attribute(size ?? document.documentElement, "w"), twipsPerPixel, 816),
    ),
    height: Math.max(
      1,
      officePixels(attribute(size ?? document.documentElement, "h"), twipsPerPixel, 1056),
    ),
    marginTop: Math.max(
      0,
      officePixels(attribute(margins ?? document.documentElement, "top"), twipsPerPixel, 96),
    ),
    marginRight: Math.max(
      0,
      officePixels(attribute(margins ?? document.documentElement, "right"), twipsPerPixel, 96),
    ),
    marginBottom: Math.max(
      0,
      officePixels(attribute(margins ?? document.documentElement, "bottom"), twipsPerPixel, 96),
    ),
    marginLeft: Math.max(
      0,
      officePixels(attribute(margins ?? document.documentElement, "left"), twipsPerPixel, 96),
    ),
  };
}

/**
 * Extracts paragraph text without duplicating text stored inside drawings.
 *
 * @param element - Paragraph or descendant element.
 * @returns Visible main-document text.
 */
function wordText(element: XmlElement): string {
  if (["drawing", "pict", "object", "txbx", "txbxContent"].includes(element.localName)) {
    return "";
  }
  if (element.localName === "t" || element.localName === "tab") {
    return element.localName === "tab" ? "\t" : element.textContent;
  }
  return element.children.map((child) => wordText(child)).join("");
}

/**
 * Traverses Word markup while selecting only one Markup Compatibility branch.
 *
 * @param root - Word document or paragraph root.
 * @param localNames - Requested visible element names.
 * @returns Selected elements in document order.
 */
function selectedWordElements(root: XmlElement, localNames: ReadonlySet<string>): XmlElement[] {
  const result: XmlElement[] = [];
  const visit = (element: XmlElement): void => {
    if (element.localName === "AlternateContent") {
      const choice = element.children.find(
        (child) =>
          child.localName === "Choice" &&
          allElements(child).some((descendant) => descendant.localName === "drawing"),
      );
      const fallback = element.children.find((child) => child.localName === "Fallback");
      const selected = choice ?? fallback;
      if (selected !== undefined) visit(selected);
      return;
    }
    if (localNames.has(element.localName)) result.push(element);
    for (const child of element.children) visit(child);
  };
  visit(root);
  return result;
}

/**
 * Reads one Word paragraph as a drawing text style.
 *
 * @param paragraph - WordprocessingML paragraph.
 * @returns Normalized drawing text style.
 */
function wordTextStyle(paragraph: XmlElement): NonNullable<DrawingShape["textStyle"]> {
  const properties = first(paragraph, "rPr");
  const fonts = first(properties ?? paragraph, "rFonts");
  const size = first(properties ?? paragraph, "sz");
  const color = first(properties ?? paragraph, "color");
  const paragraphProperties = directChild(paragraph, "pPr");
  const justification = first(paragraphProperties ?? paragraph, "jc");
  const alignment = attribute(justification ?? paragraph, "val");
  const family =
    attribute(fonts ?? paragraph, "eastAsia") ??
    attribute(fonts ?? paragraph, "ascii") ??
    attribute(fonts ?? paragraph, "hAnsi") ??
    "Arial, sans-serif";
  const rawColor = attribute(color ?? paragraph, "val");
  return {
    align: alignment === "center" ? "center" : alignment === "right" ? "end" : "start",
    bold: first(properties ?? paragraph, "b") !== undefined,
    color: rawColor !== undefined && /^[\dA-F]{6}$/iu.test(rawColor) ? `#${rawColor}` : "#000000",
    fontFamily: family,
    fontSize: Math.max(8, (Number(attribute(size ?? paragraph, "val") ?? 22) / 2) * (4 / 3)),
    italic: first(properties ?? paragraph, "i") !== undefined,
    underline: first(properties ?? paragraph, "u") !== undefined,
    verticalAlign: "top",
  };
}

/**
 * Estimates stable Word paragraph height while retaining source page geometry.
 *
 * @param text - Paragraph text.
 * @param width - Available text width.
 * @param fontSize - Resolved font size in CSS pixels.
 * @returns Positive paragraph height.
 */
function wordParagraphHeight(text: string, width: number, fontSize: number): number {
  if (text === "") return 0;
  const capacity = Math.max(1, Math.floor(width / Math.max(1, fontSize * 0.65)));
  const lines = text
    .split("\n")
    .reduce((total, line) => total + Math.max(1, Math.ceil(line.length / capacity)), 0);
  return Math.max(fontSize * 1.2, lines * fontSize * 1.2);
}

/**
 * Resolves one Word anchor axis against page, margin, or paragraph coordinates.
 *
 * @param anchor - Word drawing anchor.
 * @param localName - positionH or positionV.
 * @param metrics - Current page metrics.
 * @param cursor - Current paragraph top position.
 * @param extent - Drawing extent on this axis.
 * @returns Absolute page coordinate in CSS pixels.
 */
function wordAnchorAxis(
  anchor: XmlElement,
  localName: "positionH" | "positionV",
  metrics: WordPageMetrics,
  cursor: number,
  extent: number,
): number {
  const position = directChild(anchor, localName);
  if (position === undefined) return localName === "positionH" ? metrics.marginLeft : cursor;
  const horizontal = localName === "positionH";
  const relative = attribute(position, "relativeFrom");
  const start = horizontal
    ? relative === "page"
      ? 0
      : metrics.marginLeft
    : relative === "page"
      ? 0
      : relative === "paragraph" || relative === "line"
        ? cursor
        : metrics.marginTop;
  const span = horizontal
    ? relative === "page"
      ? metrics.width
      : metrics.width - metrics.marginLeft - metrics.marginRight
    : relative === "page"
      ? metrics.height
      : metrics.height - metrics.marginTop - metrics.marginBottom;
  const offset = directChild(position, "posOffset");
  if (offset !== undefined) return start + officePixels(offset.textContent, emuPerPixel);
  const align = directChild(position, "align")?.textContent;
  if (align === "center") return start + (span - extent) / 2;
  if (align === "right" || align === "bottom" || align === "outside") {
    return start + span - extent;
  }
  return start;
}

/**
 * Resolves one Word inline or floating DrawingML placement.
 *
 * @param wrapper - wp:inline or wp:anchor element.
 * @param metrics - Current page metrics.
 * @param cursor - Current paragraph top position.
 * @returns Absolute page placement.
 */
function wordDrawingPlacement(
  wrapper: XmlElement,
  metrics: WordPageMetrics,
  cursor: number,
): { readonly x: number; readonly y: number; readonly width: number; readonly height: number } {
  const extent = directChild(wrapper, "extent");
  const width = Math.max(1, officePixels(attribute(extent ?? wrapper, "cx"), emuPerPixel, 1));
  const height = Math.max(1, officePixels(attribute(extent ?? wrapper, "cy"), emuPerPixel, 1));
  if (wrapper.localName === "inline") {
    return { x: metrics.marginLeft, y: cursor, width, height };
  }
  const simple = directChild(wrapper, "simplePos");
  if (attribute(wrapper, "simplePos") === "1" && simple !== undefined) {
    return {
      x: officePixels(attribute(simple, "x"), emuPerPixel),
      y: officePixels(attribute(simple, "y"), emuPerPixel),
      width,
      height,
    };
  }
  return {
    x: wordAnchorAxis(wrapper, "positionH", metrics, cursor, width),
    y: wordAnchorAxis(wrapper, "positionV", metrics, cursor, height),
    width,
    height,
  };
}

/**
 * Parses WordprocessingML into fixed pages with DrawingML anchored on the page.
 *
 * @param archive - Open OOXML package container.
 * @param bytes - Complete word-processing source bytes.
 * @param title - Safe display title.
 * @param budget - Resource limits applied to the package.
 * @returns Fixed-layout Word document with explicit coverage.
 */
async function parseWord(
  archive: ZipArchive,
  bytes: Uint8Array,
  title: string,
  budget: ResourceBudget,
): Promise<PagedDocument> {
  const documentPath = "word/document.xml";
  const source = await archive.text(documentPath);
  const document = parseXml(source, budget.maxXmlNodes, budget.maxXmlDepth);
  const id = stableDocumentId(title, bytes);
  const metrics = wordPageMetrics(document);
  const theme = await packageTheme(
    archive,
    "word/theme/theme1.xml",
    budget.maxXmlNodes,
    budget.maxXmlDepth,
  );
  const images = await drawingImages(archive, documentPath, budget);
  const diagrams = await drawingDiagrams(archive, documentPath, document, theme, budget);
  const coverage: OfficeCoverageEntry[] = [];
  const pageBehindScenes: DrawingScene[][] = [[]];
  const pageForegroundScenes: DrawingScene[][] = [[]];
  const pageText: DrawingShape[][] = [[]];
  let pageIndex = 0;
  let cursor = metrics.marginTop;
  let paragraphIndex = 0;
  let drawingIndex = 0;
  const body = first(document, "body") ?? document.documentElement;
  const newPage = (): void => {
    pageIndex += 1;
    pageBehindScenes.push([]);
    pageForegroundScenes.push([]);
    pageText.push([]);
    cursor = metrics.marginTop;
  };
  for (const block of body.children) {
    if (block.localName === "sectPr") continue;
    if (block.localName === "tbl") {
      coverage.push({
        feature: "word-table",
        part: documentPath,
        discovered: 1,
        modeled: 0,
        renderable: 0,
        skipped: 1,
      });
      continue;
    }
    if (block.localName !== "p") continue;
    paragraphIndex += 1;
    const explicitBreak = allElements(block).some(
      (element) => element.localName === "br" && attribute(element, "type") === "page",
    );
    if (explicitBreak && cursor > metrics.marginTop) newPage();
    const text = wordText(block);
    const style = wordTextStyle(block);
    const textWidth = Math.max(1, metrics.width - metrics.marginLeft - metrics.marginRight);
    const paragraphHeight = wordParagraphHeight(text, textWidth, style.fontSize);
    if (
      paragraphHeight > 0 &&
      cursor + paragraphHeight > metrics.height - metrics.marginBottom &&
      cursor > metrics.marginTop
    ) {
      newPage();
    }
    if (text !== "") {
      pageText[pageIndex]?.push({
        id: `${id}-paragraph-${paragraphIndex}`,
        kind: "text",
        x: metrics.marginLeft,
        y: cursor,
        width: textWidth,
        height: Math.max(style.fontSize * 1.2, paragraphHeight),
        text,
        fill: "none",
        stroke: "none",
        textStyle: style,
      });
    }
    const wrappers = selectedWordElements(block, new Set(["anchor", "inline"]));
    let inlineHeight = 0;
    for (const wrapper of wrappers) {
      drawingIndex += 1;
      const placement = wordDrawingPlacement(wrapper, metrics, cursor);
      const scene = parseOfficeDrawing(
        { documentElement: wrapper },
        {
          id: `${id}-word-drawing-${drawingIndex}`,
          title: `Word drawing ${drawingIndex}`,
          theme,
          images,
          diagrams,
          hostPlacement: placement,
          useHostPlacementForConnectors: true,
        },
      );
      const target =
        attribute(wrapper, "behindDoc") === "1"
          ? pageBehindScenes[pageIndex]
          : pageForegroundScenes[pageIndex];
      target?.push(scene);
      coverage.push(drawingCoverage(documentPath, scene));
      const wrap = wrapper.children.find((element) => element.localName.startsWith("wrap"));
      if (wrap !== undefined && wrap.localName !== "wrapNone") {
        coverage.push({
          feature: "word-text-wrap",
          part: documentPath,
          discovered: 1,
          modeled: 0,
          renderable: 0,
          skipped: 1,
        });
      }
      if (wrapper.localName === "inline") inlineHeight = Math.max(inlineHeight, placement.height);
    }
    coverage.push({
      feature: "word-paragraph",
      part: documentPath,
      discovered: 1,
      modeled: 1,
      renderable: 1,
      skipped: 0,
    });
    const paragraphProperties = directChild(block, "pPr");
    const unsupportedParagraphProperty = paragraphProperties?.children.some(
      (element) => !["jc"].includes(element.localName),
    );
    const textRuns = allElements(block).filter(
      (element) => element.localName === "r" && wordText(element) !== "",
    );
    const unsupportedInlineContent = allElements(block).some((element) => {
      if (element.localName === "br") return attribute(element, "type") !== "page";
      return [
        "cr",
        "fldChar",
        "footnoteReference",
        "endnoteReference",
        "instrText",
        "noBreakHyphen",
        "softHyphen",
        "sym",
        "tab",
      ].includes(element.localName);
    });
    const exactParagraphLayout =
      unsupportedParagraphProperty !== true &&
      unsupportedInlineContent !== true &&
      textRuns.length <= 1;
    coverage.push({
      feature: "word-paragraph-layout",
      part: documentPath,
      discovered: 1,
      modeled: exactParagraphLayout ? 1 : 0,
      renderable: exactParagraphLayout ? 1 : 0,
      skipped: exactParagraphLayout ? 0 : 1,
    });
    cursor += Math.max(paragraphHeight, inlineHeight, style.fontSize * 0.35);
  }
  const vmlCandidates = selectedWordElements(
    document.documentElement,
    new Set(["arc", "curve", "line", "oval", "polyline", "rect", "roundrect", "shape"]),
  );
  if (vmlCandidates.length > 0) {
    const scene = parseVmlElements(
      vmlCandidates,
      `${id}-word-vml`,
      "Word VML drawing",
      undefined,
      undefined,
    );
    pageForegroundScenes[0]?.push(scene);
    coverage.push(drawingCoverage(documentPath, scene));
    if (pageIndex > 0) {
      coverage.push({
        feature: "word-vml-pagination",
        part: documentPath,
        discovered: vmlCandidates.length,
        modeled: 0,
        renderable: 0,
        skipped: vmlCandidates.length,
      });
    }
  }
  const sections = elements(document, "sectPr");
  const activeSection = sections.at(-1);
  const pageSize = activeSection === undefined ? undefined : directChild(activeSection, "pgSz");
  const pageMargins = activeSection === undefined ? undefined : directChild(activeSection, "pgMar");
  coverage.push({
    feature: "word-section",
    part: documentPath,
    discovered: Math.max(1, sections.length),
    modeled: sections.length === 0 ? 0 : 1,
    renderable: sections.length === 0 ? 0 : 1,
    skipped: sections.length === 0 ? 1 : Math.max(0, sections.length - 1),
  });
  coverage.push({
    feature: "word-page-geometry",
    part: documentPath,
    discovered: 2,
    modeled: Number(pageSize !== undefined) + Number(pageMargins !== undefined),
    renderable: Number(pageSize !== undefined) + Number(pageMargins !== undefined),
    skipped: Number(pageSize === undefined) + Number(pageMargins === undefined),
  });
  const related = await relationships(
    archive,
    documentPath,
    budget.maxXmlNodes,
    budget.maxXmlDepth,
  );
  const unmodeledHeaders = [...related.values()].filter((path) =>
    /word\/(?:header|footer)\d+\.xml$/u.test(path),
  );
  if (unmodeledHeaders.length > 0) {
    coverage.push({
      feature: "word-header-footer",
      part: documentPath,
      discovered: unmodeledHeaders.length,
      modeled: 0,
      renderable: 0,
      skipped: unmodeledHeaders.length,
    });
  }
  const unmodeledRelatedParts = [...related.values()].filter((path) =>
    /word\/(?:comments|endnotes|footnotes|numbering|settings|styles)\.xml$/u.test(path),
  );
  if (unmodeledRelatedParts.length > 0) {
    coverage.push({
      feature: "word-related-part",
      part: documentPath,
      discovered: unmodeledRelatedParts.length,
      modeled: 0,
      renderable: 0,
      skipped: unmodeledRelatedParts.length,
    });
  }
  const pages = pageForegroundScenes.map((foregroundScenes, index) => {
    const textScene: DrawingScene = {
      schemaVersion: 1,
      id: `${id}-word-text-${index + 1}`,
      kind: "drawing",
      title: `Page ${index + 1} text`,
      width: metrics.width,
      height: metrics.height,
      shapes: pageText[index] ?? [],
      edges: [],
      graph: { nodes: [], edges: [], warnings: [] },
      features: {
        shapeCount: pageText[index]?.length ?? 0,
        connectorCount: 0,
        groupCount: 0,
        pictureCount: 0,
        customGeometryCount: 0,
        smartArtCount: 0,
        unsupportedCount: 0,
      },
    };
    return {
      id: `${id}-page-${index + 1}`,
      width: metrics.width,
      height: metrics.height,
      text: "",
      drawing: mergeScenes(
        `${id}-word-page-${index + 1}`,
        `Page ${index + 1}`,
        metrics.width,
        metrics.height,
        "#FFFFFF",
        [...(pageBehindScenes[index] ?? []), textScene, ...foregroundScenes],
      ),
    };
  });
  return {
    schemaVersion: 1,
    id,
    kind: "paged",
    title,
    pages,
    coverage: { entries: coverage },
  };
}

/**
 * Applies the Office coverage ledger to the public parse result.
 *
 * @param model - Parsed fixed-layout Office document.
 * @param warnings - Package-level warnings.
 * @returns Complete or partial result without silent feature loss.
 */
function officeParseOutcome(
  model: PagedDocument,
  warnings: readonly ViewerWarning[],
): ParseOutcome<PagedDocument> {
  const incomplete = model.coverage?.entries.filter((entry) => entry.skipped > 0) ?? [];
  if (incomplete.length === 0) return { status: "complete", model, warnings };
  const counts = new Map<string, number>();
  for (const entry of incomplete) {
    counts.set(entry.feature, (counts.get(entry.feature) ?? 0) + entry.skipped);
  }
  const skipped: SkippedFeature[] = [...counts].map(([feature, count]) => ({
    code: `OFFICE_${feature.replaceAll(/[^A-Z\d]+/giu, "_").toUpperCase()}_SKIPPED`,
    count,
  }));
  return {
    status: "partial",
    model,
    warnings: [
      ...warnings,
      { code: "OFFICE_CONTENT_SKIPPED", messageKey: "office.contentSkipped" },
    ],
    skipped,
  };
}

/**
 * Reports whether an OOXML package contains an embedded VBA project.
 *
 * @param archive - Open OOXML package container.
 * @returns True when the package contains a macro project that will remain inert.
 */
function containsMacroProject(archive: ZipArchive): boolean {
  return archive.entries.some((entry) => /(?:^|\/)vbaProject\.bin$/iu.test(entry.path));
}

/**
 * Creates one format-owned OOXML driver over the shared package decoder.
 *
 * @param id - Canonical format identifier exposed by the driver.
 * @param kind - OOXML document model selected for the format.
 * @returns Driver that parses only the selected OOXML model.
 */
export function createOoxmlDriver(
  id: string,
  kind: OoxmlDocumentKind,
): ViewerDriver<ViewerDocument> {
  return {
    id,
    /**
     * Opens a supported OOXML package through its dedicated local model parser.
     *
     * @param context - Bounded driver context for the selected OOXML source.
     * @returns Complete OOXML document model.
     */
    async open(context) {
      try {
        context.reportProgress({ stage: "parsing", indeterminate: true });
        const bytes = await context.resource.readAll(context.signal);
        const title = documentTitle(context.resource.name);
        const archive = new ZipArchive(bytes, context.budget);
        const warnings = containsMacroProject(archive)
          ? [{ code: "OFFICE_MACRO_IGNORED", messageKey: "office.macroIgnored" }]
          : [];
        if (kind === "spreadsheet") {
          const model = await parseSpreadsheet(
            archive,
            bytes,
            title,
            context.budget,
            context.signal,
          );
          return spreadsheetParseOutcome(model, warnings);
        }
        const model: ViewerDocument =
          kind === "presentation"
            ? await parsePresentation(archive, bytes, title, context.budget)
            : await parseWord(archive, bytes, title, context.budget);
        if (model.kind !== "paged") {
          throw new ViewerError("PARSE_FAILED", "parse");
        }
        return officeParseOutcome(model, warnings);
      } catch (value) {
        return { status: "rejected", error: sanitizeViewerError(value, "parse") };
      }
    },
  };
}

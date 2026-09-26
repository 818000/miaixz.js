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
  elementsByLocalName as elements,
  firstElementByLocalName as first,
  localAttribute as attribute,
  parseXmlDocument as parseXml,
  textFromElements as textContent,
} from "../xml/xml-codec.js";
import type {
  DrawingScene,
  FlowDocument,
  PagedDocument,
  SpreadsheetCell,
  SpreadsheetDocument,
  SpreadsheetSheet,
  ViewerDocument,
} from "../../shared/contracts/document.js";
import type { ViewerDriver } from "../../shared/contracts/driver.js";
import { documentTitle, stableDocumentId } from "../../shared/document/document-identity.js";
import { ViewerError } from "../../shared/errors/viewer-error.js";
import { parseOfficeDrawing, type OfficeDrawingImage } from "./drawing-codec.js";
import { defaultOfficeTheme, parseOfficeTheme, type OfficeTheme } from "./theme-codec.js";
import { parseVmlDrawing } from "./vml-codec.js";

/**
 * Identifies the three OOXML document models implemented by the shared decoder.
 */
export type OoxmlDocumentKind = "document" | "presentation" | "spreadsheet";

/**
 * Resolves an OPC relationship target against its owning package part.
 *
 * @param basePart - Normalized path of the relationship owner.
 * @param target - Relative target stored in the relationship record.
 * @returns Normalized package path of the resolved target.
 */
function normalizePartPath(basePart: string, target: string): string {
  const base = basePart.split("/");
  base.pop();
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
 * @returns Relationship identifier map containing only internal targets.
 */
async function relationships(
  archive: ZipArchive,
  part: string,
  maxNodes: number,
): Promise<Map<string, string>> {
  const segments = part.split("/");
  const filename = segments.pop();
  const relationshipPath = `${segments.join("/")}/_rels/${filename}.rels`;
  if (!archive.entries.some((entry) => entry.path === relationshipPath)) return new Map();
  const document = parseXml(await archive.text(relationshipPath), maxNodes);
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
 * Loads image relationships owned by one drawing part.
 *
 * @param archive - Open OOXML package.
 * @param drawingPart - Normalized drawing-part path.
 * @param maxNodes - Maximum XML nodes accepted in its relationship part.
 * @returns Relationship identifier map containing inert data URLs.
 */
async function drawingImages(
  archive: ZipArchive,
  drawingPart: string,
  maxNodes: number,
): Promise<Map<string, OfficeDrawingImage>> {
  const related = await relationships(archive, drawingPart, maxNodes);
  const images = new Map<string, OfficeDrawingImage>();
  for (const [id, path] of related) {
    if (
      !archive.entries.some((entry) => entry.path === path) ||
      !/\.(?:emf|gif|jpe?g|png|svg|wmf)$/iu.test(path)
    )
      continue;
    const mimeType = imageMimeType(path);
    images.set(id, {
      mimeType,
      source: `data:${mimeType};base64,${base64(await archive.read(path))}`,
    });
  }
  return images;
}

/**
 * Loads one package theme or returns deterministic Office-compatible defaults.
 *
 * @param archive - Open OOXML package.
 * @param path - Normalized package path of the requested theme.
 * @param maxNodes - Maximum XML nodes accepted in the theme part.
 * @returns Parsed Office theme.
 */
async function packageTheme(
  archive: ZipArchive,
  path: string,
  maxNodes: number,
): Promise<OfficeTheme> {
  if (!archive.entries.some((entry) => entry.path === path)) return defaultOfficeTheme();
  return parseOfficeTheme(parseXml(await archive.text(path), maxNodes));
}

/**
 * Resolves materialized SmartArt drawings referenced by one DrawingML part.
 *
 * @param archive - Open OOXML package.
 * @param drawingPart - Normalized owner drawing path.
 * @param drawingDocument - Parsed owner drawing document.
 * @param theme - Active Office theme.
 * @param maxNodes - Maximum XML nodes accepted per related part.
 * @returns Data-model relationship identifiers mapped to materialized scenes.
 */
async function drawingDiagrams(
  archive: ZipArchive,
  drawingPart: string,
  drawingDocument: XMLDocument,
  theme: OfficeTheme,
  maxNodes: number,
): Promise<Map<string, DrawingScene>> {
  const ownerRelationships = await relationships(archive, drawingPart, maxNodes);
  const diagrams = new Map<string, DrawingScene>();
  for (const relationIds of elements(drawingDocument, "relIds")) {
    const dataId = attribute(relationIds, "dm");
    const dataPart = dataId === undefined ? undefined : ownerRelationships.get(dataId);
    if (dataId === undefined || dataPart === undefined) continue;
    const dataRelationships = await relationships(archive, dataPart, maxNodes);
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
      parseOfficeDrawing(parseXml(await archive.text(materializedPart), maxNodes), {
        id: `${drawingPart}-${dataId}-smartart`,
        title: "SmartArt",
        theme,
        images: await drawingImages(archive, materializedPart, maxNodes),
      }),
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
 * @param maxNodes - Maximum number of XML nodes accepted per package part.
 * @returns Format-neutral spreadsheet document with attached drawings.
 */
async function parseSpreadsheet(
  archive: ZipArchive,
  bytes: Uint8Array,
  title: string,
  maxNodes: number,
): Promise<SpreadsheetDocument> {
  const documentId = stableDocumentId(title, bytes);
  const sharedStrings = archive.entries.some((entry) => entry.path === "xl/sharedStrings.xml")
    ? elements(parseXml(await archive.text("xl/sharedStrings.xml"), maxNodes), "si").map(
        (element) => textContent(element),
      )
    : [];
  const workbook = parseXml(await archive.text("xl/workbook.xml"), maxNodes);
  const workbookRels = await relationships(archive, "xl/workbook.xml", maxNodes);
  const theme = await packageTheme(archive, "xl/theme/theme1.xml", maxNodes);
  const sheets: SpreadsheetSheet[] = [];
  const drawings: DrawingScene[] = [];
  for (const [sheetIndex, sheet] of elements(workbook, "sheet").entries()) {
    const relationId = attribute(sheet, "id");
    const part = relationId === undefined ? undefined : workbookRels.get(relationId);
    if (part === undefined || !archive.entries.some((entry) => entry.path === part)) continue;
    const sheetDocument = parseXml(await archive.text(part), maxNodes);
    const cells: SpreadsheetCell[] = elements(sheetDocument, "c").map((cell) => {
      const address = attribute(cell, "r") ?? `cell-${sheetIndex + 1}`;
      const type = attribute(cell, "t");
      const rawValue = first(cell, "v")?.textContent ?? "";
      const inline = first(cell, "is");
      let value: SpreadsheetCell["value"];
      if (type === "s") value = sharedStrings[Number(rawValue)] ?? "";
      else if (type === "inlineStr" && inline !== undefined) value = textContent(inline);
      else if (type === "b") value = rawValue === "1";
      else if (rawValue === "") value = null;
      else value = Number.isFinite(Number(rawValue)) ? Number(rawValue) : rawValue;
      const formula = first(cell, "f")?.textContent ?? undefined;
      return { address, value, ...(formula === undefined ? {} : { formula }) };
    });
    const sheetId = `sheet-${sheetIndex + 1}`;
    const sheetName = attribute(sheet, "name") ?? `Sheet ${sheetIndex + 1}`;
    sheets.push({ id: sheetId, name: sheetName, cells });
    const sheetRels = await relationships(archive, part, maxNodes);
    for (const drawingReference of elements(sheetDocument, "drawing")) {
      const id = attribute(drawingReference, "id");
      const drawingPart = id === undefined ? undefined : sheetRels.get(id);
      if (drawingPart === undefined || !archive.entries.some((entry) => entry.path === drawingPart))
        continue;
      const drawingDocument = parseXml(await archive.text(drawingPart), maxNodes);
      drawings.push(
        parseOfficeDrawing(drawingDocument, {
          id: `${documentId}-drawing-${drawings.length + 1}`,
          title: `${sheetName} drawing`,
          sheetId,
          sheetName,
          theme,
          images: await drawingImages(archive, drawingPart, maxNodes),
          diagrams: await drawingDiagrams(archive, drawingPart, drawingDocument, theme, maxNodes),
        }),
      );
    }
    for (const legacyReference of elements(sheetDocument, "legacyDrawing")) {
      const relationId = attribute(legacyReference, "id");
      const legacyPart = relationId === undefined ? undefined : sheetRels.get(relationId);
      if (legacyPart === undefined || !archive.entries.some((entry) => entry.path === legacyPart)) {
        continue;
      }
      drawings.push(
        parseVmlDrawing(
          await archive.text(legacyPart),
          `${documentId}-drawing-${drawings.length + 1}`,
          `${sheetName} legacy drawing`,
          maxNodes,
          sheetId,
          sheetName,
        ),
      );
    }
  }
  return { schemaVersion: 1, id: documentId, kind: "spreadsheet", title, sheets, drawings };
}

/**
 * Parses presentation slides into paged text and drawing models.
 *
 * @param archive - Open OOXML package container.
 * @param bytes - Complete presentation source bytes used for stable identity.
 * @param title - Safe display title for the presentation.
 * @param maxNodes - Maximum number of XML nodes accepted per package part.
 * @returns Format-neutral paged presentation document.
 */
async function parsePresentation(
  archive: ZipArchive,
  bytes: Uint8Array,
  title: string,
  maxNodes: number,
): Promise<PagedDocument> {
  const id = stableDocumentId(title, bytes);
  const theme = await packageTheme(archive, "ppt/theme/theme1.xml", maxNodes);
  const slidePaths = archive.entries
    .map((entry) => entry.path)
    .filter((path) => /^ppt\/slides\/slide\d+\.xml$/u.test(path))
    .sort((a, b) => Number(a.match(/\d+/u)?.[0]) - Number(b.match(/\d+/u)?.[0]));
  const pages = [];
  for (const [index, path] of slidePaths.entries()) {
    const document = parseXml(await archive.text(path), maxNodes);
    const drawing = parseOfficeDrawing(document, {
      id: `${id}-drawing-${index + 1}`,
      title: `Slide ${index + 1}`,
      theme,
      images: await drawingImages(archive, path, maxNodes),
      diagrams: await drawingDiagrams(archive, path, document, theme, maxNodes),
    });
    pages.push({
      id: `${id}-page-${index + 1}`,
      width: Math.max(1, drawing.width),
      height: Math.max(1, drawing.height),
      text: textContent(document),
      drawing,
    });
  }
  return { schemaVersion: 1, id, kind: "paged", title, pages };
}

/**
 * Parses WordprocessingML paragraphs into a flow document.
 *
 * @param archive - Open OOXML package container.
 * @param bytes - Complete word-processing source bytes used for stable identity.
 * @param title - Safe display title for the document.
 * @param maxNodes - Maximum number of XML nodes accepted for the document part.
 * @returns Format-neutral flow document containing parsed paragraphs.
 */
async function parseWord(
  archive: ZipArchive,
  bytes: Uint8Array,
  title: string,
  maxNodes: number,
): Promise<FlowDocument> {
  const document = parseXml(await archive.text("word/document.xml"), maxNodes);
  const id = stableDocumentId(title, bytes);
  const sections = elements(document, "p").map((paragraph, index) => ({
    id: `${id}-paragraph-${index + 1}`,
    text: textContent(paragraph),
  }));
  return { schemaVersion: 1, id, kind: "flow", title, sections };
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
      const bytes = await context.resource.readAll(context.signal);
      const title = documentTitle(context.resource.name);
      const archive = new ZipArchive(bytes, context.budget);
      let model: ViewerDocument;
      if (kind === "spreadsheet") {
        model = await parseSpreadsheet(archive, bytes, title, context.budget.maxXmlNodes);
      } else if (kind === "presentation") {
        model = await parsePresentation(archive, bytes, title, context.budget.maxXmlNodes);
      } else {
        model = await parseWord(archive, bytes, title, context.budget.maxXmlNodes);
      }
      const warnings = containsMacroProject(archive)
        ? [{ code: "OFFICE_MACRO_IGNORED", messageKey: "office.macroIgnored" }]
        : [];
      return { status: "complete", model, warnings };
    },
  };
}

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
  DiagramEdge,
  DiagramNode,
  DiagramWarning,
  DrawingScene,
  DrawingShape,
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

/**
 * Identifies the three OOXML document models implemented by the shared decoder.
 */
export type OoxmlDocumentKind = "document" | "presentation" | "spreadsheet";

/**
 * Reads a finite numeric XML attribute with a zero fallback.
 *
 * @param element - Optional element containing the requested attribute.
 * @param name - Namespace-independent attribute name.
 * @returns Finite numeric attribute value or zero.
 */
function numericAttribute(element: Element | undefined, name: string): number {
  const value = Number(element === undefined ? undefined : attribute(element, name));
  return Number.isFinite(value) ? value : 0;
}

/**
 * Finds a direct child by namespace-independent local name.
 *
 * @param element - Parent element whose direct children are inspected.
 * @param localName - Namespace-independent child name.
 * @returns First matching direct child, or undefined when absent.
 */
function child(element: Element, localName: string): Element | undefined {
  return [...element.children].find((item) => item.localName === localName);
}

/**
 * Collects descendants by namespace-independent local name.
 *
 * @param root - Parent node whose descendants are searched.
 * @param localName - Namespace-independent element name.
 * @returns Matching descendants in document order.
 */
function descendants(root: ParentNode, localName: string): Element[] {
  return elements(root, localName);
}

interface AnchorBox {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Converts an Excel drawing marker into approximate pixel coordinates.
 *
 * @param marker - Optional DrawingML row and column marker.
 * @returns Horizontal and vertical position in CSS pixels.
 */
function markerPosition(marker: Element | undefined): { readonly x: number; readonly y: number } {
  if (marker === undefined) return { x: 0, y: 0 };
  const column = Number(first(marker, "col")?.textContent ?? 0);
  const row = Number(first(marker, "row")?.textContent ?? 0);
  const columnOffset = Number(first(marker, "colOff")?.textContent ?? 0) / 9525;
  const rowOffset = Number(first(marker, "rowOff")?.textContent ?? 0) / 9525;
  return { x: column * 96 + columnOffset, y: row * 24 + rowOffset };
}

/**
 * Resolves two-cell, one-cell, or absolute DrawingML anchor geometry.
 *
 * @param anchor - DrawingML anchor element containing position and extent data.
 * @returns Normalized positive drawing bounds in CSS pixels.
 */
function anchorBox(anchor: Element): AnchorBox {
  const from = child(anchor, "from");
  const to = child(anchor, "to");
  if (from !== undefined && to !== undefined) {
    const start = markerPosition(from);
    const end = markerPosition(to);
    return {
      x: start.x,
      y: start.y,
      width: Math.max(1, end.x - start.x),
      height: Math.max(1, end.y - start.y),
    };
  }
  const position = first(anchor, "pos");
  const extent = first(anchor, "ext");
  return {
    x: numericAttribute(position, "x") / 9525,
    y: numericAttribute(position, "y") / 9525,
    width: Math.max(1, numericAttribute(extent, "cx") / 9525),
    height: Math.max(1, numericAttribute(extent, "cy") / 9525),
  };
}

/**
 * Maps DrawingML preset geometry to a format-neutral shape kind.
 *
 * @param shape - DrawingML shape or connector element.
 * @returns Supported format-neutral shape kind.
 */
function shapeKind(shape: Element): DrawingShape["kind"] {
  const preset = attribute(first(shape, "prstGeom") ?? shape, "prst") ?? "rect";
  if (/ellipse|arc|pie|wedge/iu.test(preset)) return "ellipse";
  if (/line|connector/iu.test(preset) || shape.localName === "cxnSp") return "line";
  return "rectangle";
}

/**
 * Converts a zero-based spreadsheet column index to its A1 column name.
 *
 * @param index - Zero-based spreadsheet column index.
 * @returns Uppercase A1-style column name.
 */
function columnName(index: number): string {
  let value = Math.max(0, index) + 1;
  let result = "";
  while (value > 0) {
    value -= 1;
    result = String.fromCharCode(65 + (value % 26)) + result;
    value = Math.floor(value / 26);
  }
  return result;
}

/**
 * Converts a DrawingML marker to one A1 cell address.
 *
 * @param marker - Optional DrawingML row and column marker.
 * @returns A1 cell address, or undefined for invalid marker coordinates.
 */
function markerCell(marker: Element | undefined): string | undefined {
  if (marker === undefined) return undefined;
  const column = Number(first(marker, "col")?.textContent);
  const row = Number(first(marker, "row")?.textContent);
  if (!Number.isInteger(column) || !Number.isInteger(row) || column < 0 || row < 0)
    return undefined;
  return `${columnName(column)}${row + 1}`;
}

/**
 * Derives the source-cell range covered by a drawing anchor.
 *
 * @param anchor - DrawingML anchor containing from and optional to markers.
 * @returns Single A1 address, A1 range, or undefined when no start marker exists.
 */
function anchorCellRange(anchor: Element): string | undefined {
  const from = markerCell(child(anchor, "from"));
  const to = markerCell(child(anchor, "to"));
  if (from === undefined) return undefined;
  return to === undefined || to === from ? from : `${from}:${to}`;
}

/**
 * Infers a semantic flowchart role from shape text and preset geometry.
 *
 * @param label - Human-readable shape label.
 * @param preset - DrawingML preset geometry identifier.
 * @returns Inferred semantic role and confidence score.
 */
function diagramRole(
  label: string,
  preset: string,
): { readonly role: DiagramNode["role"]; readonly confidence: number } {
  const normalized = label.trim().toLowerCase();
  if (/^(start|begin|开始|起点)$/u.test(normalized)) return { role: "start", confidence: 0.95 };
  if (/^(end|finish|结束|终点)$/u.test(normalized)) return { role: "end", confidence: 0.95 };
  if (/diamond|decision/iu.test(preset)) return { role: "decision", confidence: 0.8 };
  if (/document/iu.test(preset)) return { role: "document", confidence: 0.75 };
  if (/parallelogram|input/iu.test(preset)) return { role: "input", confidence: 0.7 };
  if (label !== "") return { role: "process", confidence: 0.55 };
  return { role: "unknown", confidence: 0.2 };
}

/**
 * Converts DrawingML shapes, connectors, anchors, and semantics into one scene.
 *
 * @param document - Parsed DrawingML document or presentation slide.
 * @param id - Stable identifier assigned to the resulting scene.
 * @param title - Safe display title for the scene.
 * @param sheet - Optional spreadsheet sheet name owning the drawing.
 * @returns Drawing scene with visual shapes and semantic diagram graph.
 */
function parseDrawing(
  document: XMLDocument,
  id: string,
  title: string,
  sheet?: string,
): DrawingScene {
  const shapes: DrawingShape[] = [];
  const edges: DiagramEdge[] = [];
  const nodes: DiagramNode[] = [];
  let width = 1;
  let height = 1;
  const anchors = descendants(document, "twoCellAnchor").concat(
    descendants(document, "oneCellAnchor"),
    descendants(document, "absoluteAnchor"),
  );
  const candidates =
    anchors.length === 0
      ? descendants(document, "sp").concat(descendants(document, "cxnSp"))
      : anchors;
  for (const [index, container] of candidates.entries()) {
    const shape =
      container.localName === "sp" || container.localName === "cxnSp"
        ? container
        : (first(container, "sp") ?? first(container, "cxnSp"));
    if (shape === undefined) continue;
    const properties = first(shape, "cNvPr");
    const shapeId = attribute(properties ?? shape, "id") ?? `shape-${index + 1}`;
    const box =
      anchors.length === 0
        ? (() => {
            const transform = first(shape, "xfrm");
            const offset = transform === undefined ? undefined : child(transform, "off");
            const extent = transform === undefined ? undefined : child(transform, "ext");
            return {
              x: numericAttribute(offset, "x") / 9525,
              y: numericAttribute(offset, "y") / 9525,
              width: Math.max(1, numericAttribute(extent, "cx") / 9525),
              height: Math.max(1, numericAttribute(extent, "cy") / 9525),
            };
          })()
        : anchorBox(container);
    const text = textContent(shape).trim();
    const preset = attribute(first(shape, "prstGeom") ?? shape, "prst") ?? "rect";
    const fill = attribute(first(shape, "srgbClr") ?? shape, "val");
    shapes.push({
      id: shapeId,
      kind: shapeKind(shape),
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height,
      ...(text === "" ? {} : { text }),
      ...(fill === undefined ? {} : { fill: `#${fill}` }),
    });
    width = Math.max(width, box.x + box.width);
    height = Math.max(height, box.y + box.height);
    if (shape.localName === "cxnSp") {
      const start = first(shape, "stCxn");
      const end = first(shape, "endCxn");
      const from = attribute(start ?? shape, "id");
      const to = attribute(end ?? shape, "id");
      edges.push({
        id: `edge-${shapeId}`,
        inferred: false,
        ...(from === undefined ? {} : { from }),
        ...(to === undefined ? {} : { to }),
        ...(text === "" ? {} : { label: text }),
      });
    } else {
      const recognition = diagramRole(text, preset);
      const cellRange = anchors.length === 0 ? undefined : anchorCellRange(container);
      nodes.push({
        id: shapeId,
        label: text,
        role: recognition.role,
        bounds: box,
        ...(sheet === undefined ? {} : { sheet }),
        ...(cellRange === undefined ? {} : { cellRange }),
        confidence: recognition.confidence,
      });
    }
  }
  const nodeIds = new Set(nodes.map((node) => node.id));
  const warnings: DiagramWarning[] = [];
  for (const edge of edges) {
    if (edge.from !== undefined && !nodeIds.has(edge.from))
      warnings.push({ code: "DIAGRAM_DANGLING_SOURCE", edgeId: edge.id, nodeId: edge.from });
    if (edge.to !== undefined && !nodeIds.has(edge.to))
      warnings.push({ code: "DIAGRAM_DANGLING_TARGET", edgeId: edge.id, nodeId: edge.to });
  }
  return {
    schemaVersion: 1,
    id,
    kind: "drawing",
    title,
    width,
    height,
    shapes,
    edges,
    graph: { nodes, edges, warnings },
  };
}

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
    sheets.push({
      id: `sheet-${sheetIndex + 1}`,
      name: attribute(sheet, "name") ?? `Sheet ${sheetIndex + 1}`,
      cells,
    });
    const sheetRels = await relationships(archive, part, maxNodes);
    for (const drawingReference of elements(sheetDocument, "drawing")) {
      const id = attribute(drawingReference, "id");
      const drawingPart = id === undefined ? undefined : sheetRels.get(id);
      if (drawingPart === undefined || !archive.entries.some((entry) => entry.path === drawingPart))
        continue;
      drawings.push(
        parseDrawing(
          parseXml(await archive.text(drawingPart), maxNodes),
          `${documentId}-drawing-${drawings.length + 1}`,
          `${attribute(sheet, "name") ?? `Sheet ${sheetIndex + 1}`} drawing`,
          attribute(sheet, "name") ?? `Sheet ${sheetIndex + 1}`,
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
  const slidePaths = archive.entries
    .map((entry) => entry.path)
    .filter((path) => /^ppt\/slides\/slide\d+\.xml$/u.test(path))
    .sort((a, b) => Number(a.match(/\d+/u)?.[0]) - Number(b.match(/\d+/u)?.[0]));
  const pages = [];
  for (const [index, path] of slidePaths.entries()) {
    const document = parseXml(await archive.text(path), maxNodes);
    const drawing = parseDrawing(document, `${id}-drawing-${index + 1}`, `Slide ${index + 1}`);
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

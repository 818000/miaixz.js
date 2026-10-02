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
 * Decodes SpreadsheetDrawing shape trees into a format-neutral drawing scene.
 */

import type {
  DiagramEdge,
  DiagramNode,
  DiagramWarning,
  DrawingFeatures,
  DrawingGradientFill,
  DrawingScene,
  DrawingShape,
  DrawingTextStyle,
  DrawingTransform,
  Rectangle,
  SpreadsheetSheetLayout,
} from "../../shared/contracts/document.js";
import {
  allElements,
  firstElementByLocalName as first,
  localAttribute as attribute,
  textFromElements as textContent,
  type XmlDocument,
  type XmlElement,
} from "../xml/xml-codec.js";
import { decodeOfficeGeometry } from "./geometry-codec.js";
import { spreadsheetMarkerPosition } from "./spreadsheet-layout-codec.js";
import { defaultOfficeTheme, resolveOfficeColor, type OfficeTheme } from "./theme-codec.js";

const emuPerPixel = 9525;
type Element = XmlElement;
type XMLDocument = XmlDocument;

/**
 * Describes one image resource resolved from the owning package part.
 */
export interface OfficeDrawingImage {
  readonly source: string;
  readonly mimeType: string;
  readonly unsupportedRecords?: number;
}

/**
 * Supplies document identity, package resources, and theme data to the decoder.
 */
export interface OfficeDrawingOptions {
  readonly id: string;
  readonly title: string;
  readonly sheetId?: string;
  readonly sheetName?: string;
  readonly theme?: OfficeTheme;
  readonly images?: ReadonlyMap<string, OfficeDrawingImage>;
  readonly diagrams?: ReadonlyMap<string, DrawingScene>;
  readonly layout?: SpreadsheetSheetLayout;
  readonly canvas?: {
    readonly width: number;
    readonly height: number;
    readonly background?: string;
  };
  readonly hostPlacement?: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  };
  readonly useHostPlacementForConnectors?: boolean;
}

/**
 * Stores mutable feature counters while a scene is decoded.
 */
interface MutableFeatures {
  shapeCount: number;
  connectorCount: number;
  groupCount: number;
  pictureCount: number;
  customGeometryCount: number;
  smartArtCount: number;
  unsupportedCount: number;
}

/**
 * Stores accumulated scene output during recursive traversal.
 */
interface DrawingAccumulator {
  readonly shapes: DrawingShape[];
  readonly edges: DiagramEdge[];
  readonly nodes: DiagramNode[];
  readonly warnings: DiagramWarning[];
  readonly features: MutableFeatures;
  width: number;
  height: number;
}

/**
 * Describes fallback geometry derived from one worksheet anchor.
 */
interface AnchorGeometry {
  readonly matrix: DrawingTransform;
  readonly width: number;
  readonly height: number;
  readonly cellRange?: string;
}

/**
 * Returns a finite numeric value with a deterministic fallback.
 *
 * @param value - Optional numeric XML value.
 * @param fallback - Value returned when the source is not finite.
 * @returns Finite number.
 */
function finite(value: string | undefined, fallback = 0): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

/**
 * Converts DrawingML EMU units to CSS pixels.
 *
 * @param value - Distance measured in EMU.
 * @returns Distance measured in CSS pixels at 96 DPI.
 */
function pixels(value: number): number {
  return value / emuPerPixel;
}

/**
 * Finds a direct child by local name.
 *
 * @param parent - Element whose immediate children are inspected.
 * @param localName - Namespace-independent child name.
 * @returns First matching direct child.
 */
function child(parent: Element, localName: string): Element | undefined {
  return [...parent.children].find((element) => element.localName === localName);
}

/**
 * Returns direct children whose local names belong to an accepted set.
 *
 * @param parent - Element whose immediate children are inspected.
 * @param localNames - Accepted namespace-independent names.
 * @returns Matching children in document order.
 */
function children(parent: Element, localNames: readonly string[]): Element[] {
  return [...parent.children].filter((element) => localNames.includes(element.localName));
}

const drawingObjectNames = new Set(["sp", "cxnSp", "grpSp", "pic", "graphicFrame", "wsp", "wgp"]);

/**
 * Finds top-level drawing objects beneath namespace-specific wrapper elements.
 *
 * @param root - Shape tree, Word anchor, or graphic-data wrapper.
 * @returns Drawing objects in source order.
 */
function drawingObjects(root: Element): Element[] {
  if (drawingObjectNames.has(root.localName)) return [root];
  if (root.localName === "graphicData" && first(root, "relIds") !== undefined) return [root];
  const result: Element[] = [];
  for (const element of root.children) {
    if (drawingObjectNames.has(element.localName)) result.push(element);
    else result.push(...drawingObjects(element));
  }
  return result;
}

/**
 * Creates an identity affine transform.
 *
 * @returns Identity transform.
 */
function identity(): DrawingTransform {
  return { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
}

/**
 * Multiplies two affine transforms in parent-to-child order.
 *
 * @param left - Transform applied after the right transform.
 * @param right - Transform applied before the left transform.
 * @returns Composed affine transform.
 */
function multiply(left: DrawingTransform, right: DrawingTransform): DrawingTransform {
  return {
    a: left.a * right.a + left.c * right.b,
    b: left.b * right.a + left.d * right.b,
    c: left.a * right.c + left.c * right.d,
    d: left.b * right.c + left.d * right.d,
    e: left.a * right.e + left.c * right.f + left.e,
    f: left.b * right.e + left.d * right.f + left.f,
  };
}

/**
 * Creates one translation transform.
 *
 * @param x - Horizontal translation.
 * @param y - Vertical translation.
 * @returns Translation transform.
 */
function translate(x: number, y: number): DrawingTransform {
  return { a: 1, b: 0, c: 0, d: 1, e: x, f: y };
}

/**
 * Creates one scale transform.
 *
 * @param x - Horizontal scale.
 * @param y - Vertical scale.
 * @returns Scale transform.
 */
function scale(x: number, y: number): DrawingTransform {
  return { a: x, b: 0, c: 0, d: y, e: 0, f: 0 };
}

/**
 * Creates one clockwise SVG-compatible rotation transform.
 *
 * @param degrees - Clockwise angle in degrees.
 * @returns Rotation transform.
 */
function rotate(degrees: number): DrawingTransform {
  const radians = (degrees * Math.PI) / 180;
  return {
    a: Math.cos(radians),
    b: Math.sin(radians),
    c: -Math.sin(radians),
    d: Math.cos(radians),
    e: 0,
    f: 0,
  };
}

/**
 * Applies an affine transform to one point.
 *
 * @param matrix - Transform applied to the point.
 * @param x - Local horizontal coordinate.
 * @param y - Local vertical coordinate.
 * @returns Transformed point.
 */
function point(
  matrix: DrawingTransform,
  x: number,
  y: number,
): { readonly x: number; readonly y: number } {
  return {
    x: matrix.a * x + matrix.c * y + matrix.e,
    y: matrix.b * x + matrix.d * y + matrix.f,
  };
}

/**
 * Computes an axis-aligned rectangle around one transformed local extent.
 *
 * @param matrix - Transform applied to the extent.
 * @param width - Local width.
 * @param height - Local height.
 * @returns Axis-aligned global bounds.
 */
function transformedBounds(matrix: DrawingTransform, width: number, height: number): Rectangle {
  const points = [
    point(matrix, 0, 0),
    point(matrix, width, 0),
    point(matrix, width, height),
    point(matrix, 0, height),
  ];
  const horizontal = points.map((item) => item.x);
  const vertical = points.map((item) => item.y);
  const left = Math.min(...horizontal);
  const top = Math.min(...vertical);
  return {
    x: left,
    y: top,
    width: Math.max(...horizontal) - left,
    height: Math.max(...vertical) - top,
  };
}

/**
 * Creates the rotation and flip transform around one extent center.
 *
 * @param transform - DrawingML transform element.
 * @param width - Extent width.
 * @param height - Extent height.
 * @returns Centered rotation and flip transform.
 */
function centeredTransform(transform: Element, width: number, height: number): DrawingTransform {
  const degrees = finite(attribute(transform, "rot")) / 60_000;
  const horizontal = attribute(transform, "flipH") === "1" ? -1 : 1;
  const vertical = attribute(transform, "flipV") === "1" ? -1 : 1;
  const centerX = width / 2;
  const centerY = height / 2;
  return multiply(
    translate(centerX, centerY),
    multiply(rotate(degrees), multiply(scale(horizontal, vertical), translate(-centerX, -centerY))),
  );
}

/**
 * Reads a shape transform and returns local dimensions plus global placement.
 *
 * @param shapeProperties - Shape properties containing an optional transform.
 * @param parent - Parent transform for nested groups.
 * @param fallback - Anchor-derived fallback geometry.
 * @param useAnchorGeometry - Whether the worksheet anchor is authoritative.
 * @returns Local shape dimensions and composite transform.
 */
function shapePlacement(
  shapeProperties: Element,
  parent: DrawingTransform,
  fallback: AnchorGeometry,
  useAnchorGeometry = false,
): { readonly matrix: DrawingTransform; readonly width: number; readonly height: number } {
  const transform = child(shapeProperties, "xfrm");
  if (useAnchorGeometry) {
    return {
      matrix:
        transform === undefined
          ? multiply(parent, fallback.matrix)
          : multiply(
              parent,
              multiply(
                fallback.matrix,
                centeredTransform(transform, fallback.width, fallback.height),
              ),
            ),
      width: fallback.width,
      height: fallback.height,
    };
  }
  if (transform === undefined) {
    return {
      matrix: multiply(parent, fallback.matrix),
      width: fallback.width,
      height: fallback.height,
    };
  }
  const offset = child(transform, "off");
  const extent = child(transform, "ext");
  const width = Math.max(
    1,
    pixels(finite(attribute(extent ?? transform, "cx"), fallback.width * emuPerPixel)),
  );
  const height = Math.max(
    1,
    pixels(finite(attribute(extent ?? transform, "cy"), fallback.height * emuPerPixel)),
  );
  const x = pixels(finite(attribute(offset ?? transform, "x")));
  const y = pixels(finite(attribute(offset ?? transform, "y")));
  return {
    matrix: multiply(
      parent,
      multiply(translate(x, y), centeredTransform(transform, width, height)),
    ),
    width,
    height,
  };
}

/**
 * Reads the child-coordinate transform declared by one group shape.
 *
 * @param group - Group shape element.
 * @param parent - Parent transform for nested groups.
 * @param fallback - Anchor-derived fallback geometry.
 * @param useAnchorGeometry - Whether the worksheet anchor is authoritative.
 * @returns Composite transform applied to group children.
 */
function groupTransform(
  group: Element,
  parent: DrawingTransform,
  fallback: AnchorGeometry,
  useAnchorGeometry = false,
): DrawingTransform {
  const properties = child(group, "grpSpPr");
  const transform = properties === undefined ? undefined : child(properties, "xfrm");
  if (transform === undefined) return multiply(parent, fallback.matrix);
  const offset = child(transform, "off");
  const extent = child(transform, "ext");
  const childOffset = child(transform, "chOff");
  const childExtent = child(transform, "chExt");
  const x = pixels(finite(attribute(offset ?? transform, "x")));
  const y = pixels(finite(attribute(offset ?? transform, "y")));
  const width = Math.max(
    1,
    pixels(finite(attribute(extent ?? transform, "cx"), fallback.width * emuPerPixel)),
  );
  const height = Math.max(
    1,
    pixels(finite(attribute(extent ?? transform, "cy"), fallback.height * emuPerPixel)),
  );
  const childX = pixels(finite(attribute(childOffset ?? transform, "x")));
  const childY = pixels(finite(attribute(childOffset ?? transform, "y")));
  const childWidth = Math.max(
    1,
    pixels(finite(attribute(childExtent ?? transform, "cx"), width * emuPerPixel)),
  );
  const childHeight = Math.max(
    1,
    pixels(finite(attribute(childExtent ?? transform, "cy"), height * emuPerPixel)),
  );
  if (useAnchorGeometry) {
    const mapping = multiply(
      scale(fallback.width / childWidth, fallback.height / childHeight),
      translate(-childX, -childY),
    );
    const center = multiply(
      translate(fallback.width / 2, fallback.height / 2),
      multiply(
        rotate(finite(attribute(transform, "rot")) / 60_000),
        multiply(
          scale(
            attribute(transform, "flipH") === "1" ? -1 : 1,
            attribute(transform, "flipV") === "1" ? -1 : 1,
          ),
          translate(-fallback.width / 2, -fallback.height / 2),
        ),
      ),
    );
    return multiply(parent, multiply(fallback.matrix, multiply(center, mapping)));
  }
  const mapping = multiply(
    translate(x, y),
    multiply(scale(width / childWidth, height / childHeight), translate(-childX, -childY)),
  );
  const center = multiply(
    translate(x + width / 2, y + height / 2),
    multiply(
      rotate(finite(attribute(transform, "rot")) / 60_000),
      multiply(
        scale(
          attribute(transform, "flipH") === "1" ? -1 : 1,
          attribute(transform, "flipV") === "1" ? -1 : 1,
        ),
        translate(-(x + width / 2), -(y + height / 2)),
      ),
    ),
  );
  return multiply(parent, multiply(center, mapping));
}

/**
 * Converts a zero-based spreadsheet column index to an A1 column name.
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
 * Converts one DrawingML cell marker to an A1 address.
 *
 * @param marker - DrawingML row and column marker.
 * @returns A1 cell address when valid.
 */
function markerCell(marker: Element | undefined): string | undefined {
  if (marker === undefined) return undefined;
  const column = Number(child(marker, "col")?.textContent);
  const row = Number(child(marker, "row")?.textContent);
  if (!Number.isInteger(column) || !Number.isInteger(row) || column < 0 || row < 0)
    return undefined;
  return `${columnName(column)}${row + 1}`;
}

/**
 * Derives approximate anchor coordinates for malformed shapes without transforms.
 *
 * @param marker - DrawingML row and column marker.
 * @param layout - Optional worksheet coordinate index for real row and column sizes.
 * @returns Approximate position in CSS pixels.
 */
function markerPosition(
  marker: Element | undefined,
  layout?: SpreadsheetSheetLayout,
): { readonly x: number; readonly y: number } {
  if (marker === undefined) return { x: 0, y: 0 };
  const column = finite(child(marker, "col")?.textContent ?? undefined);
  const row = finite(child(marker, "row")?.textContent ?? undefined);
  const columnOffset = pixels(finite(child(marker, "colOff")?.textContent ?? undefined));
  const rowOffset = pixels(finite(child(marker, "rowOff")?.textContent ?? undefined));
  if (layout !== undefined) {
    return spreadsheetMarkerPosition(
      layout,
      column,
      row,
      columnOffset * emuPerPixel,
      rowOffset * emuPerPixel,
    );
  }
  return { x: column * 64 + columnOffset, y: row * 20 + rowOffset };
}

/**
 * Converts one worksheet anchor into fallback drawing geometry.
 *
 * @param anchor - DrawingML worksheet anchor.
 * @param layout - Optional worksheet coordinate index for real row and column sizes.
 * @returns Fallback placement and covered cell range.
 */
function anchorGeometry(anchor: Element, layout?: SpreadsheetSheetLayout): AnchorGeometry {
  const from = child(anchor, "from");
  const to = child(anchor, "to");
  const fromCell = markerCell(from);
  const toCell = markerCell(to);
  const cellRange =
    fromCell === undefined
      ? undefined
      : toCell === undefined || toCell === fromCell
        ? fromCell
        : `${fromCell}:${toCell}`;
  if (from !== undefined && to !== undefined) {
    const start = markerPosition(from, layout);
    const end = markerPosition(to, layout);
    return {
      matrix: translate(start.x, start.y),
      width: Math.max(1, end.x - start.x),
      height: Math.max(1, end.y - start.y),
      ...(cellRange === undefined ? {} : { cellRange }),
    };
  }
  const position = child(anchor, "pos");
  const extent = child(anchor, "ext");
  return {
    matrix: translate(
      pixels(finite(attribute(position ?? anchor, "x"))),
      pixels(finite(attribute(position ?? anchor, "y"))),
    ),
    width: Math.max(1, pixels(finite(attribute(extent ?? anchor, "cx"), emuPerPixel))),
    height: Math.max(1, pixels(finite(attribute(extent ?? anchor, "cy"), emuPerPixel))),
    ...(cellRange === undefined ? {} : { cellRange }),
  };
}

/**
 * Infers a semantic flow role without affecting visual rendering.
 *
 * @param label - Human-readable shape label.
 * @param preset - DrawingML preset geometry identifier.
 * @returns Inferred role and confidence.
 */
function diagramRole(
  label: string,
  preset: string,
): { readonly role: DiagramNode["role"]; readonly confidence: number } {
  const normalized = label.trim().toLowerCase();
  if (/^(start|begin|開始|开始|起点)$/u.test(normalized))
    return { role: "start", confidence: 0.95 };
  if (/^(end|finish|終了|结束|終点|终点)$/u.test(normalized))
    return { role: "end", confidence: 0.95 };
  if (/diamond|decision/iu.test(preset)) return { role: "decision", confidence: 0.9 };
  if (/document/iu.test(preset)) return { role: "document", confidence: 0.85 };
  if (/parallelogram|inputOutput|input/iu.test(preset)) return { role: "input", confidence: 0.8 };
  if (label !== "") return { role: "process", confidence: 0.6 };
  return { role: "unknown", confidence: 0.2 };
}

/**
 * Maps a DrawingML dash identifier to an SVG dash sequence.
 *
 * @param value - DrawingML preset dash identifier.
 * @returns SVG stroke-dasharray value when dashed.
 */
function dashPattern(value: string | undefined): string | undefined {
  if (value === undefined || value === "solid") return undefined;
  if (/dot/iu.test(value) && /dash/iu.test(value)) return "6 3 1 3";
  if (/dot/iu.test(value)) return "1 3";
  if (/longDash/iu.test(value)) return "12 4";
  return "6 4";
}

/**
 * Resolves the visible fill for one shape.
 *
 * @param properties - Shape properties containing direct paint overrides.
 * @param style - Shape style containing theme references.
 * @param theme - Active Office theme.
 * @param connector - Whether the shape is a connector.
 * @returns CSS fill value.
 */
function shapeFill(
  properties: Element,
  style: Element | undefined,
  theme: OfficeTheme,
  connector: boolean,
): string {
  if (child(properties, "noFill") !== undefined || connector) return "none";
  const direct =
    child(properties, "solidFill") ??
    child(properties, "gradFill") ??
    child(properties, "pattFill");
  if (direct !== undefined) return resolveOfficeColor(direct, theme, "#FFFFFF");
  return resolveOfficeColor(
    style === undefined ? undefined : child(style, "fillRef"),
    theme,
    "#FFFFFF",
  );
}

/**
 * Resolves one DrawingML linear gradient into SVG-ready stops.
 *
 * @param properties - Shape properties containing an optional gradient fill.
 * @param theme - Active Office theme.
 * @returns Normalized gradient when at least two stops are declared.
 */
function shapeGradient(properties: Element, theme: OfficeTheme): DrawingGradientFill | undefined {
  const gradient = child(properties, "gradFill");
  if (gradient === undefined) return undefined;
  const stops = allElements(gradient)
    .filter((element) => element.localName === "gs")
    .map((stop) => ({
      offset: Math.min(1, Math.max(0, finite(attribute(stop, "pos")) / 100_000)),
      color: resolveOfficeColor(stop, theme, "#FFFFFF"),
    }))
    .sort((left, right) => left.offset - right.offset);
  if (stops.length < 2) return undefined;
  const line = first(gradient, "lin");
  return {
    angle: finite(attribute(line ?? gradient, "ang")) / 60_000,
    stops,
  };
}

/**
 * Resolves the visible outline for one shape.
 *
 * @param properties - Shape properties containing a line declaration.
 * @param style - Shape style containing theme references.
 * @param theme - Active Office theme.
 * @returns CSS stroke value.
 */
function shapeStroke(properties: Element, style: Element | undefined, theme: OfficeTheme): string {
  const line = child(properties, "ln");
  if (line !== undefined && child(line, "noFill") !== undefined) return "none";
  if (line !== undefined)
    return resolveOfficeColor(child(line, "solidFill") ?? line, theme, "#000000");
  return resolveOfficeColor(
    style === undefined ? undefined : child(style, "lnRef"),
    theme,
    "#000000",
  );
}

/**
 * Reads normalized text and presentation from one shape text body.
 *
 * @param shape - Shape containing an optional text body.
 * @param theme - Active Office theme.
 * @returns Text content and optional style.
 */
function shapeText(
  shape: Element,
  theme: OfficeTheme,
): { readonly text?: string; readonly textStyle?: DrawingTextStyle } {
  const body = child(shape, "txBody") ?? child(shape, "txbx");
  if (body === undefined) return {};
  const paragraphs = allElements(body).filter((element) => element.localName === "p");
  const text = paragraphs
    .map((paragraph) => textContent(paragraph).trim())
    .join("\n")
    .trim();
  if (text === "") return {};
  const runProperties = first(body, "rPr") ?? first(body, "endParaRPr");
  const paragraphProperties = first(body, "pPr");
  const bodyProperties = child(body, "bodyPr") ?? child(shape, "bodyPr");
  const wordJustification = first(paragraphProperties ?? body, "jc");
  const alignment =
    attribute(paragraphProperties ?? body, "algn") ??
    attribute(wordJustification ?? paragraphProperties ?? body, "val");
  const anchor = attribute(bodyProperties ?? body, "anchor");
  const wordFonts = first(runProperties ?? body, "rFonts");
  const font =
    first(runProperties ?? body, "ea") ?? first(runProperties ?? body, "latin") ?? wordFonts;
  const wordColor = first(runProperties ?? body, "color");
  const rawWordColor = attribute(wordColor ?? body, "val");
  const wordSize = first(runProperties ?? body, "sz");
  const wordBold = first(runProperties ?? body, "b");
  const wordItalic = first(runProperties ?? body, "i");
  const wordUnderline = first(runProperties ?? body, "u");
  const enabled = (element: Element | undefined): boolean => {
    if (element === undefined) return false;
    return !["0", "false", "none", "off"].includes(attribute(element, "val") ?? "1");
  };
  const fontSize =
    wordSize === undefined
      ? Math.max(8, (finite(attribute(runProperties ?? body, "sz"), 900) / 100) * (4 / 3))
      : Math.max(8, (finite(attribute(wordSize, "val"), 18) / 2) * (4 / 3));
  const textStyle: DrawingTextStyle = {
    align:
      alignment === "ctr" || alignment === "center"
        ? "center"
        : alignment === "r" || alignment === "right" || alignment === "end"
          ? "end"
          : "start",
    bold: attribute(runProperties ?? body, "b") === "1" || enabled(wordBold),
    color:
      rawWordColor !== undefined && /^[\dA-F]{6}$/iu.test(rawWordColor)
        ? `#${rawWordColor}`
        : resolveOfficeColor(runProperties, theme, "#000000"),
    fontFamily:
      attribute(font ?? body, "typeface") ??
      attribute(font ?? body, "eastAsia") ??
      attribute(font ?? body, "ascii") ??
      attribute(font ?? body, "hAnsi") ??
      "Arial, sans-serif",
    fontSize,
    italic: attribute(runProperties ?? body, "i") === "1" || enabled(wordItalic),
    underline:
      ![undefined, "none"].includes(attribute(runProperties ?? body, "u")) ||
      enabled(wordUnderline),
    verticalAlign: anchor === "b" ? "bottom" : anchor === "ctr" ? "center" : "top",
  };
  return { text, textStyle };
}

/**
 * Updates the scene extent using one transformed element bounds.
 *
 * @param accumulator - Mutable scene accumulator.
 * @param bounds - Global element bounds.
 */
function includeBounds(accumulator: DrawingAccumulator, bounds: Rectangle): void {
  accumulator.width = Math.max(accumulator.width, bounds.x + bounds.width);
  accumulator.height = Math.max(accumulator.height, bounds.y + bounds.height);
}

/**
 * Decodes one ordinary shape or connection shape.
 *
 * @param shape - DrawingML shape element.
 * @param parent - Parent group transform.
 * @param fallback - Anchor-derived fallback placement.
 * @param useAnchorGeometry - Whether the worksheet anchor is authoritative.
 * @param options - Scene decoding options.
 * @param accumulator - Mutable scene output.
 */
function parseShape(
  shape: Element,
  parent: DrawingTransform,
  fallback: AnchorGeometry,
  useAnchorGeometry: boolean,
  options: OfficeDrawingOptions,
  accumulator: DrawingAccumulator,
): void {
  const properties = child(shape, "spPr");
  if (properties === undefined) {
    accumulator.features.unsupportedCount += 1;
    return;
  }
  const preset = attribute(first(properties, "prstGeom") ?? properties, "prst") ?? "";
  const connector =
    shape.localName === "cxnSp" ||
    (shape.localName === "wsp" && /(?:connector|^line$)/iu.test(preset));
  const placement = shapePlacement(
    properties,
    parent,
    fallback,
    useAnchorGeometry && (!connector || options.useHostPlacementForConnectors === true),
  );
  const metadata = first(shape, "cNvPr");
  const shapeId = attribute(metadata ?? shape, "id") ?? `shape-${accumulator.shapes.length + 1}`;
  const name = attribute(metadata ?? shape, "name");
  const decoded = decodeOfficeGeometry(properties, placement.width, placement.height, connector);
  if (!decoded.supported) accumulator.features.unsupportedCount += 1;
  const theme = options.theme ?? defaultOfficeTheme();
  const style = child(shape, "style");
  const line = child(properties, "ln");
  const text = shapeText(shape, theme);
  const fillGradient = shapeGradient(properties, theme);
  if (child(properties, "pattFill") !== undefined || first(properties, "effectLst") !== undefined) {
    accumulator.features.unsupportedCount += 1;
  }
  const dash = dashPattern(attribute(first(line ?? properties, "prstDash") ?? properties, "val"));
  const startArrow = attribute(child(line ?? properties, "headEnd") ?? properties, "type");
  const endArrow = attribute(child(line ?? properties, "tailEnd") ?? properties, "type");
  const drawingShape: DrawingShape = {
    id: shapeId,
    kind: decoded.geometry.kind,
    x: 0,
    y: 0,
    width: placement.width,
    height: placement.height,
    fill: shapeFill(properties, style, theme, connector),
    ...(fillGradient === undefined ? {} : { fillGradient }),
    stroke: shapeStroke(properties, style, theme),
    transform: placement.matrix,
    preset: decoded.preset,
    strokeWidth: Math.max(0.5, pixels(finite(attribute(line ?? properties, "w"), 9525))),
    ...(name === undefined ? {} : { name }),
    ...(decoded.geometry.path === undefined ? {} : { path: decoded.geometry.path }),
    ...(decoded.geometry.cornerRadius === undefined
      ? {}
      : { cornerRadius: decoded.geometry.cornerRadius }),
    ...(dash === undefined ? {} : { strokeDasharray: dash }),
    ...(startArrow === undefined ? {} : { startArrow }),
    ...(endArrow === undefined ? {} : { endArrow }),
    ...text,
  };
  accumulator.shapes.push(drawingShape);
  const bounds = transformedBounds(placement.matrix, placement.width, placement.height);
  includeBounds(accumulator, bounds);
  if (decoded.preset === "custom") accumulator.features.customGeometryCount += 1;
  if (connector) {
    accumulator.features.connectorCount += 1;
    const connectionProperties = first(shape, "cNvCxnSpPr");
    const start =
      connectionProperties === undefined ? undefined : child(connectionProperties, "stCxn");
    const end =
      connectionProperties === undefined ? undefined : child(connectionProperties, "endCxn");
    const from = attribute(start ?? shape, "id");
    const to = attribute(end ?? shape, "id");
    accumulator.edges.push({
      id: `edge-${shapeId}`,
      inferred: false,
      ...(from === undefined ? {} : { from }),
      ...(to === undefined ? {} : { to }),
      ...(text.text === undefined ? {} : { label: text.text }),
    });
  } else {
    accumulator.features.shapeCount += 1;
    const recognition = diagramRole(text.text ?? "", decoded.preset);
    accumulator.nodes.push({
      id: shapeId,
      label: text.text ?? "",
      role: recognition.role,
      bounds,
      ...(options.sheetName === undefined ? {} : { sheet: options.sheetName }),
      ...(fallback.cellRange === undefined ? {} : { cellRange: fallback.cellRange }),
      confidence: recognition.confidence,
    });
  }
}

/**
 * Decodes one picture shape and its package resource.
 *
 * @param picture - DrawingML picture element.
 * @param parent - Parent group transform.
 * @param fallback - Anchor-derived fallback placement.
 * @param useAnchorGeometry - Whether the worksheet anchor is authoritative.
 * @param options - Scene decoding options.
 * @param accumulator - Mutable scene output.
 */
function parsePicture(
  picture: Element,
  parent: DrawingTransform,
  fallback: AnchorGeometry,
  useAnchorGeometry: boolean,
  options: OfficeDrawingOptions,
  accumulator: DrawingAccumulator,
): void {
  const properties = child(picture, "spPr");
  if (properties === undefined) {
    accumulator.features.unsupportedCount += 1;
    return;
  }
  const placement = shapePlacement(properties, parent, fallback, useAnchorGeometry);
  const metadata = first(picture, "cNvPr");
  const id = attribute(metadata ?? picture, "id") ?? `picture-${accumulator.shapes.length + 1}`;
  const name = attribute(metadata ?? picture, "name");
  const blip = first(picture, "blip");
  const relationId = attribute(blip ?? picture, "embed") ?? attribute(blip ?? picture, "link");
  const image = relationId === undefined ? undefined : options.images?.get(relationId);
  const sourceRectangle = first(picture, "srcRect");
  const imageCrop = {
    left: Math.min(1, Math.max(0, finite(attribute(sourceRectangle ?? picture, "l")) / 100_000)),
    top: Math.min(1, Math.max(0, finite(attribute(sourceRectangle ?? picture, "t")) / 100_000)),
    right: Math.min(1, Math.max(0, finite(attribute(sourceRectangle ?? picture, "r")) / 100_000)),
    bottom: Math.min(1, Math.max(0, finite(attribute(sourceRectangle ?? picture, "b")) / 100_000)),
  };
  const hasImageCrop = Object.values(imageCrop).some((value) => value > 0);
  const alpha = first(picture, "alphaModFix");
  const opacity = Math.min(
    1,
    Math.max(0, finite(attribute(alpha ?? picture, "amt"), 100_000) / 100_000),
  );
  accumulator.shapes.push({
    id,
    kind: "image",
    x: 0,
    y: 0,
    width: placement.width,
    height: placement.height,
    fill: "none",
    stroke: "none",
    transform: placement.matrix,
    ...(name === undefined ? {} : { name }),
    ...(image === undefined ? {} : { source: image.source, mimeType: image.mimeType }),
    ...(hasImageCrop ? { imageCrop } : {}),
    ...(opacity === 1 ? {} : { opacity }),
  });
  accumulator.features.pictureCount += 1;
  if (image === undefined) accumulator.features.unsupportedCount += 1;
  else accumulator.features.unsupportedCount += image.unsupportedRecords ?? 0;
  includeBounds(
    accumulator,
    transformedBounds(placement.matrix, placement.width, placement.height),
  );
}

/**
 * Decodes one graphic frame through its materialized drawing or a safe placeholder.
 *
 * @param frame - DrawingML graphic frame element.
 * @param parent - Parent group transform.
 * @param fallback - Anchor-derived fallback placement.
 * @param useAnchorGeometry - Whether the worksheet anchor is authoritative.
 * @param options - Theme, image, and materialized diagram resources.
 * @param accumulator - Mutable scene output.
 */
function parseGraphicFrame(
  frame: Element,
  parent: DrawingTransform,
  fallback: AnchorGeometry,
  useAnchorGeometry: boolean,
  options: OfficeDrawingOptions,
  accumulator: DrawingAccumulator,
): void {
  const placement = shapePlacement(frame, parent, fallback, useAnchorGeometry);
  const metadata = first(frame, "cNvPr");
  const id = attribute(metadata ?? frame, "id") ?? `graphic-${accumulator.shapes.length + 1}`;
  const name = attribute(metadata ?? frame, "name") ?? "Diagram";
  const relationIds = first(frame, "relIds");
  const diagramId = relationIds === undefined ? undefined : attribute(relationIds, "dm");
  const diagram = diagramId === undefined ? undefined : options.diagrams?.get(diagramId);
  if (diagram !== undefined) {
    const scaleX = placement.width / Math.max(1, diagram.width);
    const scaleY = placement.height / Math.max(1, diagram.height);
    const contentTransform = multiply(placement.matrix, scale(scaleX, scaleY));
    const idMap = new Map(diagram.shapes.map((shape) => [shape.id, `${id}-${shape.id}`]));
    for (const shape of diagram.shapes) {
      const transform = multiply(contentTransform, shape.transform ?? translate(shape.x, shape.y));
      accumulator.shapes.push({
        ...shape,
        id: idMap.get(shape.id) ?? `${id}-${shape.id}`,
        x: shape.transform === undefined ? 0 : shape.x,
        y: shape.transform === undefined ? 0 : shape.y,
        transform,
      });
      includeBounds(accumulator, transformedBounds(transform, shape.width, shape.height));
    }
    for (const edge of diagram.edges) {
      accumulator.edges.push({
        ...edge,
        id: `${id}-${edge.id}`,
        ...(edge.from === undefined ? {} : { from: idMap.get(edge.from) ?? `${id}-${edge.from}` }),
        ...(edge.to === undefined ? {} : { to: idMap.get(edge.to) ?? `${id}-${edge.to}` }),
      });
    }
    for (const node of diagram.graph?.nodes ?? []) {
      const topLeft = point(contentTransform, node.bounds.x, node.bounds.y);
      const bottomRight = point(
        contentTransform,
        node.bounds.x + node.bounds.width,
        node.bounds.y + node.bounds.height,
      );
      accumulator.nodes.push({
        ...node,
        id: idMap.get(node.id) ?? `${id}-${node.id}`,
        bounds: {
          x: Math.min(topLeft.x, bottomRight.x),
          y: Math.min(topLeft.y, bottomRight.y),
          width: Math.abs(bottomRight.x - topLeft.x),
          height: Math.abs(bottomRight.y - topLeft.y),
        },
        ...(options.sheetName === undefined ? {} : { sheet: options.sheetName }),
      });
    }
    accumulator.features.smartArtCount += 1;
    accumulator.features.shapeCount += diagram.features?.shapeCount ?? 0;
    accumulator.features.connectorCount += diagram.features?.connectorCount ?? 0;
    accumulator.features.groupCount += diagram.features?.groupCount ?? 0;
    accumulator.features.pictureCount += diagram.features?.pictureCount ?? 0;
    accumulator.features.customGeometryCount += diagram.features?.customGeometryCount ?? 0;
    accumulator.features.unsupportedCount += diagram.features?.unsupportedCount ?? 0;
    return;
  }
  const smartArt = relationIds !== undefined;
  accumulator.shapes.push({
    id,
    kind: "rectangle",
    x: 0,
    y: 0,
    width: placement.width,
    height: placement.height,
    fill: "#F8FAFC",
    stroke: "#64748B",
    strokeDasharray: "6 4",
    strokeWidth: 1,
    transform: placement.matrix,
    text: name,
    textStyle: {
      align: "center",
      bold: false,
      color: "#334155",
      fontFamily: "Arial, sans-serif",
      fontSize: 12,
      italic: false,
      underline: false,
      verticalAlign: "center",
    },
  });
  if (smartArt) accumulator.features.smartArtCount += 1;
  accumulator.features.unsupportedCount += 1;
  includeBounds(
    accumulator,
    transformedBounds(placement.matrix, placement.width, placement.height),
  );
}

/**
 * Recursively decodes one drawing object while preserving document order.
 *
 * @param object - Shape, connector, group, picture, or graphic frame.
 * @param parent - Parent group transform.
 * @param fallback - Anchor-derived fallback placement.
 * @param useAnchorGeometry - Whether the worksheet anchor is authoritative.
 * @param options - Scene decoding options.
 * @param accumulator - Mutable scene output.
 */
function parseObject(
  object: Element,
  parent: DrawingTransform,
  fallback: AnchorGeometry,
  useAnchorGeometry: boolean,
  options: OfficeDrawingOptions,
  accumulator: DrawingAccumulator,
): void {
  if (["sp", "cxnSp", "wsp"].includes(object.localName)) {
    parseShape(object, parent, fallback, useAnchorGeometry, options, accumulator);
  } else if (object.localName === "pic") {
    parsePicture(object, parent, fallback, useAnchorGeometry, options, accumulator);
  } else if (object.localName === "graphicFrame" || object.localName === "graphicData") {
    parseGraphicFrame(object, parent, fallback, useAnchorGeometry, options, accumulator);
  } else if (object.localName === "grpSp" || object.localName === "wgp") {
    accumulator.features.groupCount += 1;
    const transform = groupTransform(object, parent, fallback, useAnchorGeometry);
    for (const nested of object.children.flatMap((element) => drawingObjects(element))) {
      parseObject(nested, transform, fallback, false, options, accumulator);
    }
  } else {
    accumulator.features.unsupportedCount += 1;
  }
}

/**
 * Converts a SpreadsheetDrawing document into one complete drawing scene.
 *
 * @param source - Parsed SpreadsheetDrawing XML document.
 * @param options - Scene identity, sheet ownership, resources, and theme.
 * @returns Drawing scene containing visual elements and a semantic graph.
 */
export function parseOfficeDrawing(
  source: XMLDocument,
  options: OfficeDrawingOptions,
): DrawingScene {
  const accumulator: DrawingAccumulator = {
    shapes: [],
    edges: [],
    nodes: [],
    warnings: [],
    features: {
      shapeCount: 0,
      connectorCount: 0,
      groupCount: 0,
      pictureCount: 0,
      customGeometryCount: 0,
      smartArtCount: 0,
      unsupportedCount: 0,
    },
    width: Math.max(1, options.canvas?.width ?? 1),
    height: Math.max(1, options.canvas?.height ?? 1),
  };
  const anchors = [...source.documentElement.children].filter((element) =>
    ["absoluteAnchor", "oneCellAnchor", "twoCellAnchor"].includes(element.localName),
  );
  if (options.hostPlacement !== undefined) {
    const fallback: AnchorGeometry = {
      matrix: translate(options.hostPlacement.x, options.hostPlacement.y),
      width: Math.max(1, options.hostPlacement.width),
      height: Math.max(1, options.hostPlacement.height),
    };
    for (const object of drawingObjects(source.documentElement)) {
      parseObject(object, identity(), fallback, true, options, accumulator);
    }
  } else if (anchors.length === 0) {
    const fallback: AnchorGeometry = { matrix: identity(), width: 1, height: 1 };
    const shapeTree = first(source, "spTree") ?? source.documentElement;
    for (const object of drawingObjects(shapeTree)) {
      parseObject(object, identity(), fallback, false, options, accumulator);
    }
  } else {
    for (const anchor of anchors) {
      const fallback = anchorGeometry(anchor, options.layout);
      for (const object of drawingObjects(anchor)) {
        parseObject(object, identity(), fallback, true, options, accumulator);
      }
    }
  }
  const nodeIds = new Set(accumulator.nodes.map((node) => node.id));
  for (const edge of accumulator.edges) {
    if (edge.from !== undefined && !nodeIds.has(edge.from)) {
      accumulator.warnings.push({
        code: "DIAGRAM_DANGLING_SOURCE",
        edgeId: edge.id,
        nodeId: edge.from,
      });
    }
    if (edge.to !== undefined && !nodeIds.has(edge.to)) {
      accumulator.warnings.push({
        code: "DIAGRAM_DANGLING_TARGET",
        edgeId: edge.id,
        nodeId: edge.to,
      });
    }
  }
  const features: DrawingFeatures = { ...accumulator.features };
  return {
    schemaVersion: 1,
    id: options.id,
    kind: "drawing",
    title: options.title,
    width: Math.max(1, options.canvas?.width ?? 0, options.layout?.width ?? 0, accumulator.width),
    height: Math.max(
      1,
      options.canvas?.height ?? 0,
      options.layout?.height ?? 0,
      accumulator.height,
    ),
    ...(options.canvas?.background === undefined ? {} : { background: options.canvas.background }),
    shapes: accumulator.shapes,
    edges: accumulator.edges,
    graph: {
      nodes: accumulator.nodes,
      edges: accumulator.edges,
      warnings: accumulator.warnings,
    },
    features,
    ...(options.sheetId === undefined ? {} : { sheetId: options.sheetId }),
    ...(options.sheetName === undefined ? {} : { sheetName: options.sheetName }),
  };
}

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
 * Decodes legacy Office VML shapes retained inside OOXML workbooks.
 */

import type {
  DiagramEdge,
  DiagramNode,
  DrawingScene,
  DrawingShape,
} from "../../shared/contracts/document.js";
import {
  allElements,
  localAttribute as attribute,
  parseXmlDocument as parseXml,
  type XmlElement,
} from "../xml/xml-codec.js";

type Element = XmlElement;

/**
 * Converts a VML or CSS length to CSS pixels.
 *
 * @param value - Numeric length with an optional unit.
 * @param fallback - Value returned when parsing fails.
 * @returns Length in CSS pixels.
 */
function length(value: string | undefined, fallback = 0): number {
  if (value === undefined) return fallback;
  const match = /^\s*(-?[\d.]+)\s*(cm|in|mm|pc|pt|px)?\s*$/iu.exec(value);
  if (match === null) return fallback;
  const number = Number(match[1]);
  if (!Number.isFinite(number)) return fallback;
  const unit = match[2]?.toLowerCase() ?? "px";
  if (unit === "pt") return number * (4 / 3);
  if (unit === "pc") return number * 16;
  if (unit === "in") return number * 96;
  if (unit === "cm") return number * (96 / 2.54);
  if (unit === "mm") return number * (96 / 25.4);
  return number;
}

/**
 * Parses a VML style attribute into lowercase property names.
 *
 * @param source - Semicolon-delimited VML style declaration.
 * @returns Normalized style property map.
 */
function styleMap(source: string | undefined): ReadonlyMap<string, string> {
  const result = new Map<string, string>();
  for (const declaration of source?.split(";") ?? []) {
    const separator = declaration.indexOf(":");
    if (separator <= 0) continue;
    result.set(
      declaration.slice(0, separator).trim().toLowerCase(),
      declaration.slice(separator + 1).trim(),
    );
  }
  return result;
}

/**
 * Normalizes common VML color declarations to CSS values.
 *
 * @param value - VML named, hexadecimal, or automatic color.
 * @param fallback - CSS fallback color.
 * @returns CSS color value.
 */
function color(value: string | undefined, fallback: string): string {
  if (value === undefined || value === "auto") return fallback;
  if (/^#[\da-f]{6}$/iu.test(value)) return value.toUpperCase();
  return value;
}

/**
 * Parses a comma-delimited VML point pair.
 *
 * @param value - VML coordinate pair.
 * @returns Horizontal and vertical coordinates.
 */
function pair(value: string | undefined): readonly [number, number] {
  const [horizontal, vertical] = value?.split(",") ?? [];
  return [length(horizontal), length(vertical)];
}

/**
 * Maps one VML element name to the shared drawing kind.
 *
 * @param element - VML shape element.
 * @returns Shared drawing kind.
 */
function shapeKind(element: Element): DrawingShape["kind"] {
  if (element.localName === "oval") return "ellipse";
  if (element.localName === "line") return "line";
  if (element.localName === "polyline" || element.localName === "curve") return "path";
  return "rectangle";
}

/**
 * Extracts one legacy VML drawing into a format-neutral scene.
 *
 * @param source - Complete VML XML source.
 * @param id - Stable scene identifier.
 * @param title - Safe scene title.
 * @param maxNodes - Maximum XML nodes accepted by the parser.
 * @param sheetId - Optional owning worksheet identifier.
 * @param sheetName - Optional owning worksheet name.
 * @param maxDepth - Maximum XML nesting depth accepted by the parser.
 * @returns Legacy drawing scene.
 */
export function parseVmlDrawing(
  source: string,
  id: string,
  title: string,
  maxNodes: number,
  sheetId?: string,
  sheetName?: string,
  maxDepth = 128,
): DrawingScene {
  const document = parseXml(source, maxNodes, maxDepth);
  const shapes: DrawingShape[] = [];
  const nodes: DiagramNode[] = [];
  const edges: DiagramEdge[] = [];
  let width = 1;
  let height = 1;
  const candidates = allElements(document).filter((element) =>
    ["arc", "curve", "line", "oval", "polyline", "rect", "roundrect", "shape"].includes(
      element.localName,
    ),
  );
  for (const [index, element] of candidates.entries()) {
    const style = styleMap(attribute(element, "style"));
    const from = pair(attribute(element, "from"));
    const to = pair(attribute(element, "to"));
    const x = length(style.get("margin-left") ?? style.get("left"), from[0]);
    const y = length(style.get("margin-top") ?? style.get("top"), from[1]);
    const shapeWidth = Math.max(
      1,
      length(style.get("width"), element.localName === "line" ? to[0] - from[0] : 120),
    );
    const shapeHeight = Math.max(
      1,
      length(style.get("height"), element.localName === "line" ? to[1] - from[1] : 60),
    );
    const shapeId = attribute(element, "id") ?? `vml-shape-${index + 1}`;
    const text = element.textContent.replaceAll(/\s+/gu, " ").trim();
    const shape: DrawingShape = {
      id: shapeId,
      kind: shapeKind(element),
      x,
      y,
      width: shapeWidth,
      height: shapeHeight,
      fill:
        attribute(element, "filled") === "f"
          ? "none"
          : color(attribute(element, "fillcolor"), "#FFFFFF"),
      stroke:
        attribute(element, "stroked") === "f"
          ? "none"
          : color(attribute(element, "strokecolor"), "#000000"),
      strokeWidth: Math.max(0.5, length(attribute(element, "strokeweight"), 1)),
      ...(element.localName === "roundrect"
        ? { cornerRadius: Math.min(shapeWidth, shapeHeight) * 0.16 }
        : {}),
      ...(text === "" ? {} : { text }),
    };
    shapes.push(shape);
    if (element.localName === "line") {
      edges.push({ id: `edge-${shapeId}`, inferred: true });
    } else {
      nodes.push({
        id: shapeId,
        label: text,
        role: "unknown",
        bounds: { x, y, width: shapeWidth, height: shapeHeight },
        ...(sheetName === undefined ? {} : { sheet: sheetName }),
        confidence: 0.3,
      });
    }
    width = Math.max(width, x + shapeWidth);
    height = Math.max(height, y + shapeHeight);
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
    graph: { nodes, edges, warnings: [] },
    features: {
      shapeCount: nodes.length,
      connectorCount: edges.length,
      groupCount: 0,
      pictureCount: 0,
      customGeometryCount: 0,
      smartArtCount: 0,
      unsupportedCount: 0,
    },
    ...(sheetId === undefined ? {} : { sheetId }),
    ...(sheetName === undefined ? {} : { sheetName }),
  };
}

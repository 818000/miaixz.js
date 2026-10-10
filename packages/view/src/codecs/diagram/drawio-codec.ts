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
 * Provides the Draw.io, Excalidraw, and tldraw drawing codec.
 */

import { VERSION } from "../../version.js";

import type { DiagramEdge, DrawingScene, DrawingShape } from "../../shared/contracts/document.js";
import type { ViewerDriver } from "../../shared/contracts/driver.js";
import { documentTitle, stableDocumentId } from "../../shared/document/document-identity.js";
import { ViewerError } from "../../shared/errors/viewer-error.js";
import {
  getResourceBudgetGuard,
  type ResourceBudgetGuard,
} from "../../runtime/resource-budget-guard.js";
import {
  elementsByLocalName,
  firstElementByLocalName,
  localAttribute,
  parseXmlDocument,
} from "../xml/xml-codec.js";
import { arrayField, numberField, objectField, stringField } from "../json/field-codec.js";

const decoder = new TextDecoder();

/**
 * Maps vendor shape identifiers to the format-neutral drawing kind.
 *
 * @param value - Unknown vendor shape identifier.
 * @returns Supported format-neutral shape kind.
 */
function shapeType(value: unknown): DrawingShape["kind"] {
  if (value === "ellipse") return "ellipse";
  if (value === "line" || value === "arrow") return "line";
  if (value === "text") return "text";
  if (value === "image") return "image";
  return "rectangle";
}

/**
 * Converts Excalidraw or tldraw JSON records into one drawing scene.
 *
 * @param value - Parsed untrusted drawing JSON value.
 * @param id - Stable document identifier.
 * @param title - Safe display title for the drawing.
 * @param guard - Shared session resource-accounting guard.
 * @param signal - Session cancellation signal.
 * @returns Normalized drawing scene and semantic edges.
 */
function jsonDrawing(
  value: unknown,
  id: string,
  title: string,
  guard: ResourceBudgetGuard,
  signal: AbortSignal,
): DrawingScene {
  const root = objectField(value) ?? {};
  const rawElements =
    arrayField(root.elements).length > 0
      ? arrayField(root.elements)
      : arrayField(root.records).filter((record) => objectField(record)?.typeName === "shape");
  const shapes: DrawingShape[] = [];
  const edges: DiagramEdge[] = [];
  let width = 1;
  let height = 1;
  for (const [index, raw] of rawElements.entries()) {
    if ((index & 0xff) === 0) guard.checkpoint(signal);
    const element = objectField(raw);
    if (element === undefined || element.isDeleted === true) continue;
    const properties = objectField(element.props) ?? element;
    const x = numberField(element.x);
    const y = numberField(element.y);
    const shapeWidth = Math.max(1, numberField(element.width ?? properties.w, 120));
    const shapeHeight = Math.max(1, numberField(element.height ?? properties.h, 60));
    const shapeId = stringField(element.id) ?? `shape-${index + 1}`;
    const type = element.type ?? properties.geo;
    const text = stringField(element.text ?? properties.text);
    const fill = stringField(element.backgroundColor);
    const stroke = stringField(element.strokeColor);
    shapes.push({
      id: shapeId,
      kind: shapeType(type),
      x,
      y,
      width: shapeWidth,
      height: shapeHeight,
      ...(text === undefined ? {} : { text }),
      ...(fill === undefined ? {} : { fill }),
      ...(stroke === undefined ? {} : { stroke }),
    });
    guard.consumeDrawingObjects();
    if (type === "arrow") {
      const start = objectField(element.startBinding);
      const end = objectField(element.endBinding);
      const from = stringField(start?.elementId);
      const to = stringField(end?.elementId);
      edges.push({
        id: `edge-${shapeId}`,
        inferred: false,
        ...(from === undefined ? {} : { from }),
        ...(to === undefined ? {} : { to }),
      });
      guard.consumeDrawingObjects();
    }
    width = Math.max(width, x + shapeWidth);
    height = Math.max(height, y + shapeHeight);
  }
  return { schemaVersion: VERSION, id, kind: "drawing", title, width, height, shapes, edges };
}

/**
 * Converts a Draw.io XML graph into one drawing scene.
 *
 * @param source - Decoded Draw.io XML source.
 * @param id - Stable document identifier.
 * @param title - Safe display title for the drawing.
 * @param maxNodes - Maximum number of XML nodes accepted by the parser.
 * @param maxDepth - Maximum XML element nesting depth.
 * @param guard - Shared session resource-accounting guard.
 * @param signal - Session cancellation signal.
 * @returns Normalized drawing scene and semantic edges.
 */
function drawioDrawing(
  source: string,
  id: string,
  title: string,
  maxNodes: number,
  maxDepth: number,
  guard: ResourceBudgetGuard,
  signal: AbortSignal,
): DrawingScene {
  const document = parseXmlDocument(source, maxNodes, maxDepth);
  const shapes: DrawingShape[] = [];
  const edges: DiagramEdge[] = [];
  let width = 1;
  let height = 1;
  for (const [index, cell] of elementsByLocalName(document, "mxCell").entries()) {
    if ((index & 0xff) === 0) guard.checkpoint(signal);
    const cellId = localAttribute(cell, "id");
    if (cellId === undefined) continue;
    const geometry = firstElementByLocalName(cell, "mxGeometry");
    const x = Number(localAttribute(geometry ?? cell, "x") ?? 0);
    const y = Number(localAttribute(geometry ?? cell, "y") ?? 0);
    const shapeWidth = Math.max(1, Number(localAttribute(geometry ?? cell, "width") ?? 120));
    const shapeHeight = Math.max(1, Number(localAttribute(geometry ?? cell, "height") ?? 60));
    const label = localAttribute(cell, "value")
      ?.replaceAll(/<[^>]*>/gu, "")
      .trim();
    if (localAttribute(cell, "edge") === "1") {
      const from = localAttribute(cell, "source");
      const to = localAttribute(cell, "target");
      edges.push({
        id: `edge-${cellId}`,
        inferred: false,
        ...(from === undefined ? {} : { from }),
        ...(to === undefined ? {} : { to }),
        ...(label === undefined || label === "" ? {} : { label }),
      });
      guard.consumeDrawingObjects();
    } else if (localAttribute(cell, "vertex") === "1") {
      shapes.push({
        id: cellId,
        kind: "rectangle",
        x,
        y,
        width: shapeWidth,
        height: shapeHeight,
        ...(label === undefined || label === "" ? {} : { text: label }),
      });
      guard.consumeDrawingObjects();
      width = Math.max(width, x + shapeWidth);
      height = Math.max(height, y + shapeHeight);
    }
  }
  return { schemaVersion: VERSION, id, kind: "drawing", title, width, height, shapes, edges };
}

/**
 * Parses Draw.io, Excalidraw, and tldraw into one drawing model.
 */
export const drawioDriver: ViewerDriver<DrawingScene> = {
  id: "drawio",
  /**
   * Opens Draw.io, Excalidraw, or tldraw content as a drawing scene.
   *
   * @param context - Bounded driver context for the selected drawing source.
   * @returns Complete drawing scene or an explicit parse rejection.
   */
  async open(context) {
    const bytes = await context.resource.readAll(context.signal);
    const id = stableDocumentId(context.resource.name, bytes);
    const title = documentTitle(context.resource.name);
    const guard = getResourceBudgetGuard(context.budget, context.signal);
    try {
      const source = decoder.decode(bytes);
      guard.consumeTextCharacters(source.length);
      const model =
        context.decision.extension === "drawio" || context.decision.extension === "dio"
          ? drawioDrawing(
              source,
              id,
              title,
              context.budget.maxXmlNodes,
              context.budget.maxXmlDepth,
              guard,
              context.signal,
            )
          : jsonDrawing(JSON.parse(source), id, title, guard, context.signal);
      return { status: "complete", model, warnings: [] };
    } catch (error) {
      return {
        status: "rejected",
        error: error instanceof ViewerError ? error : new ViewerError("PARSE_FAILED", "parse"),
      };
    }
  },
};

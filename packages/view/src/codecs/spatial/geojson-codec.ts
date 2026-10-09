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
 * Provides the GeoJSON and TopoJSON coordinate codec.
 */

import { VERSION } from "../../version.js";

import type { DrawingScene, DrawingShape } from "../../shared/contracts/document.js";
import type { ViewerDriver } from "../../shared/contracts/driver.js";
import { documentTitle, stableDocumentId } from "../../shared/document/document-identity.js";
import { ViewerError } from "../../shared/errors/viewer-error.js";
import {
  getResourceBudgetGuard,
  type ResourceBudgetGuard,
} from "../../runtime/resource-budget-guard.js";
import { shouldYieldParser, yieldParserTask } from "../../runtime/cooperative-yield.js";
import { objectField } from "../json/field-codec.js";

const decoder = new TextDecoder();

/**
 * Iteratively collects finite coordinate pairs from GeoJSON-family data.
 *
 * @param value - Unknown JSON subtree being inspected.
 * @param output - Mutable collection receiving longitude-latitude pairs.
 * @param guard - Shared session resource-accounting guard.
 * @param signal - Session cancellation signal.
 * @param sourceBytes - Complete bounded source byte length.
 */
async function collectCoordinates(
  value: unknown,
  output: number[][],
  guard: ResourceBudgetGuard,
  signal: AbortSignal,
  sourceBytes: number,
): Promise<void> {
  const pending: Array<{ readonly depth: number; readonly value: unknown }> = [{ depth: 0, value }];
  guard.consumeVectorRecords();
  let visited = 0;
  while (pending.length > 0) {
    const current = pending.pop();
    if (current === undefined) break;
    if ((visited & 0x3ff) === 0) guard.checkpoint(signal);
    visited += 1;
    guard.assertDepth(current.depth, "maxRecursionDepth");
    if (
      Array.isArray(current.value) &&
      current.value.length >= 2 &&
      typeof current.value[0] === "number" &&
      Number.isFinite(current.value[0]) &&
      typeof current.value[1] === "number" &&
      Number.isFinite(current.value[1])
    ) {
      output.push([current.value[0], current.value[1]]);
      guard.consumeDrawingObjects();
      if (shouldYieldParser(sourceBytes, visited)) await yieldParserTask(signal);
      continue;
    }
    const children = Array.isArray(current.value)
      ? current.value
      : Object.values(objectField(current.value) ?? {});
    if (children.length > 0) {
      guard.assertDepth(current.depth + 1, "maxRecursionDepth");
      guard.consumeVectorRecords(children.length);
    }
    for (let index = children.length - 1; index >= 0; index -= 1) {
      pending.push({ depth: current.depth + 1, value: children[index] });
    }
    if (shouldYieldParser(sourceBytes, visited)) await yieldParserTask(signal);
  }
}

/**
 * Parses GeoJSON-family coordinates into a deterministic overview drawing.
 */
export const geojsonDriver: ViewerDriver<DrawingScene> = {
  id: "geojson",
  /**
   * Opens GeoJSON or TopoJSON content as a deterministic overview drawing.
   *
   * @param context - Bounded driver context for the selected GIS source.
   * @returns Complete coordinate drawing or an explicit unsupported result.
   */
  async open(context) {
    const bytes = await context.resource.readAll(context.signal);
    if (context.decision.extension !== "geojson" && context.decision.extension !== "topojson") {
      return { status: "rejected", error: new ViewerError("FORMAT_UNSUPPORTED", "parse", true) };
    }
    const source = decoder.decode(bytes);
    const guard = getResourceBudgetGuard(context.budget, context.signal);
    guard.consumeTextCharacters(source.length);
    const value = JSON.parse(source) as unknown;
    const coordinates: number[][] = [];
    await collectCoordinates(value, coordinates, guard, context.signal, bytes.byteLength);
    const id = stableDocumentId(context.resource.name, bytes);
    const shapes: DrawingShape[] = coordinates.map(([longitude = 0, latitude = 0], index) => ({
      id: `point-${index + 1}`,
      kind: "ellipse",
      x: (longitude + 180) * 4,
      y: (90 - latitude) * 4,
      width: 6,
      height: 6,
    }));
    return {
      status: "complete",
      warnings: [],
      model: {
        schemaVersion: VERSION,
        id,
        kind: "drawing",
        title: documentTitle(context.resource.name),
        width: 1440,
        height: 720,
        shapes,
        edges: [],
      },
    };
  },
};

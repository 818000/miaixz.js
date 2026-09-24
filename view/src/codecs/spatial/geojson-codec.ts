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

import type { DrawingScene, DrawingShape } from "../../shared/contracts/document.js";
import type { ViewerDriver } from "../../shared/contracts/driver.js";
import { documentTitle, stableDocumentId } from "../../shared/document/document-identity.js";
import { ViewerError } from "../../shared/errors/viewer-error.js";
import { objectField } from "../json/field-codec.js";

const decoder = new TextDecoder();

/**
 * Recursively collects coordinate pairs from GeoJSON-family data.
 *
 * @param value - Unknown JSON subtree being inspected.
 * @param output - Mutable collection receiving longitude-latitude pairs.
 */
function collectCoordinates(value: unknown, output: number[][]): void {
  if (
    Array.isArray(value) &&
    value.length >= 2 &&
    typeof value[0] === "number" &&
    typeof value[1] === "number"
  )
    output.push([value[0], value[1]]);
  else if (Array.isArray(value)) for (const child of value) collectCoordinates(child, output);
  else {
    const object = objectField(value);
    if (object !== undefined) {
      for (const child of Object.values(object)) collectCoordinates(child, output);
    }
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
    const value = JSON.parse(decoder.decode(bytes)) as unknown;
    const coordinates: number[][] = [];
    collectCoordinates(value, coordinates);
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
        schemaVersion: 1,
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

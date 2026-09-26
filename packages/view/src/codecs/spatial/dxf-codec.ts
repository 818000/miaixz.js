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
 * Provides the codec for supported spatial entities in ASCII DXF documents.
 */

import type { DrawingScene, DrawingShape } from "../../shared/contracts/document.js";
import type { ViewerDriver } from "../../shared/contracts/driver.js";
import { documentTitle, stableDocumentId } from "../../shared/document/document-identity.js";
import { ViewerError } from "../../shared/errors/viewer-error.js";
import { createShapeScene } from "./shape-codec.js";

const decoder = new TextDecoder();

/**
 * Parses supported ASCII DXF entities into a drawing scene.
 *
 * @param source - Decoded ASCII DXF source.
 * @param id - Stable document identifier.
 * @param title - Safe display title for the drawing.
 * @returns Drawing scene containing supported DXF entities.
 */
function dxfDrawing(source: string, id: string, title: string): DrawingScene {
  const lines = source.split(/\r?\n/u);
  const shapes: DrawingShape[] = [];
  let entity: Record<string, string> | undefined;
  const commit = (): void => {
    if (entity === undefined) return;
    const type = entity.type;
    const x = Number(entity["10"] ?? 0);
    const y = -Number(entity["20"] ?? 0);
    if (type === "LINE") {
      shapes.push({
        id: `entity-${shapes.length + 1}`,
        kind: "line",
        x,
        y,
        width: Number(entity["11"] ?? x) - x,
        height: -Number(entity["21"] ?? -y) - y,
      });
    } else if (type === "CIRCLE") {
      const radius = Number(entity["40"] ?? 1);
      shapes.push({
        id: `entity-${shapes.length + 1}`,
        kind: "ellipse",
        x: x - radius,
        y: y - radius,
        width: radius * 2,
        height: radius * 2,
      });
    } else if (type === "TEXT" || type === "MTEXT") {
      shapes.push({
        id: `entity-${shapes.length + 1}`,
        kind: "text",
        x,
        y,
        width: 160,
        height: 24,
        text: entity["1"] ?? "",
      });
    }
  };
  for (let index = 0; index + 1 < lines.length; index += 2) {
    const code = lines[index]?.trim() ?? "";
    const value = lines[index + 1]?.trim() ?? "";
    if (code === "0") {
      commit();
      entity = { type: value };
    } else if (entity !== undefined) entity[code] = value;
  }
  commit();
  return createShapeScene(title, id, shapes);
}

/**
 * Parses open text CAD formats and explicitly rejects proprietary binary CAD.
 */
export const dxfDriver: ViewerDriver<DrawingScene> = {
  id: "dxf",
  /**
   * Opens supported text CAD sources without executing embedded content.
   *
   * @param context - Bounded driver context for the selected CAD source.
   * @returns Complete DXF drawing or an explicit unsupported result.
   */
  async open(context) {
    if (context.decision.extension !== "dxf") {
      return { status: "rejected", error: new ViewerError("FORMAT_UNSUPPORTED", "parse", true) };
    }
    const bytes = await context.resource.readAll(context.signal);
    const model = dxfDrawing(
      decoder.decode(bytes),
      stableDocumentId(context.resource.name, bytes),
      documentTitle(context.resource.name),
    );
    return { status: "complete", model, warnings: [] };
  },
};

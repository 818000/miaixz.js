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
 * Provides the Wavefront OBJ codec for safe scene and wireframe models.
 */

import type { DrawingScene, DrawingShape, SceneDocument } from "../../shared/contracts/document.js";
import type { ViewerDriver } from "../../shared/contracts/driver.js";
import { documentTitle, stableDocumentId } from "../../shared/document/document-identity.js";
import { ViewerError } from "../../shared/errors/viewer-error.js";
import { createShapeScene } from "./shape-codec.js";

const decoder = new TextDecoder();

/**
 * Projects OBJ vertices and faces into a two-dimensional wireframe preview.
 *
 * @param source - Decoded OBJ source text.
 * @param id - Stable identifier assigned to the preview drawing.
 * @param title - Safe display title for the preview.
 * @returns Drawing scene containing projected wireframe edges.
 */
function objDrawing(source: string, id: string, title: string): DrawingScene {
  const vertices: Array<readonly [number, number]> = [];
  const shapes: DrawingShape[] = [];
  for (const line of source.split(/\r?\n/u)) {
    const fields = line.trim().split(/\s+/u);
    if (fields[0] === "v")
      vertices.push([Number(fields[1] ?? 0) * 100, -Number(fields[2] ?? 0) * 100]);
    else if (fields[0] === "f") {
      const indexes = fields.slice(1).map((field) => Number(field.split("/")[0]) - 1);
      for (let index = 0; index < indexes.length; index += 1) {
        const from = vertices[indexes[index] ?? -1];
        const to = vertices[indexes[(index + 1) % indexes.length] ?? -1];
        if (from !== undefined && to !== undefined)
          shapes.push({
            id: `edge-${shapes.length + 1}`,
            kind: "line",
            x: from[0],
            y: from[1],
            width: to[0] - from[0],
            height: to[1] - from[1],
          });
      }
    }
  }
  return createShapeScene(title, id, shapes);
}

/**
 * Summarizes OBJ geometry as a safe renderer-independent scene.
 *
 * @param source - Decoded OBJ source text.
 * @param id - Stable document identifier.
 * @param title - Safe display title for the scene.
 * @returns Scene model with mesh statistics and a wireframe preview.
 */
function objScene(source: string, id: string, title: string): SceneDocument {
  const lines = source.split(/\r?\n/u).map((line) => line.trim());
  const vertexCount = lines.filter((line) => line.startsWith("v ")).length;
  const triangleCount = lines
    .filter((line) => line.startsWith("f "))
    .reduce((total, line) => Math.max(0, line.split(/\s+/u).length - 3) + total, 0);
  return {
    schemaVersion: 1,
    id,
    kind: "scene",
    title,
    meshes: [{ id: `${id}-mesh-1`, name: title, vertexCount, triangleCount }],
    nodes: [
      {
        id: `${id}-node-1`,
        name: title,
        meshId: `${id}-mesh-1`,
        visible: true,
      },
    ],
    preview: objDrawing(source, `${id}-preview`, title),
  };
}

/**
 * Parses OBJ wireframes and exposes unsupported 3D containers honestly.
 */
export const objDriver: ViewerDriver<SceneDocument> = {
  id: "obj",
  /**
   * Opens supported OBJ sources as safe scene metadata and wireframes.
   *
   * @param context - Bounded driver context for the selected 3D source.
   * @returns Complete OBJ scene or an explicit unsupported result.
   */
  async open(context) {
    if (context.decision.extension !== "obj") {
      return { status: "rejected", error: new ViewerError("FORMAT_UNSUPPORTED", "parse", true) };
    }
    const bytes = await context.resource.readAll(context.signal);
    const model = objScene(
      decoder.decode(bytes),
      stableDocumentId(context.resource.name, bytes),
      documentTitle(context.resource.name),
    );
    return { status: "complete", model, warnings: [] };
  },
};

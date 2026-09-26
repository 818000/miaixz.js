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
 * Provides the XMind archive and topic-tree codec.
 */

import type { DiagramEdge, DrawingScene, DrawingShape } from "../../shared/contracts/document.js";
import type { ViewerDriver } from "../../shared/contracts/driver.js";
import { documentTitle, stableDocumentId } from "../../shared/document/document-identity.js";
import { ViewerError } from "../../shared/errors/viewer-error.js";
import { ZipArchive } from "../archive/zip-codec.js";
import { arrayField, objectField, stringField } from "../json/field-codec.js";

interface TopicNode {
  readonly id?: unknown;
  readonly title?: unknown;
  readonly children?: unknown;
}

/**
 * Visits one XMind topic recursively and appends graph shapes and edges.
 *
 * @param topic - Topic record being converted.
 * @param depth - Zero-based hierarchy depth used for horizontal placement.
 * @param row - Mutable row counter shared across the traversal.
 * @param shapes - Output collection receiving topic shapes.
 * @param edges - Output collection receiving parent-child edges.
 * @param parent - Optional identifier of the parent topic.
 */
function visitTopic(
  topic: TopicNode,
  depth: number,
  row: { value: number },
  shapes: DrawingShape[],
  edges: DiagramEdge[],
  parent?: string,
): void {
  const id = stringField(topic.id) ?? `topic-${shapes.length + 1}`;
  const y = row.value * 80;
  row.value += 1;
  shapes.push({
    id,
    kind: "rectangle",
    x: depth * 180,
    y,
    width: 150,
    height: 48,
    text: stringField(topic.title) ?? "Untitled",
  });
  if (parent !== undefined)
    edges.push({ id: `edge-${parent}-${id}`, from: parent, to: id, inferred: false });
  const childGroups = objectField(topic.children);
  for (const group of Object.values(childGroups ?? {})) {
    for (const child of arrayField(group)) {
      const node = objectField(child);
      if (node !== undefined) visitTopic(node, depth + 1, row, shapes, edges, id);
    }
  }
}

/**
 * Parses XMind content.json topic trees into semantic nodes and edges.
 */
export const xmindDriver: ViewerDriver<DrawingScene> = {
  id: "xmind",
  /**
   * Opens an XMind archive and converts its topic hierarchy into a drawing scene.
   *
   * @param context - Bounded driver context for the selected XMind source.
   * @returns Complete topic drawing or an explicit unsupported result.
   */
  async open(context) {
    const bytes = await context.resource.readAll(context.signal);
    const archive = new ZipArchive(bytes, context.budget);
    if (!archive.entries.some((entry) => entry.path === "content.json")) {
      return { status: "rejected", error: new ViewerError("FORMAT_UNSUPPORTED", "parse", true) };
    }
    const sheets = arrayField(JSON.parse(await archive.text("content.json")));
    const shapes: DrawingShape[] = [];
    const edges: DiagramEdge[] = [];
    const row = { value: 0 };
    for (const sheet of sheets) {
      const rootTopic = objectField(sheet)?.rootTopic;
      if (objectField(rootTopic) !== undefined)
        visitTopic(objectField(rootTopic) ?? {}, 0, row, shapes, edges);
    }
    const id = stableDocumentId(context.resource.name, bytes);
    const model: DrawingScene = {
      schemaVersion: 1,
      id,
      kind: "drawing",
      title: documentTitle(context.resource.name),
      width: Math.max(1, ...shapes.map((shape) => shape.x + shape.width)),
      height: Math.max(1, ...shapes.map((shape) => shape.y + shape.height)),
      shapes,
      edges,
    };
    return { status: "complete", model, warnings: [] };
  },
};

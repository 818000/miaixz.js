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

import { VERSION } from "../../version.js";

import type { DiagramEdge, DrawingScene, DrawingShape } from "../../shared/contracts/document.js";
import type { ViewerDriver } from "../../shared/contracts/driver.js";
import { documentTitle, stableDocumentId } from "../../shared/document/document-identity.js";
import { ViewerError } from "../../shared/errors/viewer-error.js";
import {
  getResourceBudgetGuard,
  type ResourceBudgetGuard,
} from "../../runtime/resource-budget-guard.js";
import { shouldYieldParser, yieldParserTask } from "../../runtime/cooperative-yield.js";
import { ZipArchive } from "../archive/zip-codec.js";
import { arrayField, objectField, stringField } from "../json/field-codec.js";

/**
 * XMind topic content and ordered children decoded from a workbook entry.
 */
interface TopicNode {
  readonly id?: unknown;
  readonly title?: unknown;
  readonly children?: unknown;
}

/**
 * Visits one XMind topic tree iteratively and appends graph shapes and edges.
 *
 * @param topic - Topic record being converted.
 * @param shapes - Output collection receiving topic shapes.
 * @param edges - Output collection receiving parent-child edges.
 * @param guard - Shared session resource-accounting guard.
 * @param signal - Session cancellation signal.
 * @param sourceBytes - Decoded topic source size used to avoid overhead on small documents.
 */
async function visitTopic(
  topic: TopicNode,
  shapes: DrawingShape[],
  edges: DiagramEdge[],
  guard: ResourceBudgetGuard,
  signal: AbortSignal,
  sourceBytes: number,
): Promise<void> {
  const pending: Array<{
    readonly depth: number;
    readonly parent?: string;
    readonly topic: TopicNode;
  }> = [{ depth: 0, topic }];
  guard.consumeDrawingObjects();
  let row = 0;
  while (pending.length > 0) {
    const current = pending.pop();
    if (current === undefined) break;
    if ((row & 0xff) === 0) guard.checkpoint(signal);
    guard.assertDepth(current.depth, "maxRecursionDepth");
    const id = stringField(current.topic.id) ?? `topic-${shapes.length + 1}`;
    shapes.push({
      id,
      kind: "rectangle",
      x: current.depth * 180,
      y: row * 80,
      width: 150,
      height: 48,
      text: stringField(current.topic.title) ?? "Untitled",
    });
    row += 1;
    if (current.parent !== undefined) {
      edges.push({
        id: `edge-${current.parent}-${id}`,
        from: current.parent,
        to: id,
        inferred: false,
      });
    }
    const children: TopicNode[] = [];
    for (const group of Object.values(objectField(current.topic.children) ?? {})) {
      for (const child of arrayField(group)) {
        const node = objectField(child);
        if (node !== undefined) {
          guard.consumeDrawingObjects(2);
          children.push(node);
        }
      }
    }
    for (let index = children.length - 1; index >= 0; index -= 1) {
      const child = children[index];
      if (child !== undefined) {
        pending.push({ depth: current.depth + 1, parent: id, topic: child });
      }
    }
    if (shouldYieldParser(sourceBytes, row)) await yieldParserTask(signal);
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
    const archive = new ZipArchive(bytes, {
      budget: context.budget,
      guard: getResourceBudgetGuard(context.budget, context.signal),
      signal: context.signal,
    });
    if (!archive.entries.some((entry) => entry.path === "content.json")) {
      return { status: "rejected", error: new ViewerError("FORMAT_UNSUPPORTED", "parse", true) };
    }
    const content = await archive.text("content.json");
    const sheets = arrayField(JSON.parse(content));
    const shapes: DrawingShape[] = [];
    const edges: DiagramEdge[] = [];
    const guard = getResourceBudgetGuard(context.budget, context.signal);
    for (const sheet of sheets) {
      const rootTopic = objectField(sheet)?.rootTopic;
      if (objectField(rootTopic) !== undefined) {
        await visitTopic(
          objectField(rootTopic) ?? {},
          shapes,
          edges,
          guard,
          context.signal,
          content.length,
        );
      }
    }
    const id = stableDocumentId(context.resource.name, bytes);
    let width = 1;
    let height = 1;
    for (const shape of shapes) {
      width = Math.max(width, shape.x + shape.width);
      height = Math.max(height, shape.y + shape.height);
    }
    const model: DrawingScene = {
      schemaVersion: VERSION,
      id,
      kind: "drawing",
      title: documentTitle(context.resource.name),
      width,
      height,
      shapes,
      edges,
    };
    return { status: "complete", model, warnings: [] };
  },
};

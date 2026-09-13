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

import { MiaixzUiError } from "../../../errors/ui-error.js";
import type { GraphEdge, GraphNode } from "./graph.types.js";

/**
 * Minimum supported graph zoom.
 */
export const minimumZoom = 0.5;
/**
 * Maximum supported graph zoom.
 */
export const maximumZoom = 2;
/**
 * One graph zoom increment.
 */
export const zoomStep = 0.25;
/**
 * One graph pan increment as a viewport ratio.
 */
export const panStep = 0.1;
/**
 * Graph node radius in viewBox units.
 */
export const nodeRadius = 7;

/**
 * Graph viewport state.
 */
export interface ViewState {
  /**
   * Current zoom ratio.
   */
  readonly zoom: number;
  /**
   * Horizontal pan offset.
   */
  readonly x: number;
  /**
   * Vertical pan offset.
   */
  readonly y: number;
}

/**
 * Validates graph identifiers, positions, and edge endpoints.
 *
 * @param nodes - Graph nodes.
 * @param edges - Graph edges.
 */
export function validateGraph(nodes: readonly GraphNode[], edges: readonly GraphEdge[]): void {
  const nodeIds = new Set<string>();
  const edgeIds = new Set<string>();
  for (const node of nodes) {
    if (nodeIds.has(node.id)) {
      throw new MiaixzUiError({ code: "UI_GRAPH_DUPLICATE_NODE_ID", details: { id: node.id } });
    }
    if (
      !Number.isFinite(node.x) ||
      !Number.isFinite(node.y) ||
      node.x < 0 ||
      node.x > 100 ||
      node.y < 0 ||
      node.y > 100
    ) {
      throw new MiaixzUiError({
        code: "UI_GRAPH_NODE_POSITION_INVALID",
        details: { id: node.id, x: node.x, y: node.y },
      });
    }
    nodeIds.add(node.id);
  }
  for (const edge of edges) {
    if (edgeIds.has(edge.id)) {
      throw new MiaixzUiError({ code: "UI_GRAPH_DUPLICATE_EDGE_ID", details: { id: edge.id } });
    }
    if (!nodeIds.has(edge.sourceId) || !nodeIds.has(edge.targetId)) {
      throw new MiaixzUiError({
        code: "UI_GRAPH_EDGE_ENDPOINT_MISSING",
        details: { id: edge.id, sourceId: edge.sourceId, targetId: edge.targetId },
      });
    }
    edgeIds.add(edge.id);
  }
}

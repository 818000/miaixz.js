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

import type { GraphNode } from "./graph.types.js";

/**
 * Supported directional exploration keys.
 */
export type DirectionKey = "ArrowRight" | "ArrowLeft" | "ArrowDown" | "ArrowUp";

/**
 * Finds the nearest node in the requested visual direction.
 *
 * @param nodes - Graph nodes in stable order.
 * @param currentIndex - Index of the active node.
 * @param key - Requested visual direction.
 * @returns Best directional candidate or undefined.
 */
export function findDirectionalNode(
  nodes: readonly GraphNode[],
  currentIndex: number,
  key: DirectionKey,
): GraphNode | undefined {
  const current = nodes[currentIndex];
  if (current === undefined) return undefined;
  return nodes
    .map((node, index) => {
      const dx = node.x - current.x;
      const dy = node.y - current.y;
      const primary =
        key === "ArrowRight" ? dx : key === "ArrowLeft" ? -dx : key === "ArrowDown" ? dy : -dy;
      const perpendicular = key === "ArrowRight" || key === "ArrowLeft" ? dy : dx;
      return {
        node,
        index,
        primary,
        angle: Math.atan2(Math.abs(perpendicular), primary),
        distance: Math.hypot(dx, dy),
      };
    })
    .filter(({ index, primary }) => index !== currentIndex && primary > 0)
    .sort(
      (left, right) =>
        left.angle - right.angle || left.distance - right.distance || left.index - right.index,
    )[0]?.node;
}

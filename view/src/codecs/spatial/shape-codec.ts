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
 * Provides format-neutral shape conversion for spatial codecs.
 */

import type { DrawingScene, DrawingShape } from "../../shared/contracts/document.js";

/**
 * Normalizes parsed shapes into a positive drawing viewport.
 *
 * @param title - Safe display title for the drawing.
 * @param id - Stable document identifier.
 * @param shapes - Parsed format-neutral drawing shapes.
 * @returns Drawing scene containing normalized shapes and bounds.
 */
export function createShapeScene(
  title: string,
  id: string,
  shapes: readonly DrawingShape[],
): DrawingScene {
  const minimumX = Math.min(0, ...shapes.map((shape) => shape.x));
  const minimumY = Math.min(0, ...shapes.map((shape) => shape.y));
  const normalized = shapes.map((shape) => ({
    ...shape,
    x: shape.x - minimumX + 10,
    y: shape.y - minimumY + 10,
  }));
  return {
    schemaVersion: 1,
    id,
    kind: "drawing",
    title,
    width: Math.max(100, ...normalized.map((shape) => shape.x + shape.width + 10)),
    height: Math.max(100, ...normalized.map((shape) => shape.y + shape.height + 10)),
    shapes: normalized,
    edges: [],
  };
}

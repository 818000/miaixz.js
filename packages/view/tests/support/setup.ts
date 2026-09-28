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
 * Installs deterministic browser resource stubs used by viewer unit tests.
 */

import "@testing-library/jest-dom/vitest";
import { Blob as NodeBlob, File as NodeFile } from "node:buffer";

let nextObjectUrl = 1;

Object.defineProperty(globalThis, "Blob", { configurable: true, value: NodeBlob });
Object.defineProperty(globalThis, "File", { configurable: true, value: NodeFile });

/**
 * Creates a deterministic object URL for browser-native media tests.
 *
 * @returns Stable test object URL.
 */
function createObjectUrl(): string {
  const value = `blob:viewer-test-${nextObjectUrl}`;
  nextObjectUrl += 1;
  return value;
}

Object.defineProperty(URL, "createObjectURL", { configurable: true, value: createObjectUrl });
Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: (): void => undefined });

/**
 * Performs one inert canvas operation in layout-independent unit tests.
 */
function canvasOperation(): void {}

const canvasContext = {
  beginPath: canvasOperation,
  clip: canvasOperation,
  fillRect: canvasOperation,
  lineTo: canvasOperation,
  moveTo: canvasOperation,
  rect: canvasOperation,
  restore: canvasOperation,
  save: canvasOperation,
  setLineDash: canvasOperation,
  setTransform: canvasOperation,
  stroke: canvasOperation,
} as unknown as CanvasRenderingContext2D;

Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
  configurable: true,
  value: (): CanvasRenderingContext2D => canvasContext,
});

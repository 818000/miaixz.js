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
 * Defines the browser capability baseline used by the preview runtime.
 */

/**
 * Stable platform features required or optionally used by the viewer.
 */
export interface BrowserSupport {
  readonly arrayBuffer: boolean;
  readonly blobUrls: boolean;
  readonly decompressionStream: boolean;
  readonly moduleWorkers: boolean;
  readonly offscreenCanvas: boolean;
  readonly webgl2: boolean;
}

/**
 * Browser contract used by packaging and capability checks.
 */
export const browserBaseline = Object.freeze({
  language: "ES2022",
  modules: true,
  required: ["ArrayBuffer", "Blob", "DOMParser", "fetch", "URL"] as const,
  optional: ["DecompressionStream", "OffscreenCanvas", "WebGL2", "Worker"] as const,
});

/**
 * Detects features without parsing a user-agent string.
 *
 * @param scope - Global object whose browser capabilities are inspected.
 * @returns Stable feature support record for the inspected environment.
 */
export function detectBrowserSupport(scope: typeof globalThis = globalThis): BrowserSupport {
  return {
    arrayBuffer: typeof scope.ArrayBuffer === "function",
    blobUrls: typeof scope.URL?.createObjectURL === "function",
    decompressionStream: typeof scope.DecompressionStream === "function",
    moduleWorkers: typeof scope.Worker === "function",
    offscreenCanvas: typeof scope.OffscreenCanvas === "function",
    webgl2: typeof scope.WebGL2RenderingContext === "function",
  };
}

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
 * Defines the versioned main-thread and worker message protocol.
 */

import { ViewerError } from "../../shared/errors/viewer-error.js";

/**
 * Current main-thread/worker protocol version.
 */
export const WORKER_PROTOCOL_VERSION = 1 as const;

/**
 * Wraps every request sent to a viewer worker.
 */
export interface WorkerRequest<TPayload = unknown> {
  readonly protocolVersion: typeof WORKER_PROTOCOL_VERSION;
  readonly requestId: string;
  readonly documentId: string;
  readonly type: string;
  readonly payload: TPayload;
}

/**
 * Wraps every response emitted by a viewer worker.
 */
export interface WorkerResponse<TPayload = unknown> {
  readonly protocolVersion: typeof WORKER_PROTOCOL_VERSION;
  readonly requestId: string;
  readonly documentId: string;
  readonly status: "error" | "partial" | "progress" | "success";
  readonly payload: TPayload;
}

/**
 * Rejects unknown versions before a payload reaches a parser.
 *
 * @param value - Untrusted protocol version supplied with a worker message.
 */
export function assertWorkerProtocolVersion(value: unknown): asserts value is 1 {
  if (value !== WORKER_PROTOCOL_VERSION) {
    throw new ViewerError("INVALID_CONFIGURATION", "parse");
  }
}

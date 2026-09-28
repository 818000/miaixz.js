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
 * Owns the only production boundary allowed to create the spreadsheet worker.
 */

import type { ParseOutcome, SpreadsheetRenderDocument } from "../shared/contracts/document.js";
import type { DriverContext, ViewerProgress } from "../shared/contracts/driver.js";
import { ViewerError, sanitizeViewerError } from "../shared/errors/viewer-error.js";
import {
  WORKER_PROTOCOL_VERSION,
  assertWorkerProtocolVersion,
  type WorkerRequest,
  type WorkerResponse,
} from "../workers/protocol/worker-protocol.js";
import type {
  SpreadsheetWorkerErrorPayload,
  SpreadsheetWorkerOpenPayload,
  SpreadsheetWorkerResultPayload,
} from "../workers/protocol/spreadsheet-worker-types.js";

let nextSpreadsheetRequest = 1;

/**
 * Recreates a sanitized viewer error from stable worker metadata.
 *
 * @param payload - Structured-clone-safe worker error metadata.
 * @returns Public viewer error with stable recovery information.
 */
function workerError(payload: SpreadsheetWorkerErrorPayload): ViewerError {
  return new ViewerError(
    payload.code,
    payload.stage,
    payload.recoverable,
    undefined,
    payload.resourceLimit,
  );
}

/**
 * Parses a spreadsheet in the dedicated module worker with strict cancellation.
 *
 * @param context - Bounded driver context for the selected workbook.
 * @returns Complete, partial, or rejected spreadsheet outcome.
 */
export async function openSpreadsheetInWorker(
  context: DriverContext,
): Promise<ParseOutcome<SpreadsheetRenderDocument>> {
  if (typeof Worker === "undefined") {
    return { status: "rejected", error: new ViewerError("UNSUPPORTED_RUNTIME", "parse") };
  }
  if (context.signal.aborted) {
    return { status: "rejected", error: new ViewerError("ABORTED", "parse", true) };
  }

  let bytes: Uint8Array;
  try {
    bytes = await context.resource.readAll(context.signal);
  } catch (value) {
    return { status: "rejected", error: sanitizeViewerError(value, "source") };
  }
  const source =
    bytes.buffer instanceof ArrayBuffer &&
    bytes.byteOffset === 0 &&
    bytes.byteLength === bytes.buffer.byteLength
      ? bytes.buffer
      : (bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer);
  const requestId = `xlsx-${nextSpreadsheetRequest}`;
  nextSpreadsheetRequest += 1;
  let worker: Worker;
  try {
    worker = new Worker(new URL("../workers/spreadsheet-worker.js", import.meta.url), {
      type: "module",
      name: "miaixz-xlsx",
    });
  } catch {
    return { status: "rejected", error: new ViewerError("UNSUPPORTED_RUNTIME", "parse") };
  }

  return new Promise((resolve) => {
    let settled = false;
    const finish = (outcome: ParseOutcome<SpreadsheetRenderDocument>): void => {
      if (settled) return;
      settled = true;
      globalThis.clearTimeout(timeout);
      context.signal.removeEventListener("abort", abort);
      worker.terminate();
      resolve(outcome);
    };
    const abort = (): void => {
      const request: WorkerRequest<undefined> = {
        protocolVersion: WORKER_PROTOCOL_VERSION,
        requestId,
        documentId: context.resource.id,
        type: "cancel",
        payload: undefined,
      };
      try {
        worker.postMessage(request);
      } catch {
        void 0;
      }
      finish({ status: "rejected", error: new ViewerError("ABORTED", "parse", true) });
    };
    const timeout = globalThis.setTimeout(() => {
      finish({ status: "rejected", error: new ViewerError("PARSE_STALLED", "parse", true) });
    }, context.budget.maxTaskMilliseconds);

    worker.addEventListener("message", (event: MessageEvent<WorkerResponse<unknown>>) => {
      const response = event.data;
      try {
        assertWorkerProtocolVersion(response.protocolVersion);
      } catch {
        finish({ status: "rejected", error: new ViewerError("INVALID_CONFIGURATION", "parse") });
        return;
      }
      if (response.requestId !== requestId || response.documentId !== context.resource.id) return;
      if (response.status === "progress") {
        if (!settled) context.reportProgress(response.payload as ViewerProgress);
        return;
      }
      const result = response.payload as SpreadsheetWorkerResultPayload;
      if (response.status === "success" && result.status === "complete") {
        finish(result);
        return;
      }
      if (response.status === "partial" && result.status === "partial") {
        finish(result);
        return;
      }
      if (
        (response.status === "rejected" || response.status === "error") &&
        result.status === "rejected"
      ) {
        finish({ status: "rejected", error: workerError(result.error) });
        return;
      }
      finish({ status: "rejected", error: new ViewerError("INVALID_CONFIGURATION", "parse") });
    });
    worker.addEventListener("error", () => {
      finish({ status: "rejected", error: new ViewerError("INTERNAL_UNEXPECTED", "parse") });
    });
    context.signal.addEventListener("abort", abort, { once: true });
    if (context.signal.aborted) {
      abort();
      return;
    }

    const payload: SpreadsheetWorkerOpenPayload = {
      source,
      name: context.resource.name,
      ...(context.resource.mimeType === undefined ? {} : { mimeType: context.resource.mimeType }),
      decision: context.decision,
      budget: context.budget,
    };
    const request: WorkerRequest<SpreadsheetWorkerOpenPayload> = {
      protocolVersion: WORKER_PROTOCOL_VERSION,
      requestId,
      documentId: context.resource.id,
      type: "open",
      payload,
    };
    try {
      worker.postMessage(request, [source]);
    } catch {
      finish({ status: "rejected", error: new ViewerError("INTERNAL_UNEXPECTED", "parse") });
    }
  });
}

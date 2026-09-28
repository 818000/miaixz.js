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
 * Parses XLSX packages without executing Office code or touching the main thread.
 */

import { createOoxmlDriver } from "../codecs/office/ooxml-codec.js";
import type { ViewerProgress } from "../shared/contracts/driver.js";
import type { RandomAccessResource } from "../shared/contracts/source.js";
import { ViewerError, sanitizeViewerError } from "../shared/errors/viewer-error.js";
import {
  WORKER_PROTOCOL_VERSION,
  assertWorkerProtocolVersion,
  type WorkerRequest,
  type WorkerResponse,
} from "./protocol/worker-protocol.js";
import type {
  SpreadsheetWorkerErrorPayload,
  SpreadsheetWorkerOpenPayload,
  SpreadsheetWorkerResultPayload,
} from "./protocol/spreadsheet-worker-types.js";

interface SpreadsheetWorkerScope {
  addEventListener(
    type: "message",
    listener: (event: MessageEvent<WorkerRequest<unknown>>) => void,
  ): void;
  postMessage(message: WorkerResponse<unknown>, transfer?: readonly Transferable[]): void;
}

const scope = globalThis as unknown as SpreadsheetWorkerScope;
const requests = new Map<string, AbortController>();
const driver = createOoxmlDriver("xlsx", "spreadsheet");

/**
 * Converts one public error to its structured-clone-safe representation.
 *
 * @param error - Sanitized viewer error raised in the worker.
 * @returns Structured-clone-safe error metadata.
 */
function errorPayload(
  error: ReturnType<typeof sanitizeViewerError>,
): SpreadsheetWorkerErrorPayload {
  return {
    code: error.code,
    stage: error.stage,
    recoverable: error.recoverable,
    ...(error.resourceLimit === undefined ? {} : { resourceLimit: error.resourceLimit }),
  };
}

/**
 * Posts one protocol response unless its request has already been cancelled.
 *
 * @param request - Source request whose identity is retained.
 * @param status - Protocol response status.
 * @param payload - Structured-clone-safe response payload.
 * @param transfer - Optional ownership-transfer list.
 */
function respond<T>(
  request: WorkerRequest<unknown>,
  status: WorkerResponse<T>["status"],
  payload: T,
  transfer?: readonly Transferable[],
): void {
  if (requests.get(request.requestId)?.signal.aborted === true) return;
  scope.postMessage(
    {
      protocolVersion: WORKER_PROTOCOL_VERSION,
      requestId: request.requestId,
      documentId: request.documentId,
      status,
      payload,
    },
    transfer,
  );
}

/**
 * Creates a bounded immutable resource around the transferred buffer.
 *
 * @param request - Source worker request.
 * @param payload - Workbook bytes and resource policy.
 * @returns Immutable in-worker random-access resource.
 */
function transferredResource(
  request: WorkerRequest<unknown>,
  payload: SpreadsheetWorkerOpenPayload,
): RandomAccessResource {
  const bytes = new Uint8Array(payload.source);
  return {
    id: request.documentId,
    name: payload.name,
    mimeType: payload.mimeType,
    size: bytes.byteLength,
    etag: undefined,
    /**
     * Reads one owned byte range from the transferred source.
     *
     * @param start - Zero-based source offset.
     * @param length - Maximum number of bytes to return.
     * @param signal - Optional cancellation signal.
     * @returns Owned source bytes.
     */
    async read(start, length, signal) {
      signal?.throwIfAborted();
      return bytes.slice(start, Math.min(bytes.byteLength, start + length));
    },
    /**
     * Returns the transferred source after enforcing its size budget.
     *
     * @param signal - Optional cancellation signal.
     * @returns Complete transferred source.
     */
    async readAll(signal) {
      signal?.throwIfAborted();
      if (bytes.byteLength > payload.budget.maxSourceBytes) {
        throw new ViewerError("RESOURCE_LIMIT_EXCEEDED", "source");
      }
      return bytes;
    },
    /**
     * Rejects object URL creation because workbook parsing never needs it.
     *
     * @returns A promise which always rejects.
     */
    async createObjectUrl() {
      throw new Error("object URL is unavailable in the spreadsheet parser");
    },
    /**
     * Releases the no-copy resource facade.
     */
    dispose() {},
  };
}

/**
 * Opens one workbook request and always releases its cancellation state.
 *
 * @param request - Versioned worker request.
 * @param payload - Transferred workbook and parser configuration.
 * @returns Promise settled after the terminal response is sent.
 */
async function open(
  request: WorkerRequest<unknown>,
  payload: SpreadsheetWorkerOpenPayload,
): Promise<void> {
  const controller = new AbortController();
  requests.set(request.requestId, controller);
  try {
    const progress = (value: ViewerProgress): void => respond(request, "progress", value);
    progress({ stage: "opening", indeterminate: true });
    const outcome = await driver.open({
      resource: transferredResource(request, payload),
      decision: payload.decision,
      budget: payload.budget,
      signal: controller.signal,
      reportProgress: progress,
    });
    controller.signal.throwIfAborted();
    const result: SpreadsheetWorkerResultPayload =
      outcome.status === "rejected"
        ? { status: "rejected", error: errorPayload(outcome.error) }
        : (outcome as SpreadsheetWorkerResultPayload);
    const status =
      result.status === "complete"
        ? "success"
        : result.status === "partial"
          ? "partial"
          : "rejected";
    const transfer =
      result.status === "rejected"
        ? []
        : result.model.sheets.flatMap((sheet) => [
            sheet.layout.columnOffsets.buffer,
            sheet.layout.rowOffsets.buffer,
          ]);
    respond(request, status, result, transfer);
  } catch (value) {
    const error = sanitizeViewerError(value, "parse");
    respond(request, error.code === "ABORTED" ? "rejected" : "error", {
      status: "rejected",
      error: errorPayload(error),
    } satisfies SpreadsheetWorkerResultPayload);
  } finally {
    requests.delete(request.requestId);
  }
}

scope.addEventListener("message", (event) => {
  const request = event.data;
  try {
    assertWorkerProtocolVersion(request.protocolVersion);
  } catch (value) {
    const error = sanitizeViewerError(value, "parse");
    scope.postMessage({
      protocolVersion: WORKER_PROTOCOL_VERSION,
      requestId: request.requestId,
      documentId: request.documentId,
      status: "error",
      payload: { status: "rejected", error: errorPayload(error) },
    });
    return;
  }
  if (request.type === "cancel") {
    requests.get(request.requestId)?.abort();
    return;
  }
  if (request.type === "open") {
    void open(request, request.payload as SpreadsheetWorkerOpenPayload);
  }
});

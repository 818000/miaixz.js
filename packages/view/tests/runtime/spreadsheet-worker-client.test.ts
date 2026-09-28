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
 * Verifies the strict XLSX worker boundary, including every terminal path.
 */

import { openSpreadsheetInWorker } from "../../src/runtime/spreadsheet-worker-client.js";
import { defaultResourceBudget } from "../../src/runtime/resource-budget.js";
import type { SpreadsheetRenderDocument } from "../../src/shared/contracts/document.js";
import type { DriverContext, ViewerProgress } from "../../src/shared/contracts/driver.js";
import { ViewerError } from "../../src/shared/errors/viewer-error.js";
import {
  WORKER_PROTOCOL_VERSION,
  type WorkerRequest,
  type WorkerResponse,
} from "../../src/workers/protocol/worker-protocol.js";
import type { SpreadsheetWorkerResultPayload } from "../../src/workers/protocol/spreadsheet-worker-types.js";

const model: SpreadsheetRenderDocument = {
  schemaVersion: 1,
  id: "worker-model",
  kind: "spreadsheet",
  title: "Worker model",
  layoutVersion: 1,
  activeSheetId: "",
  sheets: [],
  drawings: [],
  styles: { cellStyles: [], fontCount: 0, fillCount: 0, borderCount: 0 },
  coverage: { entries: [] },
};

type Responder = (worker: FakeWorker, request: WorkerRequest<unknown>) => void;

/**
 * Ignores one worker request until a scenario installs its responder.
 *
 * @param worker - Worker receiving the ignored request.
 * @param request - Ignored versioned request.
 */
function ignoreRequest(worker: FakeWorker, request: WorkerRequest<unknown>): void {
  void worker;
  void request;
}

/**
 * Provides a deterministic browser Worker test double.
 */
class FakeWorker extends EventTarget {
  static instances: FakeWorker[] = [];
  static responder: Responder = ignoreRequest;
  readonly messages: WorkerRequest<unknown>[] = [];
  readonly transfers: (StructuredSerializeOptions | readonly Transferable[] | undefined)[] = [];
  terminated = false;

  /**
   * Creates and registers one worker test double.
   */
  constructor() {
    super();
    FakeWorker.instances.push(this);
  }

  /**
   * Records one request and its transfer list before invoking the responder.
   *
   * @param message - Versioned request posted by the client.
   * @param transfer - Optional transfer list or serialization options.
   */
  postMessage(
    message: WorkerRequest<unknown>,
    transfer?: StructuredSerializeOptions | readonly Transferable[],
  ): void {
    this.messages.push(message);
    this.transfers.push(transfer);
    FakeWorker.responder(this, message);
  }

  /**
   * Marks this worker as released.
   */
  terminate(): void {
    this.terminated = true;
  }

  /**
   * Emits one worker protocol response through the browser event contract.
   *
   * @param status - Worker response status.
   * @param payload - Structured-clone-safe response payload.
   */
  respond(status: WorkerResponse<unknown>["status"], payload: unknown): void {
    const request = this.messages[0];
    if (request === undefined) return;
    this.dispatchEvent(
      new MessageEvent("message", {
        data: {
          protocolVersion: WORKER_PROTOCOL_VERSION,
          requestId: request.requestId,
          documentId: request.documentId,
          status,
          payload,
        } satisfies WorkerResponse<unknown>,
      }),
    );
  }
}

/**
 * Creates a worker client context with observable progress and cancellation.
 *
 * @param progress - Mutable progress event sink.
 * @param controller - Cancellation controller owned by the test.
 * @returns Bounded XLSX driver context.
 */
function context(
  progress: ViewerProgress[] = [],
  controller = new AbortController(),
): DriverContext {
  const bytes = new Uint8Array([1, 2, 3, 4]);
  return {
    resource: {
      id: "worker-fixture",
      name: "fixture.xlsx",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      size: bytes.length,
      etag: undefined,
      /**
       * Reads one owned fixture byte range.
       *
       * @param start - Zero-based fixture offset.
       * @param length - Maximum bytes returned.
       * @returns Owned fixture bytes.
       */
      async read(start, length) {
        return bytes.slice(start, start + length);
      },
      /**
       * Returns an owned copy of the fixture bytes.
       *
       * @returns Complete fixture bytes.
       */
      async readAll() {
        return bytes.slice();
      },
      /**
       * Returns a deterministic fixture object URL.
       *
       * @returns Fixture object URL.
       */
      async createObjectUrl() {
        return "blob:worker-fixture";
      },
      /**
       * Releases the inert fixture resource.
       */
      dispose() {},
    },
    decision: {
      extension: "xlsx",
      driver: "xlsx",
      confidence: 1,
      evidence: [],
      conflicts: [],
    },
    budget: defaultResourceBudget,
    signal: controller.signal,
    /**
     * Records one progress event.
     *
     * @param value - Progress event emitted by the client.
     */
    reportProgress(value) {
      progress.push(value);
    },
  };
}

/**
 * Installs a fresh worker test double for one scenario.
 *
 * @param responder - Request responder used by the scenario.
 */
function installWorker(responder: Responder): void {
  FakeWorker.instances = [];
  FakeWorker.responder = responder;
  vi.stubGlobal("Worker", FakeWorker as unknown as typeof Worker);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("spreadsheet worker client", () => {
  it("rejects XLSX when the module Worker runtime is unavailable", async () => {
    vi.stubGlobal("Worker", undefined);
    const outcome = await openSpreadsheetInWorker(context());
    expect(outcome.status).toBe("rejected");
    if (outcome.status === "rejected") expect(outcome.error.code).toBe("UNSUPPORTED_RUNTIME");
  });

  it("sanitizes source failures and pre-start cancellation before creating a worker", async () => {
    installWorker(() => undefined);
    const source = context();
    const failed = await openSpreadsheetInWorker({
      ...source,
      resource: {
        ...source.resource,
        /**
         * Rejects the fixture read with a sanitized source error.
         *
         * @returns A promise which always rejects.
         */
        async readAll() {
          throw new ViewerError("PARSE_FAILED", "source");
        },
      },
    });
    expect(failed).toMatchObject({ status: "rejected", error: { code: "PARSE_FAILED" } });
    const controller = new AbortController();
    controller.abort();
    const aborted = await openSpreadsheetInWorker(context([], controller));
    expect(aborted).toMatchObject({ status: "rejected", error: { code: "ABORTED" } });
    expect(FakeWorker.instances).toHaveLength(0);
  });

  it("transfers the source, forwards progress, and returns complete models", async () => {
    const progress: ViewerProgress[] = [];
    installWorker((worker) => {
      queueMicrotask(() => {
        worker.respond("progress", { stage: "parsing", indeterminate: true });
        worker.respond("success", { status: "complete", model, warnings: [] });
      });
    });
    const outcome = await openSpreadsheetInWorker(context(progress));
    expect(outcome.status).toBe("complete");
    expect(progress).toEqual([{ stage: "parsing", indeterminate: true }]);
    expect(FakeWorker.instances[0]?.transfers[0]).toHaveLength(1);
    expect(FakeWorker.instances[0]?.terminated).toBe(true);
  });

  it("returns partial and rejected outcomes without changing their status", async () => {
    const outcomes: SpreadsheetWorkerResultPayload[] = [
      {
        status: "partial",
        model,
        warnings: [],
        skipped: [{ code: "XLSX_DRAWING_SKIPPED", count: 1 }],
      },
      {
        status: "rejected",
        error: {
          code: "RESOURCE_LIMIT_EXCEEDED",
          stage: "parse",
          recoverable: false,
          resourceLimit: { field: "maxSpreadsheetCells", actual: 2, allowed: 1 },
        },
      },
    ];
    for (const expected of outcomes) {
      installWorker((worker) => {
        queueMicrotask(() => {
          worker.respond(expected.status === "complete" ? "success" : expected.status, expected);
        });
      });
      const outcome = await openSpreadsheetInWorker(context());
      expect(outcome.status).toBe(expected.status);
      if (outcome.status === "rejected") {
        expect(outcome.error.resourceLimit).toEqual({
          field: "maxSpreadsheetCells",
          actual: 2,
          allowed: 1,
        });
      }
    }
  });

  it("sanitizes worker crashes and terminates the worker", async () => {
    installWorker((worker) => {
      queueMicrotask(() => worker.dispatchEvent(new Event("error")));
    });
    const outcome = await openSpreadsheetInWorker(context());
    expect(outcome.status).toBe("rejected");
    if (outcome.status === "rejected") expect(outcome.error.code).toBe("INTERNAL_UNEXPECTED");
    expect(FakeWorker.instances[0]?.terminated).toBe(true);
  });

  it("posts cancellation, stops accepting results, and releases the worker", async () => {
    const controller = new AbortController();
    installWorker(() => undefined);
    const pending = openSpreadsheetInWorker(context([], controller));
    await Promise.resolve();
    controller.abort();
    const outcome = await pending;
    expect(outcome.status).toBe("rejected");
    if (outcome.status === "rejected") expect(outcome.error.code).toBe("ABORTED");
    expect(FakeWorker.instances[0]?.messages.map((message) => message.type)).toEqual([
      "open",
      "cancel",
    ]);
    expect(FakeWorker.instances[0]?.terminated).toBe(true);
  });
});

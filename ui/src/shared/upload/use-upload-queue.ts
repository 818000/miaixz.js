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

/* eslint-disable jsdoc/require-jsdoc -- Closed upload state records are self-describing.
 */
/* eslint-disable react-hooks/refs -- Refs mirror queue state for asynchronous request callbacks.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { MiaixzUiError } from "../../errors/ui-error.js";
import type {
  LocalUploadFileRecord,
  MiaixzUploadContext,
  UploadFileRecord,
  UploadQueueController,
  UploadRetryPolicy,
  UseUploadQueueOptions,
} from "./types.js";

/**
 * Owns the only upload scheduler, retry state, abort controllers, and progress state.
 *
 * @param options - Queue state, request callbacks, and scheduler configuration.
 * @returns The current immutable records and queue transitions.
 */
export function useUploadQueue(options: UseUploadQueueOptions): UploadQueueController {
  validateQueueConfiguration(options.concurrency, options.retryPolicy);
  const controlled = options.files !== undefined;
  const [records, setRecords] = useState<readonly UploadFileRecord[]>(() => {
    const initial = options.files ?? options.defaultFiles ?? [];
    validateUploadRecords(initial, true, new Set());
    return Object.freeze([...initial]);
  });
  const currentRecords = controlled ? options.files : records;
  const recordsRef = useRef(currentRecords);
  const mountedRef = useRef(true);
  const controllersRef = useRef(new Map<string, AbortController>());
  const retryCountsRef = useRef(new Map<string, number>());
  const retryTimersRef = useRef(new Map<string, number>());
  const completedRef = useRef(new Set<string>());
  const initialRenderRef = useRef(true);
  recordsRef.current = currentRecords;
  validateUploadRecords(
    currentRecords,
    initialRenderRef.current,
    new Set(controllersRef.current.keys()),
  );
  initialRenderRef.current = false;

  const callbacksRef = useRef(options);
  callbacksRef.current = options;

  const commit = useCallback(
    (next: readonly UploadFileRecord[]): void => {
      const frozen = Object.freeze([...next]);
      validateUploadRecords(frozen, false, new Set(controllersRef.current.keys()));
      recordsRef.current = frozen;
      if (!controlled) setRecords(frozen);
      callbacksRef.current.onFilesChange?.(frozen);
    },
    [controlled],
  );

  const update = useCallback(
    (id: string, transform: (record: UploadFileRecord) => UploadFileRecord): void => {
      const current = recordsRef.current;
      const index = current.findIndex((record) => record.id === id);
      if (index < 0) return;
      const next = [...current];
      next[index] = transform(current[index]!);
      if (next[index] === current[index]) return;
      commit(next);
    },
    [commit],
  );

  const runAttempt = useCallback(
    async (record: LocalUploadFileRecord): Promise<void> => {
      const controller = new AbortController();
      controllersRef.current.set(record.id, controller);
      update(record.id, (current) => {
        if (!isLocalRecord(current)) return current;
        return { ...current, status: "uploading", progress: current.progress };
      });
      const context: MiaixzUploadContext = Object.freeze({
        signal: controller.signal,
        reportProgress(value: number) {
          if (!Number.isFinite(value) || value < 0 || value > 100) {
            throw new MiaixzUiError({
              code: "UI_UPLOAD_PROGRESS_INVALID",
              details: { value },
            });
          }
          if (controller.signal.aborted || !mountedRef.current) return;
          update(record.id, (current) => {
            if (!isLocalRecord(current) || current.status !== "uploading") return current;
            return { ...current, progress: value };
          });
        },
      });
      try {
        await callbacksRef.current.upload(record.source.file, context);
        if (controller.signal.aborted || !mountedRef.current) return;
        controllersRef.current.delete(record.id);
        retryCountsRef.current.delete(record.id);
        update(record.id, (current) => {
          if (!isLocalRecord(current)) return current;
          return { ...current, status: "succeeded", progress: 100 };
        });
        if (!completedRef.current.has(record.id)) {
          completedRef.current.add(record.id);
          callbacksRef.current.onComplete(record.source.file);
        }
      } catch (error) {
        if (controller.signal.aborted || isAbortError(error) || !mountedRef.current) return;
        controllersRef.current.delete(record.id);
        const policy = callbacksRef.current.retryPolicy;
        const retryIndex = (retryCountsRef.current.get(record.id) ?? 0) + 1;
        const retryAllowed =
          retryIndex <= policy.maxRetries && (policy.shouldRetry?.(error) ?? true);
        if (retryAllowed) {
          const delay =
            typeof policy.delayMs === "function"
              ? policy.delayMs(retryIndex, error)
              : policy.delayMs;
          validateRetryDelay(delay);
          retryCountsRef.current.set(record.id, retryIndex);
          update(record.id, (current) => {
            if (!isLocalRecord(current)) return current;
            return { ...current, status: "queued", progress: 0 };
          });
          const timer = window.setTimeout(() => {
            retryTimersRef.current.delete(record.id);
            if (mountedRef.current) commit([...recordsRef.current]);
          }, delay);
          retryTimersRef.current.set(record.id, timer);
        } else {
          retryCountsRef.current.delete(record.id);
          update(record.id, (current) => {
            if (!isLocalRecord(current)) return current;
            return { ...current, status: "failed" };
          });
          callbacksRef.current.onError(record.source.file, error);
        }
      } finally {
        if (controllersRef.current.get(record.id) === controller) {
          controllersRef.current.delete(record.id);
        }
      }
    },
    [commit, update],
  );

  useEffect(() => {
    const available = options.concurrency - controllersRef.current.size;
    if (available <= 0) return;
    const queued = recordsRef.current.filter(
      (record): record is LocalUploadFileRecord =>
        record.source.kind === "local" &&
        record.status === "queued" &&
        !controllersRef.current.has(record.id) &&
        !retryTimersRef.current.has(record.id),
    );
    for (const record of queued.slice(0, available)) void runAttempt(record);
  }, [currentRecords, options.concurrency, runAttempt]);

  useEffect(() => {
    const controllers = controllersRef.current;
    const retryTimers = retryTimersRef.current;
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      for (const controller of controllers.values()) controller.abort();
      controllers.clear();
      for (const timer of retryTimers.values()) window.clearTimeout(timer);
      retryTimers.clear();
    };
  }, []);

  const add = useCallback(
    (files: readonly File[]): void => {
      if (files.length === 0) return;
      const additions: LocalUploadFileRecord[] = files.map((file) => ({
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        lastModified: file.lastModified,
        source: { kind: "local", file },
        status: "queued",
        progress: 0,
      }));
      commit([...recordsRef.current, ...additions]);
    },
    [commit],
  );
  const retry = useCallback(
    (id: string): void => {
      retryCountsRef.current.delete(id);
      completedRef.current.delete(id);
      update(id, (record) => {
        if (!isLocalRecord(record) || record.status !== "failed") return record;
        return { ...record, status: "queued", progress: 0 };
      });
    },
    [update],
  );
  const remove = useCallback(
    (id: string): void => {
      controllersRef.current.get(id)?.abort();
      controllersRef.current.delete(id);
      const timer = retryTimersRef.current.get(id);
      if (timer !== undefined) window.clearTimeout(timer);
      retryTimersRef.current.delete(id);
      retryCountsRef.current.delete(id);
      completedRef.current.delete(id);
      commit(recordsRef.current.filter((record) => record.id !== id));
    },
    [commit],
  );
  return {
    files: currentRecords,
    add,
    retry,
    remove,
  };
}

export function validateUploadRecords(
  records: readonly UploadFileRecord[],
  initial: boolean,
  activeIds: ReadonlySet<string>,
): void {
  const ids = new Set<string>();
  for (const record of records) {
    const id = record.id.trim();
    if (id.length === 0) throwFileStateError(record.id);
    if (ids.has(id)) {
      throw new MiaixzUiError({
        code: "UI_UPLOAD_DUPLICATE_FILE_ID",
      });
    }
    ids.add(id);
    if (
      record.name.trim().length === 0 ||
      !Number.isInteger(record.size) ||
      record.size < 0 ||
      (record.lastModified !== undefined &&
        (!Number.isInteger(record.lastModified) || record.lastModified < 0))
    ) {
      throwFileStateError(record.id);
    }
    if (record.source.kind === "remote") {
      if (record.status !== "succeeded" || record.progress !== 100) throwFileStateError(record.id);
      continue;
    }
    if (
      record.name !== record.source.file.name ||
      record.size !== record.source.file.size ||
      (record.lastModified !== undefined &&
        record.lastModified !== record.source.file.lastModified) ||
      !Number.isFinite(record.progress) ||
      record.progress < 0 ||
      record.progress > 100 ||
      (record.status === "queued" && record.progress !== 0) ||
      (record.status === "succeeded" && record.progress !== 100) ||
      (record.status === "uploading" && (initial || !activeIds.has(record.id)))
    ) {
      throwFileStateError(record.id);
    }
  }
}

function validateQueueConfiguration(concurrency: number, retryPolicy: UploadRetryPolicy): void {
  if (!Number.isInteger(concurrency) || concurrency <= 0) {
    throw new MiaixzUiError({
      code: "UI_UPLOAD_CONCURRENCY_INVALID",
      details: { concurrency },
    });
  }
  if (!Number.isInteger(retryPolicy.maxRetries) || retryPolicy.maxRetries < 0) {
    throw new MiaixzUiError({
      code: "UI_UPLOAD_RETRY_POLICY_INVALID",
    });
  }
  if (typeof retryPolicy.delayMs === "number") validateRetryDelay(retryPolicy.delayMs);
}

function validateRetryDelay(delay: number): void {
  if (!Number.isFinite(delay) || delay < 0) {
    throw new MiaixzUiError({
      code: "UI_UPLOAD_RETRY_POLICY_INVALID",
      details: { delayMs: delay },
    });
  }
}

function throwFileStateError(id: string): never {
  throw new MiaixzUiError({
    code: "UI_UPLOAD_FILE_STATE_INVALID",
    details: { id },
  });
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function isLocalRecord(record: UploadFileRecord): record is LocalUploadFileRecord {
  return record.source.kind === "local";
}

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
 * Coordinates file-source opening, driver selection, and document lifecycle.
 */

import { detectFormat } from "./detect-format.js";
import type { ParseOutcome, ViewerDocument } from "../shared/contracts/document.js";
import type { ViewerProgress } from "../shared/contracts/driver.js";
import type { FormatDecision } from "../shared/contracts/format.js";
import type { ResourceBudget } from "../shared/contracts/resource-budget.js";
import type {
  FileResourceProvider,
  FileViewSource,
  FileViewSourceDescriptor,
  RandomAccessResource,
} from "../shared/contracts/source.js";
import { ViewerError, sanitizeViewerError } from "../shared/errors/viewer-error.js";
import { createDefaultRegistry } from "./default-registry.js";
import type { DriverRegistry } from "./driver-registry.js";
import { DefaultFileResourceProvider } from "./file-source.js";
import { defaultResourceBudget, resolveResourceBudget } from "./resource-budget.js";

/**
 * Configures one controller-owned document session.
 */
export interface OpenDocumentOptions {
  readonly budget?: Partial<ResourceBudget>;
  readonly registry?: DriverRegistry;
  readonly signal?: AbortSignal;
  readonly onProgress?: (progress: ViewerProgress) => void;
  readonly resourceProvider?: FileResourceProvider;
}

/**
 * Represents one opened document and all resources tied to it.
 */
export interface OpenedDocument {
  readonly decision: FormatDecision;
  readonly outcome: ParseOutcome;
  dispose(): void;
}

/**
 * Extracts non-sensitive detection metadata from a public file source.
 *
 * @param source - Public source or source descriptor being opened.
 * @returns Optional filename and MIME type used as format evidence.
 */
function sourceMetadata(source: FileViewSource | FileViewSourceDescriptor): {
  readonly name?: string;
  readonly mimeType?: string;
} {
  if (typeof source === "object" && source !== null && "data" in source) {
    return {
      ...(source.name === undefined ? {} : { name: source.name }),
      ...(source.mimeType === undefined ? {} : { mimeType: source.mimeType }),
    };
  }
  if (typeof source === "string" || source instanceof URL) return { name: source.toString() };
  if (typeof File !== "undefined" && source instanceof File) {
    return { name: source.name, ...(source.type === "" ? {} : { mimeType: source.type }) };
  }
  if (source instanceof Blob && source.type !== "") return { mimeType: source.type };
  return {};
}

/**
 * Opens one source through detection and its unique lazy driver.
 *
 * @param source - Public file source or descriptor to open.
 * @param options - Registry, budget, cancellation, progress, and resource-provider options.
 * @returns Opened document session that owns its resolved resources.
 */
export async function openViewerDocument(
  source: FileViewSource | FileViewSourceDescriptor,
  options: OpenDocumentOptions = {},
): Promise<OpenedDocument> {
  const budget = resolveResourceBudget(options.budget);
  const abortController = new AbortController();
  const abort = (): void => abortController.abort();
  options.signal?.addEventListener("abort", abort, { once: true });
  const provider: FileResourceProvider =
    options.resourceProvider ?? new DefaultFileResourceProvider(budget);
  let resource: RandomAccessResource | undefined;
  let handedOff = false;
  try {
    resource = await provider.open(source, abortController.signal);
    const openedResource = resource;
    options.onProgress?.({ stage: "opening", indeterminate: true });
    const metadata = sourceMetadata(source);
    const prefix = await openedResource.read(0, budget.maxProbeBytes, abortController.signal);
    options.onProgress?.({ stage: "detecting", indeterminate: true });
    const registry = options.registry ?? createDefaultRegistry();
    const decision = detectFormat(
      metadata.name ?? openedResource.name,
      metadata.mimeType ?? openedResource.mimeType,
      prefix,
      registry.getFormatDescriptors(),
    );
    if (decision.driver === undefined) throw new ViewerError("FORMAT_UNSUPPORTED", "detect", true);
    if (decision.conflicts.length > 0) throw new ViewerError("FORMAT_AMBIGUOUS", "detect", true);
    const driver = await registry.load(decision.driver);
    const outcome = await driver.open({
      resource: openedResource,
      decision,
      budget,
      signal: abortController.signal,
      reportProgress: (progress) => options.onProgress?.(progress),
      ...(provider.resolveRelated === undefined
        ? {}
        : {
            resolveRelated: (request, signal = abortController.signal) =>
              provider.resolveRelated?.(request, signal) ?? Promise.resolve(undefined),
          }),
    });
    handedOff = true;
    let disposed = false;
    return {
      decision,
      outcome,
      /**
       * Releases resources and listeners owned by the opened document session.
       */
      dispose() {
        if (disposed) return;
        disposed = true;
        abortController.abort();
        openedResource.dispose();
        options.signal?.removeEventListener("abort", abort);
      },
    };
  } catch (error) {
    if (!handedOff) resource?.dispose();
    options.signal?.removeEventListener("abort", abort);
    throw sanitizeViewerError(error, "parse");
  }
}

/**
 * Describes controller state emitted to framework adapters.
 */
export type ViewerControllerState =
  | { readonly status: "idle" }
  | { readonly status: "loading"; readonly progress: ViewerProgress }
  | {
      readonly status: "ready";
      readonly document: ViewerDocument;
      readonly outcome: Exclude<ParseOutcome, { readonly status: "rejected" }>;
      readonly decision: FormatDecision;
    }
  | { readonly status: "error"; readonly error: ViewerError };

/**
 * Coordinates document replacement, cancellation, subscriptions, and disposal.
 */
export class ViewerController {
  readonly #listeners = new Set<(state: ViewerControllerState) => void>();
  readonly #registry: DriverRegistry;
  readonly #budget: ResourceBudget;
  readonly #resourceProvider: FileResourceProvider | undefined;
  #state: ViewerControllerState = { status: "idle" };
  #opened?: OpenedDocument;
  #abortController?: AbortController;
  #disposed = false;

  /**
   * Creates a controller with optional shared registry and tightened limits.
   *
   * @param options - Optional registry, resource limits, and source provider.
   */
  constructor(
    options: {
      readonly registry?: DriverRegistry;
      readonly budget?: Partial<ResourceBudget>;
      readonly resourceProvider?: FileResourceProvider;
    } = {},
  ) {
    this.#registry = options.registry ?? createDefaultRegistry();
    this.#budget = resolveResourceBudget(options.budget ?? defaultResourceBudget);
    this.#resourceProvider = options.resourceProvider;
  }

  /**
   * Returns the latest immutable controller state.
   *
   * @returns Latest controller state snapshot.
   */
  getState(): ViewerControllerState {
    return this.#state;
  }

  /**
   * Subscribes to state changes and returns an idempotent unsubscribe callback.
   *
   * @param listener - Observer invoked after each state transition.
   * @returns Callback that removes the observer when invoked.
   */
  subscribe(listener: (state: ViewerControllerState) => void): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  /**
   * Replaces the current document, cancelling and disposing the prior session.
   *
   * @param source - Public file source or descriptor replacing the active document.
   */
  async open(source: FileViewSource | FileViewSourceDescriptor): Promise<void> {
    if (this.#disposed) throw new ViewerError("DOCUMENT_DISPOSED", "source");
    this.#abortController?.abort();
    this.#opened?.dispose();
    const abortController = new AbortController();
    this.#abortController = abortController;
    this.#setState({
      status: "loading",
      progress: { stage: "opening", indeterminate: true },
    });
    try {
      const opened = await openViewerDocument(source, {
        registry: this.#registry,
        budget: this.#budget,
        signal: abortController.signal,
        onProgress: (progress) => {
          if (this.#abortController === abortController)
            this.#setState({ status: "loading", progress });
        },
        ...(this.#resourceProvider === undefined
          ? {}
          : { resourceProvider: this.#resourceProvider }),
      });
      if (this.#abortController !== abortController || this.#disposed) {
        opened.dispose();
        return;
      }
      this.#opened = opened;
      if (opened.outcome.status === "rejected") {
        this.#setState({ status: "error", error: opened.outcome.error });
        return;
      }
      this.#setState({
        status: "ready",
        document: opened.outcome.model,
        outcome: opened.outcome,
        decision: opened.decision,
      });
    } catch (error) {
      if (abortController.signal.aborted || this.#disposed) return;
      this.#setState({ status: "error", error: sanitizeViewerError(error, "parse") });
    }
  }

  /**
   * Releases the active source and prevents future operations.
   */
  dispose(): void {
    if (this.#disposed) return;
    this.#disposed = true;
    this.#abortController?.abort();
    this.#opened?.dispose();
    this.#listeners.clear();
  }

  /**
   * Stores and broadcasts one controller state transition.
   *
   * @param state - Immutable state snapshot delivered to subscribers.
   */
  #setState(state: ViewerControllerState): void {
    this.#state = state;
    for (const listener of this.#listeners) listener(state);
  }
}

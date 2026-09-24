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
 * Implements bounded local and remote file-source resources.
 */

import type {
  FileResourceProvider,
  FileViewSource,
  FileViewSourceDescriptor,
  RandomAccessResource,
  RelatedResourceRequest,
  RemoteFileSource,
} from "../shared/contracts/source.js";
import { ViewerError } from "../shared/errors/viewer-error.js";
import type { ResourceBudget } from "./resource-budget.js";

export type {
  FileResourceProvider,
  FileViewSource,
  FileViewSourceDescriptor,
  RandomAccessResource,
  RelatedResourceRequest,
  RemoteFileSource,
} from "../shared/contracts/source.js";

let nextResourceId = 1;

/**
 * Allocates a process-local resource identifier without exposing source data.
 *
 * @returns Unique resource identifier for the current module instance.
 */
function resourceId(): string {
  const id = `resource-${nextResourceId}`;
  nextResourceId += 1;
  return id;
}

/**
 * Validates one random-access byte range before reading source data.
 *
 * @param start - Zero-based byte offset at which reading begins.
 * @param length - Number of bytes requested from the source.
 */
function assertRange(start: number, length: number): void {
  if (!Number.isSafeInteger(start) || start < 0 || !Number.isSafeInteger(length) || length < 0) {
    throw new ViewerError("INVALID_SOURCE", "source");
  }
}

/**
 * Produces an owned copy of a byte sequence.
 *
 * @param bytes - Source bytes that must not be retained by reference.
 * @returns Independent byte sequence containing the same values.
 */
function copyBytes(bytes: Uint8Array): Uint8Array {
  return bytes.slice();
}

/**
 * Narrows an unknown array-buffer view to an unsigned byte array.
 *
 * @param value - Unknown value supplied through the public source contract.
 * @returns True when the value is an unsigned byte array.
 */
function isUint8Array(value: unknown): value is Uint8Array {
  return (
    ArrayBuffer.isView(value) &&
    "BYTES_PER_ELEMENT" in value &&
    value.BYTES_PER_ELEMENT === Uint8Array.BYTES_PER_ELEMENT
  );
}

/**
 * Owns an immutable in-memory source and its optional browser object URL.
 */
class MemoryResource implements RandomAccessResource {
  readonly id = resourceId();
  readonly name: string;
  readonly mimeType: string | undefined;
  readonly etag: string | undefined = undefined;
  readonly size: number;
  readonly #blob: Blob;
  readonly #budget: ResourceBudget;
  #objectUrl: string | undefined;
  #disposed = false;

  /**
   * Creates a bounded resource over an owned blob.
   *
   * @param blob - Blob containing the resource bytes.
   * @param budget - Security limits applied to complete reads.
   * @param name - Optional display name for the source.
   * @param mimeType - Optional trusted MIME hint supplied by the host.
   */
  constructor(blob: Blob, budget: ResourceBudget, name?: string, mimeType?: string) {
    this.#blob = blob;
    this.#budget = budget;
    this.size = blob.size;
    this.name = name ?? "unnamed";
    const resolvedMime = mimeType || blob.type || undefined;
    this.mimeType = resolvedMime;
  }

  /**
   * Reads an owned copy of one bounded byte range.
   *
   * @param start - Zero-based byte offset at which reading begins.
   * @param length - Maximum number of bytes returned.
   * @param signal - Optional cancellation signal for the read.
   * @returns Owned bytes from the requested range.
   */
  async read(start: number, length: number, signal?: AbortSignal): Promise<Uint8Array> {
    this.#assertActive(signal);
    assertRange(start, length);
    const end = Math.min(this.size, start + length);
    const bytes = new Uint8Array(await this.#blob.slice(start, end).arrayBuffer());
    this.#assertActive(signal);
    return bytes;
  }

  /**
   * Reads all source bytes after enforcing the session limit.
   *
   * @param signal - Optional cancellation signal for the read.
   * @returns Owned complete source bytes.
   */
  async readAll(signal?: AbortSignal): Promise<Uint8Array> {
    this.#assertActive(signal);
    if (this.size > this.#budget.maxSourceBytes) {
      throw new ViewerError("RESOURCE_LIMIT_EXCEEDED", "source");
    }
    const bytes = new Uint8Array(await this.#blob.arrayBuffer());
    this.#assertActive(signal);
    return bytes;
  }

  /**
   * Creates or reuses the browser object URL owned by this resource.
   *
   * @returns Object URL for browser-native rendering.
   */
  async createObjectUrl(): Promise<string> {
    this.#assertActive();
    this.#objectUrl ??= URL.createObjectURL(this.#blob);
    return this.#objectUrl;
  }

  /**
   * Revokes the owned object URL and prevents further resource access.
   */
  dispose(): void {
    if (this.#objectUrl !== undefined) URL.revokeObjectURL(this.#objectUrl);
    this.#objectUrl = undefined;
    this.#disposed = true;
  }

  /**
   * Rejects reads after disposal and propagates caller cancellation.
   *
   * @param signal - Optional cancellation signal associated with the operation.
   */
  #assertActive(signal?: AbortSignal): void {
    if (this.#disposed) throw new ViewerError("DOCUMENT_DISPOSED", "source");
    signal?.throwIfAborted();
  }
}

/**
 * Lazily downloads and owns a bounded remote resource.
 */
class RemoteResource implements RandomAccessResource {
  readonly id = resourceId();
  readonly name: string;
  readonly mimeType: string | undefined;
  readonly #url: URL;
  readonly #headers: Readonly<Record<string, string>>;
  readonly #credentials: RequestCredentials;
  readonly #budget: ResourceBudget;
  readonly #declaredSize: number | undefined;
  readonly #declaredEtag: string | undefined;
  #loaded?: MemoryResource;
  #responseEtag?: string;
  #disposed = false;

  /**
   * Creates a remote source descriptor without starting network activity.
   *
   * @param url - Validated HTTP, HTTPS, or blob URL.
   * @param budget - Security limits applied to the eventual response.
   * @param options - Host-controlled metadata and request options.
   */
  constructor(url: URL, budget: ResourceBudget, options: Omit<FileViewSourceDescriptor, "data">) {
    this.#url = url;
    this.#budget = budget;
    this.#headers = options.headers ?? {};
    this.#credentials = options.credentials ?? "same-origin";
    this.name = options.name ?? url.pathname.split("/").at(-1) ?? "unnamed";
    this.#declaredSize = options.size;
    this.#declaredEtag = options.etag;
    if (options.mimeType !== undefined) this.mimeType = options.mimeType;
  }

  /**
   * Reports the loaded size or the host-declared size before loading.
   *
   * @returns Known source size, or undefined when no size is available.
   */
  get size(): number | undefined {
    return this.#loaded?.size ?? this.#declaredSize;
  }

  /**
   * Reports the response entity tag or its host-declared fallback.
   *
   * @returns Known entity tag, or undefined when none is available.
   */
  get etag(): string | undefined {
    return this.#responseEtag ?? this.#declaredEtag;
  }

  /**
   * Loads the source when necessary and reads one bounded byte range.
   *
   * @param start - Zero-based byte offset at which reading begins.
   * @param length - Maximum number of bytes returned.
   * @param signal - Optional cancellation signal for loading and reading.
   * @returns Owned bytes from the requested range.
   */
  async read(start: number, length: number, signal?: AbortSignal): Promise<Uint8Array> {
    assertRange(start, length);
    const resource = await this.#load(signal);
    return resource.read(start, length, signal);
  }

  /**
   * Loads and returns all source bytes within the configured budget.
   *
   * @param signal - Optional cancellation signal for loading and reading.
   * @returns Owned complete source bytes.
   */
  async readAll(signal?: AbortSignal): Promise<Uint8Array> {
    return (await this.#load(signal)).readAll(signal);
  }

  /**
   * Loads the source and returns its owned browser object URL.
   *
   * @returns Object URL for browser-native rendering.
   */
  async createObjectUrl(): Promise<string> {
    return (await this.#load()).createObjectUrl();
  }

  /**
   * Disposes loaded bytes and prevents future network access.
   */
  dispose(): void {
    this.#loaded?.dispose();
    this.#disposed = true;
  }

  /**
   * Downloads the source once and validates response limits before caching it.
   *
   * @param signal - Optional cancellation signal for the network request.
   * @returns Cached in-memory resource for the validated response.
   */
  async #load(signal?: AbortSignal): Promise<MemoryResource> {
    if (this.#disposed) throw new ViewerError("DOCUMENT_DISPOSED", "source");
    signal?.throwIfAborted();
    if (this.#loaded !== undefined) return this.#loaded;
    let response: Response;
    try {
      response = await fetch(this.#url, {
        headers: this.#headers,
        credentials: this.#credentials,
        ...(signal === undefined ? {} : { signal }),
      });
    } catch (error) {
      if (signal?.aborted === true) throw error;
      throw new ViewerError("NETWORK_FAILED", "source", true);
    }
    if (!response.ok) throw new ViewerError("NETWORK_FAILED", "source", true);
    const declaredLength = Number(response.headers.get("content-length"));
    if (Number.isFinite(declaredLength) && declaredLength > this.#budget.maxSourceBytes) {
      throw new ViewerError("RESOURCE_LIMIT_EXCEEDED", "source");
    }
    const blob = await response.blob();
    if (blob.size > this.#budget.maxSourceBytes) {
      throw new ViewerError("RESOURCE_LIMIT_EXCEEDED", "source");
    }
    const responseEtag = response.headers.get("etag");
    if (responseEtag !== null) this.#responseEtag = responseEtag;
    this.#loaded = new MemoryResource(
      blob,
      this.#budget,
      this.name,
      this.mimeType ?? response.headers.get("content-type") ?? undefined,
    );
    return this.#loaded;
  }
}

/**
 * Narrows an unknown public value to a remote source descriptor.
 *
 * @param value - Unknown value supplied through the source contract.
 * @returns True when the value contains a remote URL descriptor.
 */
function isRemoteFileSource(value: unknown): value is RemoteFileSource {
  return typeof value === "object" && value !== null && "url" in value;
}

/**
 * Merges nested remote metadata into one normalized source descriptor.
 *
 * @param source - Public source value or explicit descriptor.
 * @returns Normalized descriptor with host options taking precedence.
 */
function normalizeDescriptor(
  source: FileViewSource | FileViewSourceDescriptor,
): FileViewSourceDescriptor {
  const outer =
    typeof source === "object" && source !== null && "data" in source ? source : { data: source };
  if (!isRemoteFileSource(outer.data)) return outer;
  const remote = outer.data;
  const name = outer.name ?? remote.name;
  const mimeType = outer.mimeType ?? remote.mimeType;
  const size = outer.size ?? remote.size;
  const etag = outer.etag ?? remote.etag;
  const headers = outer.headers ?? remote.headers;
  return {
    data: remote.url,
    ...(name === undefined ? {} : { name }),
    ...(mimeType === undefined ? {} : { mimeType }),
    ...(size === undefined ? {} : { size }),
    ...(etag === undefined ? {} : { etag }),
    ...(headers === undefined ? {} : { headers }),
    credentials: outer.credentials ?? (remote.withCredentials === true ? "include" : "same-origin"),
  };
}

/**
 * Normalizes a public source into one owned resource.
 *
 * @param source - Public local or remote source value.
 * @param budget - Security limits enforced by the returned resource.
 * @returns Owned random-access resource for the normalized source.
 */
export function openFileSource(
  source: FileViewSource | FileViewSourceDescriptor,
  budget: ResourceBudget,
): RandomAccessResource {
  const descriptor = normalizeDescriptor(source);
  const { data } = descriptor;
  if (typeof data === "string" || data instanceof URL) {
    let url: URL;
    try {
      url = data instanceof URL ? data : new URL(data, globalThis.location?.href);
    } catch {
      throw new ViewerError("INVALID_SOURCE", "source");
    }
    if (url.protocol !== "http:" && url.protocol !== "https:" && url.protocol !== "blob:") {
      throw new ViewerError("INVALID_SOURCE", "source");
    }
    return new RemoteResource(url, budget, descriptor);
  }
  let blob: Blob;
  if (data instanceof Blob) blob = data;
  else if (data instanceof ArrayBuffer) blob = new Blob([data.slice(0)]);
  else if (isUint8Array(data)) blob = new Blob([Uint8Array.from(copyBytes(data)).buffer]);
  else throw new ViewerError("INVALID_SOURCE", "source");
  const inferredName =
    descriptor.name ??
    (typeof File !== "undefined" && data instanceof File ? data.name : undefined);
  return new MemoryResource(blob, budget, inferredName, descriptor.mimeType);
}

/**
 * Default browser provider used when an application does not supply one.
 */
export class DefaultFileResourceProvider implements FileResourceProvider {
  readonly #budget: ResourceBudget;

  /**
   * Creates a provider constrained by the viewer session budget.
   *
   * @param budget - Security limits applied to every opened resource.
   */
  constructor(budget: ResourceBudget) {
    this.#budget = budget;
  }

  /**
   * Opens a local or remote primary source.
   *
   * @param source - Public local or remote source value.
   * @param signal - Required cancellation signal for the open operation.
   * @returns Owned random-access resource for the source.
   */
  async open(
    source: FileViewSource | FileViewSourceDescriptor,
    signal: AbortSignal,
  ): Promise<RandomAccessResource> {
    signal.throwIfAborted();
    const resource = openFileSource(source, this.#budget);
    if (resource.size !== undefined && resource.size > this.#budget.maxSourceBytes) {
      resource.dispose();
      throw new ViewerError("RESOURCE_LIMIT_EXCEEDED", "source");
    }
    return resource;
  }
}

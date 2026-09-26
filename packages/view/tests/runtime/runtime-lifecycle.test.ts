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
 * Verifies source ownership, registries, budgets, errors, and controller lifecycle behavior.
 */

import { detectBrowserSupport } from "../../src/runtime/browser-support.js";
import { DriverRegistry } from "../../src/runtime/driver-registry.js";
import { DefaultFileResourceProvider, openFileSource } from "../../src/runtime/file-source.js";
import {
  defaultResourceBudget,
  hardResourceBudget,
  resolveResourceBudget,
} from "../../src/runtime/resource-budget.js";
import { openViewerDocument, ViewerController } from "../../src/runtime/viewer-controller.js";
import type { TextDocument } from "../../src/shared/contracts/document.js";
import type { ViewerDriver } from "../../src/shared/contracts/driver.js";
import type { FormatDescriptor } from "../../src/shared/contracts/format.js";
import type {
  FileResourceProvider,
  RandomAccessResource,
} from "../../src/shared/contracts/source.js";
import {
  ViewerError,
  type ViewerErrorCode,
  sanitizeViewerError,
} from "../../src/shared/errors/viewer-error.js";

const encoder = new TextEncoder();

const customDescriptor: FormatDescriptor = {
  schemaVersion: 1,
  id: "custom",
  label: "Custom text",
  category: "text",
  extensions: ["custom"],
  mimeTypes: ["text/x-custom"],
  implementation: "ready",
};

/**
 * Creates a deterministic text driver used by lifecycle tests.
 *
 * @param status - Outcome status returned by the driver.
 * @returns Custom test driver.
 */
function customDriver(status: "complete" | "rejected" = "complete"): ViewerDriver<TextDocument> {
  return {
    id: "custom",
    /**
     * Opens test bytes as a stable text model.
     *
     * @param context - Driver context provided by the runtime.
     * @returns Selected complete or rejected outcome.
     */
    async open(context) {
      context.reportProgress({ stage: "parsing", indeterminate: true });
      if (status === "rejected") {
        return { status: "rejected", error: new ViewerError("PARSE_FAILED", "parse", true) };
      }
      const content = new TextDecoder().decode(await context.resource.readAll(context.signal));
      await context.resolveRelated?.({
        documentId: "custom-document",
        relation: "companion",
        path: "optional.bin",
        required: false,
      });
      return {
        status: "complete",
        warnings: [],
        model: {
          schemaVersion: 1,
          id: "custom-document",
          kind: "text",
          title: context.resource.name,
          content,
          lineCount: content === "" ? 0 : 1,
          language: "custom",
        },
      };
    },
  };
}

/**
 * Creates a registry containing the custom lifecycle driver.
 *
 * @param status - Outcome status returned by the registered driver.
 * @returns Registry with one detectable format.
 */
function customRegistry(status: "complete" | "rejected" = "complete"): DriverRegistry {
  const registry = new DriverRegistry();
  registry.registerFormat(customDescriptor, async () => customDriver(status));
  return registry;
}

describe("resource budgets and browser support", () => {
  it("clamps caller values and restores invalid values", () => {
    const resolved = resolveResourceBudget({
      maxSourceBytes: Number.POSITIVE_INFINITY,
      maxProbeBytes: -1,
      maxPages: 12.9,
      maxExpandedBytes: hardResourceBudget.maxExpandedBytes + 1,
    });
    expect(resolved.maxSourceBytes).toBe(defaultResourceBudget.maxSourceBytes);
    expect(resolved.maxProbeBytes).toBe(defaultResourceBudget.maxProbeBytes);
    expect(resolved.maxPages).toBe(12);
    expect(resolved.maxExpandedBytes).toBe(hardResourceBudget.maxExpandedBytes);
    expect(Object.isFrozen(defaultResourceBudget)).toBe(true);
  });

  it("reports capabilities from the supplied global object", () => {
    const support = detectBrowserSupport(globalThis);
    expect(support.arrayBuffer).toBe(true);
    expect(support.blobUrls).toBe(true);
    expect(typeof support.moduleWorkers).toBe("boolean");
    expect(typeof support.offscreenCanvas).toBe("boolean");
    expect(typeof support.webgl2).toBe("boolean");
  });
});

describe("file resources", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("owns local blobs, arrays, typed arrays, and files", async () => {
    const sources = [
      new Blob(["blob"], { type: "text/plain" }),
      new ArrayBuffer(4),
      new Uint8Array(new ArrayBuffer(4)),
      new File(["file"], "named.custom", { type: "text/x-custom" }),
    ];
    for (const source of sources) {
      const resource = openFileSource(source, defaultResourceBudget);
      expect(resource.name).toBe(source instanceof File ? "named.custom" : "unnamed");
      expect(await resource.read(0, 2)).toHaveLength(2);
      expect(await resource.createObjectUrl()).toMatch(/^blob:viewer-test-/u);
      expect(await resource.createObjectUrl()).toMatch(/^blob:viewer-test-/u);
      resource.dispose();
      expect(() => resource.dispose()).not.toThrow();
      await expect(resource.readAll()).rejects.toMatchObject({ code: "DOCUMENT_DISPOSED" });
    }
  });

  it("rejects invalid input, ranges, cancellation, and complete reads over budget", async () => {
    expect(() => openFileSource(42 as never, defaultResourceBudget)).toThrowError(ViewerError);
    expect(() => openFileSource("file:///private/value", defaultResourceBudget)).toThrowError(
      ViewerError,
    );
    const resource = openFileSource(new Blob(["large"]), {
      ...defaultResourceBudget,
      maxSourceBytes: 2,
    });
    await expect(resource.read(-1, 1)).rejects.toMatchObject({ code: "INVALID_SOURCE" });
    await expect(resource.read(0, Number.NaN)).rejects.toMatchObject({ code: "INVALID_SOURCE" });
    await expect(resource.readAll()).rejects.toMatchObject({ code: "RESOURCE_LIMIT_EXCEEDED" });
    const controller = new AbortController();
    controller.abort();
    await expect(resource.read(0, 1, controller.signal)).rejects.toMatchObject({
      name: "AbortError",
    });
  });

  it("downloads a remote source once and retains response metadata", async () => {
    const fetchMock = vi.fn(async () =>
      Promise.resolve(
        new Response("remote", {
          headers: {
            "content-length": "6",
            "content-type": "text/plain",
            etag: '"remote-v1"',
          },
        }),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const resource = openFileSource(
      {
        data: {
          url: "https://example.test/files/sample.custom",
          headers: { Authorization: "opaque" },
          withCredentials: true,
        },
        name: "override.custom",
      },
      defaultResourceBudget,
    );
    expect(resource.size).toBeUndefined();
    expect(Array.from(await resource.readAll())).toEqual(Array.from(encoder.encode("remote")));
    expect(Array.from(await resource.read(1, 2))).toEqual(Array.from(encoder.encode("em")));
    expect(resource.size).toBe(6);
    expect(resource.etag).toBe('"remote-v1"');
    expect(resource.mimeType).toBeUndefined();
    expect(fetchMock).toHaveBeenCalledOnce();
    resource.dispose();
    await expect(resource.readAll()).rejects.toMatchObject({ code: "DOCUMENT_DISPOSED" });
  });

  it("sanitizes remote network and size failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Promise.reject(new Error("secret"))),
    );
    await expect(
      openFileSource("https://example.test/network.custom", defaultResourceBudget).readAll(),
    ).rejects.toMatchObject({ code: "NETWORK_FAILED" });

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Promise.resolve(new Response("no", { status: 500 }))),
    );
    await expect(
      openFileSource("https://example.test/status.custom", defaultResourceBudget).readAll(),
    ).rejects.toMatchObject({ code: "NETWORK_FAILED" });

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Promise.resolve(new Response("x", { headers: { "content-length": "999" } })),
      ),
    );
    await expect(
      openFileSource("https://example.test/large.custom", {
        ...defaultResourceBudget,
        maxSourceBytes: 2,
      }).readAll(),
    ).rejects.toMatchObject({ code: "RESOURCE_LIMIT_EXCEEDED" });
  });

  it("enforces provider limits before handing a resource to a driver", async () => {
    const provider = new DefaultFileResourceProvider({
      ...defaultResourceBudget,
      maxSourceBytes: 2,
    });
    await expect(
      provider.open(new Blob(["oversize"]), new AbortController().signal),
    ).rejects.toMatchObject({ code: "RESOURCE_LIMIT_EXCEEDED" });
    const cancelled = new AbortController();
    cancelled.abort();
    await expect(provider.open(new Blob(), cancelled.signal)).rejects.toMatchObject({
      name: "AbortError",
    });
  });
});

describe("registries, errors, and document lifecycle", () => {
  it("enforces unique registry ownership and unsupported loads", async () => {
    const registry = customRegistry();
    expect(registry.has("custom")).toBe(true);
    expect(registry.getFormatDescriptors()).toEqual([customDescriptor]);
    await expect(registry.load("custom")).resolves.toMatchObject({ id: "custom" });
    expect(() => registry.register("custom", async () => customDriver())).toThrowError(ViewerError);
    await expect(registry.load("missing")).rejects.toMatchObject({ code: "FORMAT_UNSUPPORTED" });
  });

  it("classifies every public error and sanitizes unknown failures", () => {
    const codes: readonly ViewerErrorCode[] = [
      "ABORTED",
      "COMPATIBILITY_UNSUPPORTED",
      "DOCUMENT_DISPOSED",
      "FORMAT_AMBIGUOUS",
      "FORMAT_UNSUPPORTED",
      "INVALID_CONFIGURATION",
      "INVALID_SOURCE",
      "INTERNAL_UNEXPECTED",
      "NETWORK_FAILED",
      "PARSE_FAILED",
      "PARSE_STALLED",
      "PASSWORD_REJECTED",
      "PASSWORD_REQUIRED",
      "RELATED_RESOURCE_REQUIRED",
      "RESOURCE_LIMIT_EXCEEDED",
      "RENDER_FAILED",
      "SECURITY_BLOCKED",
    ];
    for (const code of codes) {
      const error = new ViewerError(code, "parse");
      expect(error.message).toBe(`[${code}]`);
      expect(error.category).not.toBe("");
      expect(error.diagnosticId).toMatch(/^viewer-error-/u);
    }
    const existing = new ViewerError("PARSE_FAILED", "parse");
    expect(sanitizeViewerError(existing, "render")).toBe(existing);
    expect(sanitizeViewerError(new DOMException("stopped", "AbortError"), "parse")).toMatchObject({
      code: "ABORTED",
      recoverable: true,
    });
    expect(sanitizeViewerError(new Error("secret"), "render")).toMatchObject({
      code: "INTERNAL_UNEXPECTED",
      stage: "render",
    });
  });

  it("opens, reports, and idempotently disposes a complete document", async () => {
    const progress: string[] = [];
    let relatedRequestCount = 0;
    const provider = new DefaultFileResourceProvider(defaultResourceBudget);
    const wrappedProvider: FileResourceProvider = {
      open: provider.open.bind(provider),
      /**
       * Records optional companion-resource requests.
       *
       * @returns No related resource for this fixture.
       */
      async resolveRelated() {
        relatedRequestCount += 1;
        return undefined;
      },
    };
    const opened = await openViewerDocument(
      { data: new Blob(["hello"]), name: "hello.custom", mimeType: "text/x-custom" },
      {
        registry: customRegistry(),
        resourceProvider: wrappedProvider,
        onProgress: (value) => progress.push(value.stage),
      },
    );
    expect(opened.outcome).toMatchObject({ status: "complete" });
    expect(opened.decision).toMatchObject({ extension: "custom", driver: "custom" });
    expect(progress).toEqual(["opening", "detecting", "parsing"]);
    expect(relatedRequestCount).toBe(1);
    opened.dispose();
    expect(() => opened.dispose()).not.toThrow();
  });

  it("rejects unknown and ambiguous sources through sanitized errors", async () => {
    await expect(
      openViewerDocument({ data: new Blob(), name: "unknown" }, { registry: new DriverRegistry() }),
    ).rejects.toMatchObject({ code: "FORMAT_UNSUPPORTED" });
    const ambiguous = new DriverRegistry();
    ambiguous.registerFormat(customDescriptor, async () => customDriver());
    ambiguous.registerFormat(
      { ...customDescriptor, id: "second", extensions: ["second"] },
      async () => ({ ...customDriver(), id: "second" }),
    );
    await expect(
      openViewerDocument({ data: new Blob(), mimeType: "text/x-custom" }, { registry: ambiguous }),
    ).rejects.toMatchObject({ code: "FORMAT_AMBIGUOUS" });
  });

  it("publishes controller loading, ready, rejected, and disposed states", async () => {
    const states: string[] = [];
    const controller = new ViewerController({ registry: customRegistry() });
    const unsubscribe = controller.subscribe((state) => states.push(state.status));
    await controller.open({ data: new Blob(["ready"]), name: "ready.custom" });
    expect(controller.getState()).toMatchObject({ status: "ready" });
    expect(states).toContain("loading");
    expect(states.at(-1)).toBe("ready");
    unsubscribe();
    unsubscribe();
    controller.dispose();
    controller.dispose();
    await expect(controller.open(new Blob())).rejects.toMatchObject({ code: "DOCUMENT_DISPOSED" });

    const rejected = new ViewerController({ registry: customRegistry("rejected") });
    await rejected.open({ data: new Blob(), name: "bad.custom" });
    expect(rejected.getState()).toMatchObject({
      status: "error",
      error: { code: "PARSE_FAILED" },
    });
    rejected.dispose();
  });

  it("ignores obsolete completion after a replacement open", async () => {
    let firstResolve: ((resource: RandomAccessResource) => void) | undefined;
    const fallback = new DefaultFileResourceProvider(defaultResourceBudget);
    const provider: FileResourceProvider = {
      /**
       * Delays the first source while allowing its replacement to complete.
       *
       * @param source - Source requested by the controller.
       * @param signal - Cancellation signal owned by the controller.
       * @returns Opened source resource.
       */
      async open(source, signal) {
        if (firstResolve === undefined) {
          return new Promise((resolve) => {
            firstResolve = resolve;
          });
        }
        return fallback.open(source, signal);
      },
    };
    const controller = new ViewerController({
      registry: customRegistry(),
      resourceProvider: provider,
    });
    const first = controller.open({ data: new Blob(["first"]), name: "first.custom" });
    await controller.open({ data: new Blob(["second"]), name: "second.custom" });
    const stale = openFileSource(
      { data: new Blob(["first"]), name: "first.custom" },
      defaultResourceBudget,
    );
    firstResolve?.(stale);
    await first;
    expect(controller.getState()).toMatchObject({
      status: "ready",
      document: { content: "second" },
    });
    controller.dispose();
  });
});

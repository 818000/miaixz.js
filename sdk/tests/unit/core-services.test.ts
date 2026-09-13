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

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  defineMiaixzConfig,
  getMiaixzFeature,
  getMiaixzServiceEndpoint,
  isMiaixzSdkConfig,
  loadMiaixzConfig,
  MiaixzConfigStore,
} from "../../src/config/config.js";
import { createMiaixzEventBus, MiaixzEventBus } from "../../src/events/events.js";
import { MiaixzSdkError } from "../../src/errors/errors.js";
import {
  createMiaixzFileClient,
  getMiaixzDownloadFilename,
  MiaixzFileClient,
  saveMiaixzBlob,
} from "../../src/files/files.js";
import {
  createMiaixzPermissionSet,
  isMiaixzPermissionSnapshot,
  MiaixzPermissionSet,
} from "../../src/permissions/permissions.js";
import {
  createMiaixzStorageKey,
  getMiaixzBrowserStorage,
  MiaixzMemoryStorage,
  MiaixzNamespacedStorage,
  readMiaixzJson,
  readMiaixzVersionedValue,
  writeMiaixzJson,
  writeMiaixzVersionedValue,
  type MiaixzKeyValueStorage,
} from "../../src/storage/storage.js";
import type { MiaixzSdkConfig } from "../../src/types/config.js";

const config: MiaixzSdkConfig = {
  apiBaseUrl: "https://api.test",
  environment: "test",
  requestTimeoutMs: 1_000,
  release: "0.6.0",
  services: { billing: "https://billing.test" },
  features: { enabled: true, count: 2, name: "Ada" },
  appearance: {
    colorMode: "system",
    density: "comfortable",
    theme: "miaixz",
    overrides: { light: { brand: "#3366ff" }, dark: { brand: "#6688ff" } },
  },
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("configuration", () => {
  it("validates every configuration field and freezes nested records", () => {
    expect(isMiaixzSdkConfig(config)).toBe(true);
    for (const invalid of [
      null,
      {},
      { ...config, environment: 1 },
      { ...config, apiBaseUrl: "http://remote.test", environment: "production" },
      { ...config, requestTimeoutMs: 0 },
      { ...config, requestTimeoutMs: Number.NaN },
      { ...config, release: 1 },
      { ...config, services: [] },
      { ...config, services: { one: "invalid" } },
      { ...config, features: { one: {} } },
      { ...config, appearance: {} },
    ]) {
      expect(isMiaixzSdkConfig(invalid)).toBe(false);
    }
    const frozen = defineMiaixzConfig(config);
    expect(Object.isFrozen(frozen)).toBe(true);
    expect(Object.isFrozen(frozen.services)).toBe(true);
    expect(Object.isFrozen(frozen.features)).toBe(true);
    expect(Object.isFrozen(frozen.appearance?.overrides?.light)).toBe(true);
    expect(() => defineMiaixzConfig({} as MiaixzSdkConfig)).toThrowError(
      expect.objectContaining({ code: "CONFIG_INVALID" }),
    );
  });

  it("loads direct, global, and remote configuration with stable failures", async () => {
    await expect(loadMiaixzConfig({ config })).resolves.toMatchObject(config);
    const globals = globalThis as unknown as Record<string, unknown>;
    globals.__MIAIXZ_TEST_CONFIG__ = config;
    await expect(loadMiaixzConfig({ globalKey: "__MIAIXZ_TEST_CONFIG__" })).resolves.toMatchObject(
      config,
    );
    delete globals.__MIAIXZ_TEST_CONFIG__;

    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(Response.json(config));
    await expect(
      loadMiaixzConfig({ url: "/config.json", fetch: fetchMock }),
    ).resolves.toMatchObject(config);
    expect(fetchMock).toHaveBeenCalledWith("/config.json", { credentials: "same-origin" });
    await expect(
      loadMiaixzConfig({
        url: "/missing.json",
        fetch: async () => new Response(null, { status: 404 }),
      }),
    ).rejects.toMatchObject({ code: "CONFIG_FETCH_FAILED", details: { status: 404 } });
    await expect(
      loadMiaixzConfig({
        url: "/broken.json",
        fetch: async () => {
          throw new Error("offline");
        },
      }),
    ).rejects.toMatchObject({ code: "CONFIG_FETCH_FAILED" });
    await expect(loadMiaixzConfig({ config: {} as MiaixzSdkConfig })).rejects.toMatchObject({
      code: "CONFIG_INVALID",
    });
  });

  it("resolves services, features, and atomically publishes store changes", () => {
    expect(getMiaixzServiceEndpoint(config, "billing")).toBe("https://billing.test");
    expect(() => getMiaixzServiceEndpoint(config, "missing")).toThrowError(
      expect.objectContaining({ code: "SERVICE_ENDPOINT_MISSING" }),
    );
    expect(getMiaixzFeature(config, "enabled", false)).toBe(true);
    expect(getMiaixzFeature(config, "missing", "fallback")).toBe("fallback");

    const events = createMiaixzEventBus();
    const eventPayloads: unknown[] = [];
    events.on("config:changed", (value) => eventPayloads.push(value));
    const store = new MiaixzConfigStore(config, events);
    const snapshots: unknown[] = [];
    const unsubscribe = store.subscribe((value) => snapshots.push(value));
    const stopPrepare = store.prepare((value) => {
      if (value.release === "blocked") throw new Error("blocked");
    });
    const next = { ...config, release: "0.6.1" };
    store.set(next);
    expect(store.getSnapshot()).toMatchObject(next);
    expect(snapshots).toHaveLength(1);
    expect(eventPayloads).toHaveLength(1);
    expect(() => store.set({ ...config, release: "blocked" })).toThrow("blocked");
    expect(store.getSnapshot().release).toBe("0.6.1");
    unsubscribe();
    stopPrepare();
    store.destroy();
    store.destroy();
    events.close();
  });
});

class TestChannel extends EventTarget {
  readonly posted: unknown[] = [];
  closeCount = 0;

  postMessage(value: unknown): void {
    this.posted.push(value);
  }

  close(): void {
    this.closeCount += 1;
  }

  receive(value: unknown): void {
    this.dispatchEvent(new MessageEvent("message", { data: value }));
  }
}

describe("event bus", () => {
  it("delivers local events in order, once, unsubscribe, clear, and close", () => {
    type Events = { changed: { value: number } };
    const bus = createMiaixzEventBus<Events>();
    const values: number[] = [];
    bus.on("changed", () => {
      throw new Error("observer");
    });
    const unsubscribe = bus.on("changed", ({ value }) => values.push(value));
    bus.once("changed", ({ value }) => values.push(value * 10));
    bus.emit("changed", { value: 1 });
    bus.emit("changed", { value: 2 });
    expect(values).toEqual([1, 10, 2]);
    unsubscribe();
    bus.clear("changed");
    bus.clear();
    bus.close();
    bus.close();
    expect(() => bus.emit("changed", { value: 3 })).toThrowError(
      expect.objectContaining({ code: "EVENT_CHANNEL_INVALID" }),
    );
    expect(bus.on("changed", () => undefined)()).toBeUndefined();
    expect(bus.once("changed", () => undefined)()).toBeUndefined();
  });

  it("validates broadcast envelopes, payloads, deduplication, and credentials", () => {
    type Events = { changed: { value: number }; unchecked: { value: number } };
    const channel = new TestChannel();
    const bus = new MiaixzEventBus<Events>({
      channelName: "miaixz:v1:test:events",
      broadcastChannelFactory: () => channel as unknown as BroadcastChannel,
      validators: { changed: (value) => typeof (value as { value?: unknown }).value === "number" },
    });
    const values: number[] = [];
    bus.on("changed", ({ value }) => values.push(value));
    bus.emit("changed", { value: 1 });
    expect(values).toEqual([1]);
    expect(channel.posted).toHaveLength(1);
    const outbound = channel.posted[0] as { sourceId: string };
    const inbound = {
      version: 1,
      eventId: "11111111-1111-4111-8111-111111111111",
      sourceId: "22222222-2222-4222-8222-222222222222",
      type: "changed",
      payload: { value: 2 },
    };
    channel.receive(inbound);
    channel.receive(inbound);
    channel.receive({ ...inbound, eventId: "invalid" });
    channel.receive({
      ...inbound,
      eventId: "33333333-3333-4333-8333-333333333333",
      sourceId: outbound.sourceId,
    });
    channel.receive({
      ...inbound,
      eventId: "44444444-4444-4444-8444-444444444444",
      payload: { value: "bad" },
    });
    channel.receive({
      ...inbound,
      eventId: "55555555-5555-4555-8555-555555555555",
      payload: { token: "secret", value: 3 },
    });
    expect(values).toEqual([1, 2]);
    expect(() => bus.emit("unchecked", { value: 1 }, { broadcast: true })).toThrowError(
      expect.objectContaining({ code: "EVENT_VALIDATOR_MISSING" }),
    );
    bus.emit("unchecked", { value: 2 });
    bus.emit("changed", { value: 3 }, { broadcast: false });
    expect(channel.posted).toHaveLength(1);
    bus.close();
    expect(channel.closeCount).toBe(1);
  });

  it("rejects invalid channels and non-cloneable broadcast payloads", () => {
    expect(() => new MiaixzEventBus({ channelName: "invalid channel" })).toThrowError(
      expect.objectContaining({ code: "EVENT_CHANNEL_INVALID" }),
    );
    type Events = { changed: { callback: () => void } };
    const bus = new MiaixzEventBus<Events>({
      channelName: "miaixz:v1:test:events",
      broadcastChannelFactory: () => new TestChannel() as unknown as BroadcastChannel,
      validators: { changed: () => true },
    });
    expect(() =>
      bus.emit("changed", { callback: () => undefined }, { broadcast: true }),
    ).toThrowError(expect.objectContaining({ code: "EVENT_PAYLOAD_NOT_CLONEABLE" }));
    bus.close();
  });
});

describe("storage", () => {
  it("builds scoped keys and rejects ambiguous scopes", () => {
    expect(createMiaixzStorageKey({ appId: "portal" }, "appearance")).toBe(
      "miaixz:v1:global:portal:appearance",
    );
    expect(createMiaixzStorageKey({ appId: "portal", tenantId: "acme" }, "context")).toBe(
      "miaixz:v1:acme:portal:context",
    );
    for (const scope of [{ appId: "" }, { appId: "portal", tenantId: "global" }]) {
      expect(() => createMiaixzStorageKey(scope, "preferences")).toThrowError(
        expect.objectContaining({ code: "STORAGE_SCOPE_INVALID" }),
      );
    }
  });

  it("reads, migrates, rewrites, removes, and rejects versioned values", () => {
    const storage = new MiaixzMemoryStorage();
    const scope = { appId: "portal" };
    const key = createMiaixzStorageKey(scope, "preferences");
    writeMiaixzVersionedValue(
      { storage, scope, kind: "preferences", schemaVersion: 1 },
      { name: "Ada" },
    );
    expect(
      readMiaixzVersionedValue({
        storage,
        scope,
        kind: "preferences",
        schemaVersion: 2,
        migrations: [
          { from: 1, to: 2, migrate: (value) => ({ ...(value as object), active: true }) },
        ],
        parse: (value) => value as { name: string; active: boolean },
      }),
    ).toEqual({ name: "Ada", active: true });
    expect(JSON.parse(storage.getItem(key) ?? "")).toMatchObject({ schemaVersion: 2 });
    writeMiaixzVersionedValue({ storage, scope, kind: "preferences", schemaVersion: 2 }, undefined);
    expect(storage.getItem(key)).toBeNull();
    expect(
      readMiaixzVersionedValue({
        scope,
        kind: "preferences",
        schemaVersion: 1,
        parse: (value) => value,
      }),
    ).toBeUndefined();

    for (const serialized of ["invalid", "{}", '{"schemaVersion":3,"value":1}']) {
      storage.setItem(key, serialized);
      expect(
        readMiaixzVersionedValue({
          storage,
          scope,
          kind: "preferences",
          schemaVersion: 2,
          parse: (value) => value,
        }),
      ).toBeUndefined();
      expect(storage.getItem(key)).toBeNull();
    }
    storage.setItem(key, '{"schemaVersion":0,"value":1}');
    expect(
      readMiaixzVersionedValue({
        storage,
        scope,
        kind: "preferences",
        schemaVersion: 2,
        parse: (value) => value,
      }),
    ).toBeUndefined();
  });

  it("supports memory, namespace, JSON, unavailable, and failing adapters", () => {
    const storage = new MiaixzMemoryStorage();
    const namespaced = new MiaixzNamespacedStorage(storage, "sdk");
    namespaced.setItem("one", "1");
    expect(namespaced.getItem("one")).toBe("1");
    namespaced.removeItem("one");
    expect(namespaced.getItem("one")).toBeNull();
    storage.setItem("one", "1");
    storage.clear();
    expect(storage.getItem("one")).toBeNull();

    writeMiaixzJson(storage, "json", { value: 1 });
    expect(readMiaixzJson(storage, "json")).toEqual({ value: 1 });
    expect(
      readMiaixzJson(storage, "json", (value): value is string => typeof value === "string"),
    ).toBeUndefined();
    storage.setItem("bad", "{");
    expect(readMiaixzJson(storage, "bad")).toBeUndefined();
    writeMiaixzJson(storage, "json", undefined);
    expect(readMiaixzJson(storage, "json")).toBeUndefined();
    writeMiaixzJson(undefined, "json", 1);
    expect(getMiaixzBrowserStorage()).toBeUndefined();

    const failing: MiaixzKeyValueStorage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    };
    expect(
      readMiaixzVersionedValue({
        storage: failing,
        scope: { appId: "portal" },
        kind: "preferences",
        schemaVersion: 1,
        parse: (value) => value,
      }),
    ).toBeUndefined();
    expect(() =>
      writeMiaixzVersionedValue(
        { storage: failing, scope: { appId: "portal" }, kind: "preferences", schemaVersion: 1 },
        1,
      ),
    ).not.toThrow();
  });
});

describe("permissions and files", () => {
  it("validates permission snapshots and applies exact, namespace, global, deny, and role rules", () => {
    expect(isMiaixzPermissionSnapshot({ allowed: ["project:read"] })).toBe(true);
    expect(isMiaixzPermissionSnapshot({ allowed: [], denied: ["x"], roles: ["admin"] })).toBe(true);
    for (const value of [
      {},
      { allowed: [""] },
      { allowed: [], denied: [1] },
      { allowed: [], roles: "admin" },
    ]) {
      expect(isMiaixzPermissionSnapshot(value)).toBe(false);
    }
    const permissions = createMiaixzPermissionSet({
      allowed: ["project:*", "billing:read", "*"],
      denied: ["project:delete"],
      roles: ["admin", "admin"],
    });
    expect(permissions.can("project:read")).toBe(true);
    expect(permissions.can("project:delete")).toBe(false);
    expect(permissions.can("anything")).toBe(true);
    expect(permissions.canAny(["project:delete", "billing:read"])).toBe(true);
    expect(permissions.canAll(["project:read", "billing:read"])).toBe(true);
    expect(permissions.hasRole("admin")).toBe(true);
    expect(() => new MiaixzPermissionSet({ allowed: [""] })).toThrowError(
      expect.objectContaining({ code: "PERMISSIONS_INVALID" }),
    );
  });

  it("extracts download filenames from standard and encoded dispositions", () => {
    expect(getMiaixzDownloadFilename(new Headers())).toBeUndefined();
    expect(
      getMiaixzDownloadFilename(
        new Headers({ "content-disposition": 'attachment; filename="report.pdf"' }),
      ),
    ).toBe("report.pdf");
    expect(
      getMiaixzDownloadFilename(
        new Headers({ "content-disposition": "attachment; filename*=UTF-8''hello%20world.txt" }),
      ),
    ).toBe("hello world.txt");
    expect(
      getMiaixzDownloadFilename(
        new Headers({ "content-disposition": "attachment; filename*=UTF-8''%ZZ" }),
      ),
    ).toBe("%ZZ");
  });

  it("uploads multipart data and downloads metadata through one API facade", async () => {
    const calls: unknown[] = [];
    const api = {
      post: async (path: string, body: FormData, options: unknown) => {
        calls.push({ path, body, options });
        return { data: { files: [{ id: "one" }] } };
      },
      get: async (path: string, options: unknown) => {
        calls.push({ path, options });
        return {
          data: new Blob(["data"]),
          headers: new Headers({
            "content-disposition": 'attachment; filename="download.txt"',
            "content-type": "text/plain",
          }),
        };
      },
    };
    const files = createMiaixzFileClient(api as never);
    expect(files).toBeInstanceOf(MiaixzFileClient);
    const upload = await files.upload("/upload", new Blob(["one"]), {
      fieldName: "asset",
      metadata: { count: 2, enabled: true },
      headers: { "x-test": "one" },
    });
    expect(upload).toEqual({ files: [{ id: "one" }] });
    const download = await files.download("/download");
    expect(download).toMatchObject({ filename: "download.txt", contentType: "text/plain" });
    expect(calls).toHaveLength(2);
  });

  it("preserves SDK errors, wraps unknown download failures, and supports SSR save", async () => {
    const sdkError = new MiaixzSdkError({ code: "SDK_DESTROYED" });
    const first = new MiaixzFileClient({
      get: async () => {
        throw sdkError;
      },
    } as never);
    await expect(first.download("/one")).rejects.toBe(sdkError);
    const second = new MiaixzFileClient({
      get: async () => {
        throw new Error("offline");
      },
    } as never);
    await expect(second.download("/two")).rejects.toMatchObject({ code: "FILE_DOWNLOAD_FAILED" });
    expect(() => saveMiaixzBlob(new Blob(), "file.txt", undefined)).not.toThrow();
  });

  it("creates and revokes a temporary browser download link", async () => {
    vi.useFakeTimers();
    const anchor = {
      href: "",
      download: "",
      hidden: false,
      click: vi.fn(),
      remove: vi.fn(),
    };
    const append = vi.fn();
    const targetDocument = {
      createElement: vi.fn(() => anchor),
      body: { append },
    } as unknown as Document;
    const createObjectUrl = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:download");
    const revokeObjectUrl = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    saveMiaixzBlob(new Blob(["data"]), "report.txt", targetDocument);
    expect(createObjectUrl).toHaveBeenCalledOnce();
    expect(anchor).toMatchObject({ href: "blob:download", download: "report.txt", hidden: true });
    expect(append).toHaveBeenCalledWith(anchor);
    expect(anchor.click).toHaveBeenCalledOnce();
    expect(anchor.remove).toHaveBeenCalledOnce();
    await vi.runAllTimersAsync();
    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:download");
    vi.useRealTimers();
  });
});

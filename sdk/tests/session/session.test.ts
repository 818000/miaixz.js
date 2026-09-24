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
 * Verifies Bearer session validation, persistence, events, and refresh behavior.
 */

import { describe, expect, it, vi } from "vitest";

import {
  createMiaixzPersistentSessionStorage,
  createMiaixzSessionManager,
  isMiaixzSession,
  isMiaixzSessionExpired,
  MiaixzSessionManager,
} from "../../src/access/session/index.js";
import { createMiaixzEventBus } from "../../src/runtime/events/events.js";
import { MiaixzMemoryStorage } from "../../src/runtime/storage/storage.js";

describe("Bearer session", () => {
  it("requires explicit persistence risk acknowledgement and fixes the physical key", () => {
    const storage = new MiaixzMemoryStorage();
    expect(() =>
      createMiaixzPersistentSessionStorage(storage, {
        acknowledgeWebStorageRisk: false,
      } as never),
    ).toThrowError(
      expect.objectContaining({ code: "SESSION_PERSISTENCE_ACKNOWLEDGEMENT_REQUIRED" }),
    );
    const persistence = createMiaixzPersistentSessionStorage(storage, {
      acknowledgeWebStorageRisk: true,
      storageKey: "credentials",
    });
    persistence.setItem("ignored", "value");
    expect(storage.getItem("credentials")).toBe("value");
    expect(persistence.getItem("another")).toBe("value");
    persistence.removeItem("ignored");
    expect(storage.getItem("credentials")).toBeNull();
    expect(
      createMiaixzPersistentSessionStorage(storage, { acknowledgeWebStorageRisk: true }).kind,
    ).toBe("miaixz-persistent-session-storage");
    expect(() => new MiaixzSessionManager({ persistence: { ...persistence } })).toThrowError(
      expect.objectContaining({ code: "SESSION_PERSISTENCE_ACKNOWLEDGEMENT_REQUIRED" }),
    );
  });

  it("validates every session field and expiry boundary", () => {
    const session = {
      accessToken: "token",
      refreshToken: "refresh",
      tokenType: "DPoP",
      expired: 10_000,
      user: { id: "user", displayName: "Ada", username: "ada", avatarUrl: "/avatar" },
    };
    expect(isMiaixzSession(session)).toBe(true);
    for (const invalid of [
      null,
      {},
      { accessToken: " " },
      { accessToken: "token", refreshToken: 1 },
      { accessToken: "token", tokenType: 1 },
      { accessToken: "token", expired: Number.NaN },
      { accessToken: "token", expired: -1 },
      { accessToken: "token", expired: 1.5 },
      { accessToken: "token", user: null },
      { accessToken: "token", user: { id: "", displayName: "Ada" } },
      { accessToken: "token", user: { id: "user", displayName: "" } },
      { accessToken: "token", user: { id: "user", displayName: "Ada", username: 1 } },
      { accessToken: "token", user: { id: "user", displayName: "Ada", avatarUrl: 1 } },
    ]) {
      expect(isMiaixzSession(invalid)).toBe(false);
    }
    expect(isMiaixzSessionExpired(session, 1_000, 9)).toBe(true);
    expect(isMiaixzSessionExpired(session, 0, 9)).toBe(false);
    expect(isMiaixzSessionExpired({ accessToken: "token" }, 100)).toBe(false);
  });

  it("persists immutable snapshots, suppresses duplicates, and publishes status", () => {
    const raw = new MiaixzMemoryStorage();
    const persistence = createMiaixzPersistentSessionStorage(raw, {
      acknowledgeWebStorageRisk: true,
    });
    const events = createMiaixzEventBus();
    const statuses: string[] = [];
    events.on("session:changed", (event) => statuses.push(event.status));
    const manager = createMiaixzSessionManager({ persistence, eventBus: events });
    const listener = vi.fn();
    const unsubscribe = manager.subscribe(listener);
    const session = { accessToken: "token", user: { id: "user", displayName: "Ada" } };
    manager.setSession(session);
    manager.setSession({ ...session, user: { ...session.user } });
    const snapshot = manager.getSession();
    expect(snapshot).toEqual(session);
    expect(snapshot).not.toBe(session);
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot?.user)).toBe(true);
    expect(listener).toHaveBeenCalledOnce();
    expect(statuses).toEqual(["authenticated"]);
    expect(raw.getItem("miaixz-session")).toContain("token");

    const restored = createMiaixzSessionManager({ persistence });
    expect(restored.getSession()).toEqual(session);
    restored.destroy();
    events.emit("session:changed", { status: "anonymous" });
    expect(manager.getSession()).toBeUndefined();
    expect(statuses).toEqual(["authenticated", "anonymous"]);
    manager.clearSession();
    unsubscribe();
    manager.destroy();
    events.close();
  });

  it("shares refresh work and supports custom authorization schemes", async () => {
    let release!: () => void;
    const refresh = vi.fn(
      () =>
        new Promise<{ accessToken: string; tokenType: string }>((resolve) => {
          release = () => resolve({ accessToken: "new-token", tokenType: "DPoP" });
        }),
    );
    const manager = createMiaixzSessionManager({ refresh, now: () => 1_000 });
    manager.setSession({ accessToken: "old", expired: 1_000 });
    const first = manager.getAccessToken();
    const second = manager.tokenProvider();
    await vi.waitFor(() => expect(refresh).toHaveBeenCalledOnce());
    release();
    await expect(Promise.all([first, second])).resolves.toEqual(["new-token", "new-token"]);
    await expect(manager.authorizationProvider()).resolves.toBe("DPoP new-token");
    manager.setSession({ accessToken: "bearer" });
    await expect(manager.authorizationProvider()).resolves.toBe("Bearer bearer");
    manager.clearSession();
    await expect(manager.authorizationProvider()).resolves.toBeUndefined();
  });

  it("clears expired sessions when refresh returns empty or fails", async () => {
    const withoutRefresh = createMiaixzSessionManager({ now: () => 1_000 });
    expect(await withoutRefresh.getAccessToken()).toBeUndefined();
    withoutRefresh.setSession({ accessToken: "expired", expired: 1_000 });
    await expect(withoutRefresh.getAccessToken()).resolves.toBeUndefined();
    expect(withoutRefresh.getSession()).toBeDefined();

    const empty = createMiaixzSessionManager({ now: () => 1_000, refresh: async () => undefined });
    empty.setSession({ accessToken: "expired", expired: 1_000 });
    await expect(empty.getAccessToken()).resolves.toBeUndefined();
    expect(empty.getSession()).toBeUndefined();

    const failing = createMiaixzSessionManager({
      now: () => 1_000,
      refresh: async () => {
        throw new Error("private");
      },
    });
    failing.setSession({ accessToken: "expired", expired: 1_000 });
    await expect(failing.getAccessToken()).rejects.toMatchObject({
      code: "SESSION_REFRESH_FAILED",
    });
    expect(failing.getSession()).toBeUndefined();
    expect(() => failing.setSession({ accessToken: " " })).toThrowError(
      expect.objectContaining({ code: "SESSION_INVALID" }),
    );
  });
});

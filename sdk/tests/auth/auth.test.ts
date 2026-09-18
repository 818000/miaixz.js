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

import { describe, expect, it, vi } from "vitest";

import {
  createMiaixzAuthManager,
  createMiaixzPersistentAuthStorage,
  isMiaixzAuthSession,
  isMiaixzSessionExpired,
  MiaixzAuthManager,
} from "../../src/auth/auth.js";
import { createMiaixzEventBus } from "../../src/events/events.js";
import { MiaixzMemoryStorage } from "../../src/storage/storage.js";

describe("Bearer authentication", () => {
  it("requires explicit persistence risk acknowledgement and fixes the physical key", () => {
    const storage = new MiaixzMemoryStorage();
    expect(() =>
      createMiaixzPersistentAuthStorage(storage, {
        acknowledgeWebStorageRisk: false,
      } as never),
    ).toThrowError(expect.objectContaining({ code: "AUTH_PERSISTENCE_ACKNOWLEDGEMENT_REQUIRED" }));
    const persistence = createMiaixzPersistentAuthStorage(storage, {
      acknowledgeWebStorageRisk: true,
      storageKey: "credentials",
    });
    persistence.setItem("ignored", "value");
    expect(storage.getItem("credentials")).toBe("value");
    expect(persistence.getItem("another")).toBe("value");
    persistence.removeItem("ignored");
    expect(storage.getItem("credentials")).toBeNull();
    expect(
      createMiaixzPersistentAuthStorage(storage, { acknowledgeWebStorageRisk: true }).kind,
    ).toBe("miaixz-persistent-auth-storage");
    expect(() => new MiaixzAuthManager({ persistence: { ...persistence } })).toThrowError(
      expect.objectContaining({ code: "AUTH_PERSISTENCE_ACKNOWLEDGEMENT_REQUIRED" }),
    );
  });

  it("validates every session field and expiry boundary", () => {
    const session = {
      accessToken: "token",
      refreshToken: "refresh",
      tokenType: "DPoP",
      expiresAt: 10_000,
      user: { id: "user", displayName: "Ada", username: "ada", avatarUrl: "/avatar" },
    };
    expect(isMiaixzAuthSession(session)).toBe(true);
    for (const invalid of [
      null,
      {},
      { accessToken: " " },
      { accessToken: "token", refreshToken: 1 },
      { accessToken: "token", tokenType: 1 },
      { accessToken: "token", expiresAt: Number.NaN },
      { accessToken: "token", user: null },
      { accessToken: "token", user: { id: "", displayName: "Ada" } },
      { accessToken: "token", user: { id: "user", displayName: "" } },
      { accessToken: "token", user: { id: "user", displayName: "Ada", username: 1 } },
      { accessToken: "token", user: { id: "user", displayName: "Ada", avatarUrl: 1 } },
    ]) {
      expect(isMiaixzAuthSession(invalid)).toBe(false);
    }
    expect(isMiaixzSessionExpired(session, 1_000, 9)).toBe(true);
    expect(isMiaixzSessionExpired(session, 0, 9)).toBe(false);
    expect(isMiaixzSessionExpired({ accessToken: "token" }, 100)).toBe(false);
  });

  it("persists immutable snapshots, suppresses duplicates, and publishes status", () => {
    const raw = new MiaixzMemoryStorage();
    const persistence = createMiaixzPersistentAuthStorage(raw, {
      acknowledgeWebStorageRisk: true,
    });
    const events = createMiaixzEventBus();
    const statuses: string[] = [];
    events.on("auth:changed", (event) => statuses.push(event.status));
    const manager = createMiaixzAuthManager({ persistence, events });
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
    expect(raw.getItem("miaixz-auth")).toContain("token");

    const restored = createMiaixzAuthManager({ persistence });
    expect(restored.getSession()).toEqual(session);
    restored.destroy();
    events.emit("auth:changed", { status: "anonymous" });
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
    const manager = createMiaixzAuthManager({ refresh, now: () => 1_000 });
    manager.setSession({ accessToken: "old", expiresAt: 1_000 });
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
    const withoutRefresh = createMiaixzAuthManager({ now: () => 1_000 });
    expect(await withoutRefresh.getAccessToken()).toBeUndefined();
    withoutRefresh.setSession({ accessToken: "expired", expiresAt: 1_000 });
    await expect(withoutRefresh.getAccessToken()).resolves.toBeUndefined();
    expect(withoutRefresh.getSession()).toBeDefined();

    const empty = createMiaixzAuthManager({ now: () => 1_000, refresh: async () => undefined });
    empty.setSession({ accessToken: "expired", expiresAt: 1_000 });
    await expect(empty.getAccessToken()).resolves.toBeUndefined();
    expect(empty.getSession()).toBeUndefined();

    const failing = createMiaixzAuthManager({
      now: () => 1_000,
      refresh: async () => {
        throw new Error("private");
      },
    });
    failing.setSession({ accessToken: "expired", expiresAt: 1_000 });
    await expect(failing.getAccessToken()).rejects.toMatchObject({ code: "AUTH_REFRESH_FAILED" });
    expect(failing.getSession()).toBeUndefined();
    expect(() => failing.setSession({ accessToken: " " })).toThrowError(
      expect.objectContaining({ code: "AUTH_SESSION_INVALID" }),
    );
  });
});

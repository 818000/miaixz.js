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

import { createMiaixzI18n, MiaixzI18n } from "../../src/i18n/i18n-runtime.js";
import {
  createMiaixzMessageLoader,
  MiaixzI18nLoadError,
  unwrapMessages,
} from "../../src/i18n/message-loader.js";
import {
  canonicalizeLocale,
  defineLocale,
  getBaseLanguage,
  getMiaixzBrowserLocale,
  MiaixzLocaleCatalog,
} from "../../src/i18n/locale-catalog.js";
import {
  interpolate,
  isMessages,
  resolveSourceMessage,
  validateMessages,
  validateNamespace,
  type MutableCatalog,
} from "../../src/i18n/messages.js";
import { getMiaixzPageCount } from "../../src/types/pagination.js";
import { isValidDate } from "../../src/utils/date.js";
import { clamp } from "../../src/utils/number.js";
import { isNonEmptyString } from "../../src/utils/string.js";

describe("locale catalog", () => {
  it("canonicalizes locales and rejects invalid identifiers and definitions", () => {
    expect(canonicalizeLocale("zh-cn")).toBe("zh-CN");
    expect(getBaseLanguage("ZH-Hans-CN")).toBe("zh");
    expect(getMiaixzBrowserLocale()).toBe("en-US");
    for (const locale of ["", "not_a_locale"]) {
      expect(() => canonicalizeLocale(locale)).toThrowError(
        expect.objectContaining({ code: "I18N_LOCALE_INVALID" }),
      );
    }
    const valid = defineLocale({
      schemaVersion: 1,
      id: "fr-fr",
      label: " Français ",
      shortLabel: " FR ",
      version: " 1.0.0 ",
      direction: "ltr",
      aliases: ["fr", "fr"],
      keywords: [" French ", "French", ""],
      fallback: "en-us",
    });
    expect(valid).toMatchObject({
      id: "fr-FR",
      label: "Français",
      shortLabel: "FR",
      version: "1.0.0",
      aliases: ["fr"],
      keywords: ["French"],
      fallback: "en-US",
    });
    for (const invalid of [
      null,
      {},
      { ...valid, schemaVersion: 2 },
      { ...valid, label: " " },
      { ...valid, shortLabel: "" },
      { ...valid, version: "" },
      { ...valid, direction: "sideways" },
      { ...valid, aliases: ["fr-FR"] },
      { ...valid, aliases: "fr" },
      { ...valid, keywords: [1] },
      { ...valid, loadMessages: true },
    ]) {
      expect(() => defineLocale(invalid as never)).toThrowError(
        expect.objectContaining({ code: "I18N_LOCALE_DEFINITION_INVALID" }),
      );
    }
  });

  it("resolves exact ids, aliases, base languages, and immutable descriptors", () => {
    const french = defineLocale({
      schemaVersion: 1,
      id: "fr-FR",
      label: "Français",
      shortLabel: "FR",
      version: "1.0.0",
      aliases: ["fr"],
    });
    const catalog = new MiaixzLocaleCatalog([french]);
    expect(catalog.has("fr")).toBe(true);
    expect(catalog.has("fr-CA")).toBe(true);
    expect(catalog.resolve("fr")?.id).toBe("fr-FR");
    expect(catalog.resolve("de-DE")).toBeUndefined();
    expect(Object.isFrozen(catalog.descriptors())).toBe(true);
  });
});

describe("message contracts and loader", () => {
  it("validates namespace-owned flat messages and interpolation", () => {
    expect(validateNamespace("project-ui")).toBe("project-ui");
    for (const namespace of ["a", "UPPER", "bad space", "x".repeat(65)]) {
      expect(() => validateNamespace(namespace)).toThrowError(
        expect.objectContaining({ code: "I18N_NAMESPACE_INVALID" }),
      );
    }
    expect(isMessages({ "demo.one": "One" })).toBe(true);
    expect(isMessages([])).toBe(false);
    expect(isMessages({ one: 1 })).toBe(false);
    expect(validateMessages("demo", { "demo.one": "One" })).toEqual({ "demo.one": "One" });
    expect(() => validateMessages("demo", { "other.one": "One" })).toThrowError(
      expect.objectContaining({ code: "I18N_NAMESPACE_INVALID" }),
    );
    expect(() => validateMessages("demo", { "demo.one": 1 })).toThrowError(
      expect.objectContaining({ code: "I18N_MESSAGES_INVALID" }),
    );
    expect(interpolate("Hello {name} {missing}", { name: "Ada" })).toBe("Hello Ada {missing}");
    expect(interpolate("Plain")).toBe("Plain");

    const catalog: MutableCatalog = new Map([
      [
        "demo",
        new Map([
          ["en-GB", { "demo.one": "British" }],
          ["en-US", { "demo.one": "American" }],
        ]),
      ],
    ]);
    expect(resolveSourceMessage(catalog, "demo", "en-US", "demo.one")).toBe("American");
    expect(resolveSourceMessage(catalog, "demo", "en-CA", "demo.one")).toBe("British");
    expect(resolveSourceMessage(catalog, "demo", "fr-FR", "demo.one")).toBeUndefined();
  });

  it("unwraps direct/default modules and rejects malformed modules", () => {
    expect(unwrapMessages({ "demo.one": "One" })).toEqual({ "demo.one": "One" });
    expect(unwrapMessages({ default: { "demo.one": "One" } })).toEqual({ "demo.one": "One" });
    for (const value of [{ default: { one: 1 } }, []]) {
      expect(() => unwrapMessages(value as never)).toThrowError(
        expect.objectContaining({ code: "I18N_MESSAGES_INVALID" }),
      );
    }
    const error = new MiaixzI18nLoadError("fr-FR", "demo", new Error("load"));
    expect(error).toMatchObject({ code: "I18N_LOAD_FAILED", locale: "fr-FR", namespace: "demo" });
  });

  it("deduplicates exact and base-language loaders and evicts failures", async () => {
    const exact = vi.fn(async () => ({ default: { "demo.one": "Exact" } }));
    const base = vi.fn(async () => ({ "demo.one": "Base" }));
    const loader = createMiaixzMessageLoader({
      demo: { "fr-FR": exact, "en-GB": base },
    });
    const first = loader("demo", "fr-FR");
    expect(loader("demo", "fr-FR")).toBe(first);
    await expect(first).resolves.toEqual({ default: { "demo.one": "Exact" } });
    await expect(loader("demo", "en-US")).resolves.toEqual({ "demo.one": "Base" });
    await expect(loader("demo", "de-DE")).resolves.toEqual({});
    expect(exact).toHaveBeenCalledTimes(1);

    let attempts = 0;
    const retrying = createMiaixzMessageLoader({
      demo: {
        "fr-FR": async () => {
          attempts += 1;
          if (attempts === 1) throw new Error("first");
          return { "demo.one": "Recovered" };
        },
      },
    });
    await expect(retrying("demo", "fr-FR")).rejects.toThrow("first");
    await expect(retrying("demo", "fr-FR")).resolves.toEqual({ "demo.one": "Recovered" });
  });
});

describe("i18n runtime", () => {
  it("registers precedence layers, aliases, snapshots, and fallback messages", async () => {
    const french = defineLocale({
      schemaVersion: 1,
      id: "fr-FR",
      label: "Français",
      shortLabel: "FR",
      version: "1.0.0",
      aliases: ["fr"],
      fallback: "en-US",
    });
    const i18n = new MiaixzI18n({
      locale: "fr",
      fallbackLocale: "en-US",
      locales: [french],
      messages: {
        "en-US": { "demo.hello": "Hello {name}" },
        "fr-FR": { "demo.hello": "Bonjour {name}" },
      },
    });
    const snapshots: unknown[] = [];
    const unsubscribe = i18n.subscribe((snapshot) => snapshots.push(snapshot));
    expect(i18n.locale).toBe("fr-FR");
    expect(i18n.getLocale("fr")?.id).toBe("fr-FR");
    expect(i18n.locales.some(({ id }) => id === "fr-FR")).toBe(true);
    expect(i18n.t("demo.hello", { name: "Ada" })).toBe("Bonjour Ada");
    expect(i18n.t("demo.missing", undefined, "Fallback")).toBe("Fallback");
    i18n.registerMessages("demo", "fr-FR", { "demo.hello": "Salut {name}" }, "project");
    expect(i18n.t("demo.hello", { name: "Ada" })).toBe("Salut Ada");
    await i18n.initialize(["demo", "demo"]);
    await i18n.changeLocale("en-US");
    expect(i18n.locale).toBe("en-US");
    expect(snapshots.length).toBeGreaterThan(1);
    unsubscribe();
  });

  it("deduplicates active loading, reports failures, and keeps the latest locale change", async () => {
    const errors: MiaixzI18nLoadError[] = [];
    let release: (() => void) | undefined;
    const waiting = new Promise<void>((resolve) => {
      release = resolve;
    });
    const loadMessages = vi.fn(async (namespace: string, locale: string) => {
      if (locale === "fr-FR") await waiting;
      if (locale === "de-DE") throw new Error("missing");
      return { [`${namespace}.loaded`]: locale };
    });
    const i18n = createMiaixzI18n({
      locale: "en-US",
      loadMessages,
      onLoadError: (error) => {
        errors.push(error);
        throw new Error("observer");
      },
    });
    const first = i18n.loadNamespace("demo", "fr-FR");
    expect(i18n.loadNamespace("demo", "fr-FR")).toBe(first);
    release?.();
    await first;
    await i18n.loadNamespace("demo", "fr-FR");
    expect(loadMessages).toHaveBeenCalledTimes(1);
    await expect(i18n.loadNamespace("demo", "de-DE")).rejects.toMatchObject({
      code: "I18N_LOAD_FAILED",
    });
    expect(i18n.getSnapshot()).toMatchObject({ loadStatus: "error" });
    expect(errors).toHaveLength(1);

    const slow = i18n.changeLocale("fr-FR");
    const latest = i18n.changeLocale("en-US");
    await Promise.all([slow, latest]);
    expect(i18n.locale).toBe("en-US");
  });

  it("rejects malformed initial message catalogs", () => {
    expect(() => new MiaixzI18n({ messages: [] as never })).toThrowError(
      expect.objectContaining({ code: "I18N_MESSAGES_INVALID" }),
    );
    expect(() => new MiaixzI18n({ messages: { "en-US": { one: 1 } } as never })).toThrowError(
      expect.objectContaining({ code: "I18N_MESSAGES_INVALID" }),
    );
  });
});

describe("small shared utilities", () => {
  it("covers pagination, date, number, and string boundaries", () => {
    expect(getMiaixzPageCount({ page: 1, pageSize: 10, total: 21 })).toBe(3);
    expect(getMiaixzPageCount({ page: 1, pageSize: 0, total: 21 })).toBe(0);
    expect(getMiaixzPageCount({ page: 1, pageSize: 10, total: -1 })).toBe(0);
    expect(isValidDate(new Date("2026-01-01"))).toBe(true);
    expect(isValidDate(new Date("invalid"))).toBe(false);
    expect(clamp(20, 0, 10)).toBe(10);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(isNonEmptyString(" value ")).toBe(true);
    expect(isNonEmptyString(" ")).toBe(false);
    expect(isNonEmptyString(1)).toBe(false);
  });
});

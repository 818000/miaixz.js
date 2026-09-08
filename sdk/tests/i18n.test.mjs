import assert from "node:assert/strict";
import test from "node:test";

import { createMiaixzI18n, defineLocale, MiaixzLocaleCatalog } from "../dist/i18n/index.js";

const japanese = defineLocale({
  schemaVersion: 1,
  id: "ja-JP",
  label: "日本語",
  shortLabel: "日",
  version: "1.0.0",
  aliases: ["ja"],
  keywords: ["Japanese", "日本語"],
  fallback: "en-US",
});

test("locale definitions are canonical, immutable, and searchable through aliases", () => {
  const catalog = new MiaixzLocaleCatalog([japanese]);

  assert.equal(Object.isFrozen(japanese), true);
  assert.equal(Object.isFrozen(japanese.aliases), true);
  assert.equal(catalog.resolve("ja")?.id, "ja-JP");
  assert.deepEqual(
    catalog.descriptors().map(({ id, source }) => ({ id, source })),
    [
      { id: "zh-CN", source: "builtin" },
      { id: "en-US", source: "builtin" },
      { id: "ja-JP", source: "registered" },
    ],
  );
});

test("duplicate locale identifiers and aliases are rejected atomically", () => {
  assert.throws(
    () =>
      new MiaixzLocaleCatalog([
        japanese,
        defineLocale({
          schemaVersion: 1,
          id: "ja",
          label: "Japanese",
          shortLabel: "JA",
          version: "1.0.0",
        }),
      ]),
    (error) => error?.code === "I18N_LOCALE_DUPLICATE",
  );
});

test("registered locale loaders and locale-specific fallback participate in runtime changes", async () => {
  const loadedNamespaces = [];
  const locale = defineLocale({
    ...japanese,
    loadMessages: async (namespace) => {
      loadedNamespaces.push(namespace);
      return namespace === "demo" ? { "demo.greeting": "こんにちは" } : {};
    },
  });
  const i18n = createMiaixzI18n({ locales: [locale], fallbackLocale: "en-US" });
  i18n.registerMessages("demo", "en-US", { "demo.fallback": "Fallback" }, "project");

  await i18n.changeLocale("ja");

  assert.equal(i18n.locale, "ja-JP");
  assert.equal(i18n.t("demo.greeting"), "こんにちは");
  assert.equal(i18n.t("demo.fallback"), "Fallback");
  assert.deepEqual(loadedNamespaces, ["demo", "sdk"]);
});

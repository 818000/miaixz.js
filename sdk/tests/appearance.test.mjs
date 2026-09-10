import assert from "node:assert/strict";
import test from "node:test";

import {
  isMiaixzAppearanceSettings,
  miaixzDefaultAppearance,
  migrateMiaixzAppearanceV1,
  parseMiaixzAppearanceSettings,
} from "../dist/appearance/index.js";
import { createMiaixzSdk } from "../dist/sdk.js";

const testConfig = Object.freeze({
  apiBaseUrl: "https://api.example.test",
  environment: "test",
});

function createMemoryStorage() {
  const values = new Map();
  return {
    values,
    storage: {
      getItem: (key) => values.get(key) ?? null,
      removeItem: (key) => values.delete(key),
      setItem: (key, value) => values.set(key, value),
    },
  };
}

test("default appearance is a frozen schema v2 snapshot", () => {
  assert.deepEqual(miaixzDefaultAppearance, {
    theme: "miaixz",
    colorMode: "system",
    density: "standard",
  });
  assert.equal(Object.isFrozen(miaixzDefaultAppearance), true);
});

test("appearance parsing validates and normalizes theme overrides", () => {
  const appearance = parseMiaixzAppearanceSettings({
    theme: "neutral",
    colorMode: "dark",
    density: "comfortable",
    overrides: { dark: { brand: "#abcdef" } },
  });

  assert.equal(appearance.overrides?.dark?.brand, "#ABCDEF");
  assert.equal(Object.isFrozen(appearance), true);
  assert.equal(Object.isFrozen(appearance.overrides?.dark), true);
  assert.equal(isMiaixzAppearanceSettings(appearance), true);
  assert.equal(
    isMiaixzAppearanceSettings({
      theme: "Neutral",
      colorMode: "dark",
      density: "comfortable",
    }),
    false,
  );
});

test("appearance v1 migration preserves mode, density, and colors", () => {
  const appearance = migrateMiaixzAppearanceV1({
    colorMode: "system",
    density: "compact",
    colors: { brand: "#123456" },
  });

  assert.deepEqual(appearance, {
    theme: "miaixz",
    colorMode: "system",
    density: "compact",
    overrides: {
      light: { brand: "#123456" },
      dark: { brand: "#123456" },
    },
  });
  assert.equal(Object.isFrozen(appearance.overrides?.light), true);
  assert.equal(Object.isFrozen(appearance.overrides?.dark), true);
});

test("global Appearance remains stable while the tenant context changes", async () => {
  const { storage, values } = createMemoryStorage();
  const sdk = createMiaixzSdk({
    appId: "portal",
    appearanceScope: "global",
    config: testConfig,
    initialContext: { tenantId: "tenant-a" },
    storage,
  });
  await sdk.ready;

  sdk.appearance.set({
    theme: "neutral",
    colorMode: "dark",
    density: "comfortable",
  });
  sdk.context.patch({ tenantId: "tenant-b" });
  assert.deepEqual(sdk.appearance.getSnapshot(), {
    theme: "neutral",
    colorMode: "dark",
    density: "comfortable",
  });
  sdk.context.patch({ tenantId: undefined });
  assert.deepEqual(sdk.appearance.getSnapshot(), {
    theme: "neutral",
    colorMode: "dark",
    density: "comfortable",
  });
  assert.deepEqual(
    [...values.keys()].filter((key) => key.endsWith(":appearance")),
    ["miaixz:v1:global:portal:appearance"],
  );

  sdk.destroy();
});

test("tenant Appearance remains the backwards-compatible default", async () => {
  const { storage, values } = createMemoryStorage();
  const sdk = createMiaixzSdk({
    appId: "portal",
    config: testConfig,
    initialContext: { tenantId: "tenant-a" },
    storage,
  });
  await sdk.ready;

  sdk.appearance.setTheme("neutral");
  sdk.context.patch({ tenantId: "tenant-b" });
  assert.deepEqual(sdk.appearance.getSnapshot(), miaixzDefaultAppearance);
  assert.deepEqual(
    [...values.keys()].filter((key) => key.endsWith(":appearance")),
    ["miaixz:v1:tenant-a:portal:appearance"],
  );

  sdk.destroy();
});

test("the composed SDK rejects an invalid Appearance scope", () => {
  assert.throws(
    () =>
      createMiaixzSdk({
        appId: "portal",
        appearanceScope: "account",
        config: testConfig,
      }),
    (error) => error?.code === "APPEARANCE_SCOPE_INVALID",
  );
});

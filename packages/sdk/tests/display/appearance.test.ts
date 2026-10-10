/**
 * Verifies appearance normalization, persistence, migration, and change events.
 */

import assert from "node:assert/strict";
import { test } from "vitest";

import {
  isMiaixzAppearanceSettings,
  miaixzDefaultAppearance,
  migrateMiaixzAppearanceV1,
  parseMiaixzAppearanceSettings,
} from "../../src/display/index.js";
import { createMiaixzSdk } from "../../src/sdk.js";

const testConfig = Object.freeze({
  apiBaseUrl: "https://api.example.test",
  environment: "test",
});

/**
 * Creates an isolated in-memory storage implementation for appearance tests.
 *
 * @returns Storage adapter together with its observable backing map.
 */
function createMemoryStorage() {
  const values = new Map<string, string>();
  return {
    values,
    storage: {
      getItem: (key: string) => values.get(key) ?? null,
      removeItem: (key: string) => values.delete(key),
      setItem: (key: string, value: string) => values.set(key, value),
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
    shellLayout: "hybrid-dual",
    radiusScale: 1.5,
    baseFontSize: 16,
    overrides: { dark: { brand: "#abcdef" } },
  });

  assert.equal(appearance.overrides?.dark?.brand, "#ABCDEF");
  assert.equal(appearance.shellLayout, "hybrid-dual");
  assert.equal(appearance.radiusScale, 1.5);
  assert.equal(appearance.baseFontSize, 16);
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
  assert.equal(
    isMiaixzAppearanceSettings({
      theme: "neutral",
      colorMode: "dark",
      density: "comfortable",
      shellLayout: "diagonal",
    }),
    false,
  );
});

test("appearance manager persists and clears shell, radius, and typography preferences", async () => {
  const { storage } = createMemoryStorage();
  const sdk = createMiaixzSdk({ appId: "portal", config: testConfig, storage });
  await sdk.ready;

  sdk.appearance.setShellLayout("horizontal");
  sdk.appearance.setRadiusScale(0.5);
  sdk.appearance.setBaseFontSize(17);
  sdk.appearance.setOverrides({ light: { brand: "#123456" } });
  sdk.appearance.setOverrides(undefined);

  assert.deepEqual(sdk.appearance.getSnapshot(), {
    theme: "miaixz",
    colorMode: "system",
    density: "standard",
    shellLayout: "horizontal",
    radiusScale: 0.5,
    baseFontSize: 17,
  });

  sdk.appearance.setShellLayout(undefined);
  sdk.appearance.setRadiusScale(undefined);
  sdk.appearance.setBaseFontSize(undefined);
  assert.deepEqual(sdk.appearance.getSnapshot(), miaixzDefaultAppearance);
  sdk.destroy();
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
  assert.deepEqual(
    [...values.keys()].filter((key) => key.endsWith(":appearance")),
    ["miaixz:global:portal:appearance"],
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
    ["miaixz:tenant-a:portal:appearance"],
  );

  sdk.destroy();
});

test("the composed SDK rejects an invalid Appearance scope", () => {
  assert.throws(
    () =>
      createMiaixzSdk({
        appId: "portal",
        appearanceScope: "account" as unknown as "tenant",
        config: testConfig,
      }),
    (error: unknown) =>
      (error as { readonly code?: string } | undefined)?.code === "APPEARANCE_SCOPE_INVALID",
  );
});

import assert from "node:assert/strict";
import test from "node:test";

import {
  isMiaixzAppearanceSettings,
  miaixzDefaultAppearance,
  migrateMiaixzAppearanceV1,
  parseMiaixzAppearanceSettings,
} from "../dist/appearance/index.js";

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

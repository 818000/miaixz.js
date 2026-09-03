import { describe, expect, it } from "vitest";

import { resolveThemeDefinitions } from "../src/theme/resolve.js";
import { miaixzBuiltInThemes } from "../src/themes/index.js";

describe("appearance trigger geometry", () => {
  for (const theme of miaixzBuiltInThemes) {
    it(`${theme.name} shrinks the circle without changing its positioning frame`, () => {
      expect(theme.tokens.geometry.layout).toMatchObject({
        appearanceTriggerSize: 52,
        appearanceTriggerCompactSize: 48,
        appearanceTriggerVisualSize: 44,
      });
    });

    it(`${theme.name} resolves legacy definitions without the new visual diameter`, () => {
      const { appearanceTriggerVisualSize: _diameter, ...layout } = theme.tokens.geometry.layout;
      const legacy = {
        ...theme,
        tokens: { ...theme.tokens, geometry: { ...theme.tokens.geometry, layout } },
      };
      const resolved = resolveThemeDefinitions(new Map([[legacy.name, legacy]]));
      expect(resolved.get(theme.name)?.tokens.geometry.layout.appearanceTriggerVisualSize).toBe(44);
    });
  }
});

import { defineConfig } from "vitest/config";

/**
 * Defines the jsdom unit-test environment for the UI package.
 *
 * @public
 */
export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    restoreMocks: true,
  },
});

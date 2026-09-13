import { describe, expect, it } from "vitest";

import {
  assertUniqueActionIds,
  calculateMiaixzActionCapacity,
  partitionActions,
} from "../../src/shared/responsive/action-capacity.js";

describe("shared action capacity", () => {
  it("keeps index-stable visible and overflow partitions", () => {
    const duplicateObjects = [{ id: "one" }, { id: "two" }, { id: "one" }];
    const partition = partitionActions(duplicateObjects, 2);
    expect(partition.visible).toEqual(duplicateObjects.slice(0, 2));
    expect(partition.overflow).toEqual(duplicateObjects.slice(2));
  });

  it("uses the overflow measurement only after all actions stop fitting", () => {
    expect(calculateMiaixzActionCapacity(250, [50, 50, 50], 10, 60, 40)).toBe(3);
    expect(calculateMiaixzActionCapacity(220, [50, 50, 50], 10, 60, 40)).toBe(1);
    expect(calculateMiaixzActionCapacity(30, [50], 10, 0, 40)).toBe(0);
  });

  it("rejects duplicate action ids in every environment", () => {
    expect(() => assertUniqueActionIds([{ id: "same" }, { id: "same" }])).toThrow(
      expect.objectContaining({ code: "UI_ACTION_DUPLICATE_ID" }),
    );
  });
});

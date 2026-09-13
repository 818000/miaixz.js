import { describe, expect, it } from "vitest";

import { MiaixzCollectionController } from "../../src/shared/collection/controller.js";
import { getMiaixzCollectionKeyboardResult } from "../../src/shared/collection/keyboard.js";

const items = [
  { id: "a", value: "alpha", textValue: "Alpha" },
  { id: "b", value: "blocked", textValue: "Blocked", disabled: true },
  { id: "c", value: "charlie", textValue: "Charlie" },
] as const;
const vertical = { orientation: "vertical", direction: "ltr", loop: true } as const;

describe("shared collection controller", () => {
  it("skips disabled items and supports loop, Home, and End", () => {
    expect(getMiaixzCollectionKeyboardResult(items, "a", "ArrowDown", vertical).activeId).toBe("c");
    expect(getMiaixzCollectionKeyboardResult(items, "c", "ArrowDown", vertical).activeId).toBe("a");
    expect(getMiaixzCollectionKeyboardResult(items, "c", "Home", vertical).activeId).toBe("a");
    expect(getMiaixzCollectionKeyboardResult(items, "a", "End", vertical).activeId).toBe("c");
  });

  it("maps horizontal arrows through RTL direction", () => {
    const horizontal = { orientation: "horizontal", direction: "rtl", loop: true } as const;
    expect(getMiaixzCollectionKeyboardResult(items, "a", "ArrowLeft", horizontal).activeId).toBe(
      "c",
    );
    expect(getMiaixzCollectionKeyboardResult(items, "a", "ArrowRight", horizontal).activeId).toBe(
      "c",
    );
  });

  it("retains active identity across asynchronous object replacement", () => {
    const controller = new MiaixzCollectionController(items, "c");
    controller.updateItems([
      { id: "c", value: "charlie", textValue: "Updated Charlie" },
      { id: "d", value: "delta", textValue: "Delta" },
    ]);
    expect(controller.activeId).toBe("c");
    controller.updateItems([{ id: "d", value: "delta", textValue: "Delta" }]);
    expect(controller.activeId).toBe("d");
  });

  it("accumulates typeahead and cycles repeated characters", () => {
    const controller = new MiaixzCollectionController([
      { id: "a", textValue: "Apple" },
      { id: "b", textValue: "Banana" },
      { id: "bb", textValue: "Blueberry" },
    ]);
    expect(controller.handleKey("b", vertical, 100).activeId).toBe("b");
    expect(controller.handleKey("b", vertical, 200).activeId).toBe("bb");
    expect(controller.handleKey("a", vertical, 800).activeId).toBe("a");
  });

  it("rejects duplicate identity, duplicate values, and blank focus text", () => {
    expect(
      () =>
        new MiaixzCollectionController([
          { id: "same", textValue: "One" },
          { id: "same", textValue: "Two" },
        ]),
    ).toThrow(expect.objectContaining({ code: "UI_COLLECTION_DUPLICATE_ID" }));
    expect(
      () =>
        new MiaixzCollectionController([
          { id: "one", value: "same", textValue: "One" },
          { id: "two", value: "same", textValue: "Two" },
        ]),
    ).toThrow(expect.objectContaining({ code: "UI_COLLECTION_DUPLICATE_VALUE" }));
    expect(() => new MiaixzCollectionController([{ id: "one", textValue: "  " }])).toThrow(
      expect.objectContaining({ code: "UI_COLLECTION_TEXT_VALUE_INVALID" }),
    );
  });
});

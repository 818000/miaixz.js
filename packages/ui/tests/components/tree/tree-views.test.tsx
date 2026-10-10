/**
 * Implements the tree views test module.
 */

import { describe, expect, it } from "vitest";

import { createTreeCollection } from "../../../src/components/tree/tree-collection.js";
import { assertTreeViewModel } from "../../../src/components/tree/tree-view-invariants.js";
import { createTreeViewModel } from "../../../src/components/tree/tree-view-registry.js";
import { getCompactTreeVisualLevel } from "../../../src/components/tree/views/compact-tree-strategy.js";
import { createTreeFixture, multiRootTreeFixture } from "../../fixtures/tree-fixtures.js";

describe("Tree view strategies", () => {
  it.each([2, 3, 6, 10] as const)("keeps nested DFS and invariants at depth %i", (depth) => {
    const collection = createTreeCollection(createTreeFixture(depth));
    const model = createTreeViewModel("nested", {
      collection,
      expandedIds: new Set(collection.getExpandableIds()),
      viewRootId: null,
      options: {},
    });
    expect(() => assertTreeViewModel(model)).not.toThrow();
    expect(model.visibleRecords).toHaveLength(depth);
    expect(model.visibleRecords.at(-1)?.semanticLevel).toBe(depth);
  });

  it("maps balanced and dense compact depth into capped visual slots", () => {
    expect(
      Array.from({ length: 10 }, (_, index) => getCompactTreeVisualLevel(index + 1, "balanced")),
    ).toEqual([0, 1, 2, 3, 4, 5, 5, 5, 5, 5]);
    expect(
      Array.from({ length: 10 }, (_, index) => getCompactTreeVisualLevel(index + 1, "dense")),
    ).toEqual([0, 1, 2, 3, 3, 3, 3, 3, 3, 3]);
    const collection = createTreeCollection(createTreeFixture(10));
    const model = createTreeViewModel("compact", {
      collection,
      expandedIds: new Set(collection.getExpandableIds()),
      viewRootId: null,
      options: { compression: "balanced" },
    });
    expect(model.visibleRecords.at(-1)).toMatchObject({ semanticLevel: 10, visualLevel: 5 });
  });

  it("rebases focus semantics, marks a boundary, and preserves real breadcrumbs", () => {
    const collection = createTreeCollection(createTreeFixture(10));
    const model = createTreeViewModel("focus", {
      collection,
      expandedIds: new Set(collection.getExpandableIds()),
      viewRootId: "tree-depth-05",
      options: { windowDepth: 3, navigation: "both" },
    });
    expect(model.visibleRecords.map((record) => record.record.id)).toEqual([
      "tree-depth-05",
      "tree-depth-06",
      "tree-depth-07",
    ]);
    expect(model.visibleRecords.map((record) => record.semanticLevel)).toEqual([1, 2, 3]);
    expect(model.visibleRecords.at(-1)).toMatchObject({ boundary: true, disclosed: false });
    expect(model.breadcrumb.map((record) => record.id)).toEqual([
      "tree-depth-01",
      "tree-depth-02",
      "tree-depth-03",
      "tree-depth-04",
      "tree-depth-05",
    ]);
    expect(() => assertTreeViewModel(model)).not.toThrow();
  });

  it("uses the complete root set for a null focus root and rejects unknown views", () => {
    const collection = createTreeCollection(multiRootTreeFixture);
    const model = createTreeViewModel("focus", {
      collection,
      expandedIds: new Set(collection.getExpandableIds()),
      viewRootId: null,
      options: { windowDepth: 2 },
    });
    expect(model.roots).toHaveLength(2);
    expect(model.breadcrumb).toEqual([]);
    expect(() =>
      createTreeViewModel("other" as "focus", {
        collection,
        expandedIds: new Set(),
        viewRootId: null,
        options: {},
      }),
    ).toThrowError(expect.objectContaining({ code: "UI_TREE_CONFIG_INVALID" }));
  });
});

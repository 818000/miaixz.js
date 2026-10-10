/**
 * Implements the tree collection test module.
 */

import { describe, expect, it } from "vitest";

import { createTreeCollection } from "../../../src/components/tree/tree-collection.js";
import type { TreeNode } from "../../../src/components/tree/tree.types.js";
import {
  createTreeFixture,
  multiRootTreeFixture,
  wideTreeFixture,
} from "../../fixtures/tree-fixtures.js";

describe("TreeCollection", () => {
  it("indexes empty, wide, multiple-root, and ten-level trees in source order", () => {
    expect(createTreeCollection([]).size).toBe(0);
    expect(createTreeCollection(wideTreeFixture).size).toBe(12);
    expect(createTreeCollection(multiRootTreeFixture).roots).toHaveLength(2);
    const deep = createTreeCollection(createTreeFixture(10));
    expect(deep.size).toBe(10);
    expect(deep.getPath("tree-depth-10").map((record) => record.id)).toHaveLength(10);
  });

  it("queries parents, ancestors, descendants, siblings, and expansion scopes", () => {
    const collection = createTreeCollection(multiRootTreeFixture);
    expect(collection.getParent("tree-depth-03")?.id).toBe("tree-depth-02");
    expect(collection.getAncestors("tree-depth-03").map((record) => record.id)).toEqual([
      "tree-depth-01",
      "tree-depth-02",
    ]);
    expect(collection.getDescendants("tree-depth-01").map((record) => record.id)).toEqual([
      "tree-depth-02",
      "tree-depth-03",
    ]);
    expect(collection.getExpandableIds({ type: "siblings", id: "tree-root-b" })).toEqual([
      "tree-depth-01",
      "tree-depth-02",
    ]);
    expect(collection.getExpandableIds({ type: "subtree", id: "tree-depth-02" })).toEqual([
      "tree-depth-02",
    ]);
  });

  it("uses static children before cache and treats an empty array as a loaded leaf", () => {
    const nodes: readonly TreeNode[] = [
      { id: "static", label: "Static", textValue: "Static", children: [] },
      { id: "remote", label: "Remote", textValue: "Remote", hasChildren: true },
    ];
    const cache = new Map([
      ["static", [{ id: "ignored", label: "Ignored", textValue: "Ignored" }]],
      ["remote", [{ id: "loaded", label: "Loaded", textValue: "Loaded" }]],
    ] as const);
    const collection = createTreeCollection(nodes, cache);
    expect(collection.get("static")).toMatchObject({ loaded: true, expandable: false });
    expect(collection.get("ignored")).toBeUndefined();
    expect(collection.get("remote")).toMatchObject({ loaded: true, expandable: true });
    expect(collection.getChildren("remote")[0]?.id).toBe("loaded");
  });

  it("rejects duplicate, empty, cyclic, and unknown scoped identifiers", () => {
    const duplicate = [
      { id: "same", label: "A", textValue: "A" },
      { id: "same", label: "B", textValue: "B" },
    ];
    expect(() => createTreeCollection(duplicate)).toThrowError(
      expect.objectContaining({ code: "UI_TREE_DUPLICATE_ID" }),
    );
    expect(() =>
      createTreeCollection([{ id: "empty", label: "Empty", textValue: " " }]),
    ).toThrowError(expect.objectContaining({ code: "UI_TREE_TEXT_VALUE_INVALID" }));
    const cyclic: TreeNode[] = [];
    const node: TreeNode = { id: "cycle", label: "Cycle", textValue: "Cycle", children: cyclic };
    cyclic.push(node);
    expect(() => createTreeCollection([node])).toThrowError(
      expect.objectContaining({ code: "UI_TREE_DUPLICATE_ID" }),
    );
    const collection = createTreeCollection([]);
    expect(() => collection.getExpandableIds({ type: "subtree", id: "missing" })).toThrowError(
      expect.objectContaining({ code: "UI_TREE_CONFIG_INVALID" }),
    );
  });

  it("does not mutate an existing collection when rebuilding from a new cache", () => {
    const nodes: readonly TreeNode[] = [
      { id: "remote", label: "Remote", textValue: "Remote", hasChildren: true },
    ];
    const initial = createTreeCollection(nodes);
    const next = createTreeCollection(
      nodes,
      new Map([["remote", [{ id: "child", label: "Child", textValue: "Child" }]]]),
    );
    expect(initial.size).toBe(1);
    expect(initial.get("remote")?.loaded).toBe(false);
    expect(next.size).toBe(2);
  });
});

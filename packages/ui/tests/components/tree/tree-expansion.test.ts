/**
 * Implements the tree expansion test module.
 */

import { describe, expect, it, vi } from "vitest";

import { createTreeCollection } from "../../../src/components/tree/tree-collection.js";
import { runTreeExpansion } from "../../../src/components/tree/tree-expansion.js";
import type { TreeNode } from "../../../src/components/tree/tree.types.js";
import { createTreeFixture } from "../../fixtures/tree-fixtures.js";

describe("Tree expansion", () => {
  it("expands loaded records in stable breadth-first order", async () => {
    const collection = createTreeCollection(createTreeFixture(6));
    await expect(
      runTreeExpansion({ getCollection: () => collection, load: "loaded" }),
    ).resolves.toMatchObject({
      status: "completed",
      expandedIds: [
        "tree-depth-01",
        "tree-depth-02",
        "tree-depth-03",
        "tree-depth-04",
        "tree-depth-05",
      ],
      loadedIds: [],
      truncated: false,
    });
  });

  it("loads recursively with bounded concurrency and updates the collection", async () => {
    const nodes: readonly TreeNode[] = [
      { id: "root", label: "Root", textValue: "Root", hasChildren: true },
    ];
    let collection = createTreeCollection(nodes);
    const cache = new Map<string, readonly TreeNode[]>();
    let active = 0;
    let maximum = 0;
    const loadRecord = vi.fn(async (record: { readonly id: string }) => {
      active += 1;
      maximum = Math.max(maximum, active);
      const children =
        record.id === "root"
          ? [{ id: "child", label: "Child", textValue: "Child", hasChildren: true }]
          : [{ id: "leaf", label: "Leaf", textValue: "Leaf" }];
      await Promise.resolve();
      cache.set(record.id, children);
      collection = createTreeCollection(nodes, cache);
      active -= 1;
    });
    const result = await runTreeExpansion({
      getCollection: () => collection,
      load: "recursive",
      concurrency: 2,
      loadRecord,
    });
    expect(result).toMatchObject({
      status: "completed",
      expandedIds: ["root", "child"],
      loadedIds: ["root", "child"],
    });
    expect(maximum).toBeLessThanOrEqual(2);
  });

  it("returns partial for unresolved, failed, and truncated recursive work", async () => {
    const unresolved = createTreeCollection([
      { id: "remote", label: "Remote", textValue: "Remote", hasChildren: true },
    ]);
    await expect(
      runTreeExpansion({ getCollection: () => unresolved, load: "recursive" }),
    ).resolves.toMatchObject({ status: "partial", unresolvedIds: ["remote"] });

    await expect(
      runTreeExpansion({
        getCollection: () => unresolved,
        load: "recursive",
        loadRecord: async () => Promise.reject(new Error("offline")),
      }),
    ).resolves.toMatchObject({ status: "partial", failedIds: ["remote"] });

    const deep = createTreeCollection(createTreeFixture(6));
    await expect(
      runTreeExpansion({
        getCollection: () => deep,
        load: "recursive",
        maxDepth: 2,
      }),
    ).resolves.toMatchObject({ status: "partial", truncated: true });
  });

  it("returns aborted without treating it as a partial completion", async () => {
    const controller = new AbortController();
    controller.abort();
    const collection = createTreeCollection(createTreeFixture(3));
    await expect(
      runTreeExpansion({ getCollection: () => collection, signal: controller.signal }),
    ).resolves.toMatchObject({ status: "aborted", aborted: true });
  });

  it("rejects invalid traversal limits", async () => {
    const collection = createTreeCollection([]);
    await expect(
      runTreeExpansion({ getCollection: () => collection, concurrency: 0 }),
    ).rejects.toMatchObject({ code: "UI_TREE_CONFIG_INVALID" });
  });
});

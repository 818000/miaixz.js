/**
 * Implements the tree controller test module.
 */

import { act, renderHook } from "@testing-library/react";
import { StrictMode } from "react";
import { describe, expect, it, vi } from "vitest";

import { useTree } from "../../../src/components/tree/use-tree.js";
import type { TreeNode, TreeView } from "../../../src/components/tree/tree.types.js";
import { createTreeFixture } from "../../fixtures/tree-fixtures.js";

describe("useTree", () => {
  it("owns uncontrolled selection and expansion while keeping focus independent", async () => {
    const { result } = renderHook(() =>
      useTree({ label: "Tree", nodes: createTreeFixture(3), defaultExpansion: "collapsed" }),
    );
    expect(result.current.state.focusedId).toBe("tree-depth-01");
    act(() => result.current.actions.focus("tree-depth-01"));
    expect(result.current.state.selectedIds.size).toBe(0);
    await act(() => result.current.actions.expand("tree-depth-01"));
    expect(result.current.state.expandedIds.has("tree-depth-01")).toBe(true);
    act(() => result.current.actions.select("tree-depth-01"));
    expect(result.current.state.selectedIds.has("tree-depth-01")).toBe(true);
  });

  it("treats controlled values without callbacks as read-only", async () => {
    const { result } = renderHook(() =>
      useTree({
        label: "Read only",
        nodes: createTreeFixture(3),
        selectedIds: ["tree-depth-01"],
        expandedIds: [],
        view: "focus",
        viewRootId: null,
      }),
    );
    act(() => result.current.actions.toggle("tree-depth-01"));
    expect(result.current.state.expandedIds.size).toBe(0);
    await expect(result.current.actions.expandAll()).resolves.toMatchObject({
      status: "read-only",
    });
    act(() => result.current.actions.setViewRoot("tree-depth-01"));
    expect(result.current.state.viewRootId).toBeNull();
  });

  it("enters and leaves a static focus branch with one callback per state domain", async () => {
    const onExpandedIdsChange = vi.fn();
    const onViewRootIdChange = vi.fn();
    const { result, rerender } = renderHook(
      ({ expandedIds, viewRootId }) =>
        useTree({
          label: "Focus",
          nodes: createTreeFixture(6),
          expandedIds,
          onExpandedIdsChange,
          view: "focus",
          viewRootId,
          onViewRootIdChange,
          viewOptions: { windowDepth: 3 },
        }),
      { initialProps: { expandedIds: [] as readonly string[], viewRootId: null as string | null } },
    );
    await act(() => result.current.actions.enter("tree-depth-01"));
    expect(onExpandedIdsChange).toHaveBeenCalledTimes(1);
    expect(onViewRootIdChange).toHaveBeenCalledWith("tree-depth-01");
    rerender({ expandedIds: ["tree-depth-01"], viewRootId: "tree-depth-01" });
    act(() => result.current.actions.leave());
    expect(onViewRootIdChange).toHaveBeenLastCalledWith(null);
  });

  it("provides owned ARIA and roving-tabindex interaction props", () => {
    const { result } = renderHook(() =>
      useTree({
        label: "ARIA tree",
        nodes: createTreeFixture(3),
        defaultExpandedIds: ["tree-depth-01"],
      }),
    );
    expect(result.current.getRootProps()).toMatchObject({
      role: "tree",
      "aria-label": "ARIA tree",
    });
    expect(result.current.getItemProps("tree-depth-01")).toMatchObject({
      role: "treeitem",
      "aria-level": 1,
      "aria-expanded": true,
      tabIndex: 0,
    });
    expect(result.current.getItemProps("tree-depth-02").tabIndex).toBe(-1);
  });

  it("preserves state across view changes and rejects invalid commands and options", () => {
    const nodes = createTreeFixture(3);
    const { result, rerender } = renderHook(
      ({ view }: { readonly view: TreeView }) =>
        useTree({
          label: "Runtime view",
          nodes,
          view,
          defaultExpandedIds: ["tree-depth-01", "tree-depth-02"],
        }),
      { initialProps: { view: "nested" as TreeView } },
    );
    rerender({ view: "compact" });
    expect(result.current.state.expandedIds.has("tree-depth-02")).toBe(true);
    expect(() => result.current.actions.focus("missing")).toThrowError(
      expect.objectContaining({ code: "UI_TREE_CONFIG_INVALID" }),
    );
    expect(() =>
      renderHook(() =>
        useTree({
          label: "Invalid",
          nodes,
          view: "focus",
          viewOptions: { windowDepth: 1 },
        }),
      ),
    ).toThrowError(expect.objectContaining({ code: "UI_TREE_CONFIG_INVALID" }));
  });

  it("does not duplicate controlled callbacks in StrictMode", async () => {
    const onExpandedIdsChange = vi.fn();
    const wrapper = ({ children }: { readonly children: React.ReactNode }) => (
      <StrictMode>{children}</StrictMode>
    );
    const { result } = renderHook(
      () =>
        useTree({
          label: "Strict",
          nodes: createTreeFixture(2),
          expandedIds: [],
          onExpandedIdsChange,
        }),
      { wrapper },
    );
    await act(() => result.current.actions.expand("tree-depth-01"));
    expect(onExpandedIdsChange).toHaveBeenCalledTimes(1);
  });

  it("reconciles uncontrolled IDs and focus roots to the nearest surviving ancestor", () => {
    const { result, rerender } = renderHook(
      ({ nodes }) =>
        useTree({
          label: "Dynamic",
          nodes,
          defaultExpandedIds: ["tree-depth-01", "tree-depth-02", "tree-depth-03"],
          defaultSelectedIds: ["tree-depth-03"],
          view: "focus",
          defaultViewRootId: "tree-depth-03",
        }),
      { initialProps: { nodes: createTreeFixture(6) } },
    );
    act(() => result.current.actions.focus("tree-depth-03"));
    rerender({ nodes: createTreeFixture(2) });
    expect(result.current.state.selectedIds.size).toBe(0);
    expect(result.current.state.expandedIds.has("tree-depth-03")).toBe(false);
    expect(result.current.state.viewRootId).toBe("tree-depth-02");
    expect(result.current.state.focusedId).toBe("tree-depth-02");
  });

  it("isolates async cache generations and rejects invalid loaded children", async () => {
    let resolveFirst: ((value: readonly TreeNode[]) => void) | undefined;
    let firstSignal: AbortSignal | undefined;
    const loadChildren = vi.fn(
      (_node: Readonly<TreeNode>, signal: AbortSignal) =>
        new Promise<readonly TreeNode[]>((resolve, reject) => {
          resolveFirst = resolve;
          firstSignal = signal;
          signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
        }),
    );
    const remote: readonly TreeNode[] = [
      { id: "remote", label: "Remote", textValue: "Remote", hasChildren: true },
    ];
    const { result, rerender } = renderHook(
      ({ cacheKey }) =>
        useTree({ label: "Async", nodes: remote, loadChildren, asyncCacheKey: cacheKey }),
      { initialProps: { cacheKey: "tenant-a" } },
    );
    let pending: Promise<void> | undefined;
    act(() => {
      pending = result.current.actions.expand("remote");
    });
    rerender({ cacheKey: "tenant-b" });
    await expect(pending).resolves.toBeUndefined();
    expect(firstSignal?.aborted).toBe(true);
    act(() => resolveFirst?.([{ id: "remote", label: "Duplicate", textValue: "Duplicate" }]));
    expect(result.current.collection.size).toBe(1);

    const invalidLoader = vi
      .fn()
      .mockResolvedValue([{ id: "remote", label: "Duplicate", textValue: "Duplicate" }]);
    const invalid = renderHook(() =>
      useTree({ label: "Invalid async", nodes: remote, loadChildren: invalidLoader }),
    );
    await expect(invalid.result.current.actions.expand("remote")).rejects.toMatchObject({
      code: "UI_TREE_DUPLICATE_ID",
    });
  });

  it("aborts a recursive batch when the asynchronous cache generation changes", async () => {
    const onExpandedIdsChange = vi.fn();
    const loadChildren = vi.fn(
      (_node: Readonly<TreeNode>, signal: AbortSignal) =>
        new Promise<readonly TreeNode[]>((resolve, reject) => {
          signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
          void resolve;
        }),
    );
    const nodes: readonly TreeNode[] = [
      { id: "remote", label: "Remote", textValue: "Remote", hasChildren: true },
    ];
    const { result, rerender } = renderHook(
      ({ cacheKey }) =>
        useTree({
          label: "Batch generation",
          nodes,
          loadChildren,
          asyncCacheKey: cacheKey,
          expandedIds: [],
          onExpandedIdsChange,
        }),
      { initialProps: { cacheKey: "tenant-a" } },
    );
    let pending: ReturnType<typeof result.current.actions.expandAll> | undefined;
    act(() => {
      pending = result.current.actions.expandAll({ load: "recursive" });
    });
    rerender({ cacheKey: "tenant-b" });
    await expect(pending).resolves.toMatchObject({ status: "aborted", aborted: true });
    expect(onExpandedIdsChange).not.toHaveBeenCalled();
  });
});

import "@testing-library/jest-dom/vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createMiaixzI18n } from "@miaixz/sdk/i18n";

import { Tree, type TreeNode } from "../src/components/tree/index.js";
import { useTreeAsyncLoader } from "../src/components/tree/tree-async-loader.js";
import { MiaixzLocaleProvider, miaixzUiMessages } from "../src/i18n/index.js";

afterEach(cleanup);

const nodes: readonly TreeNode[] = [
  {
    id: "platform",
    label: "平台",
    textValue: "平台",
    children: [
      { id: "services", label: "服务", textValue: "服务" },
      { id: "settings", label: "设置", textValue: "设置" },
    ],
  },
  { id: "audit", label: "审计", textValue: "审计" },
];

describe("Tree", () => {
  it("keeps expansion, selection and keyboard navigation semantics", () => {
    const onExpandedIdsChange = vi.fn();
    const onSelectedIdsChange = vi.fn();
    render(
      <MiaixzLocaleProvider
        i18n={createMiaixzI18n({ locale: "zh-CN", messages: miaixzUiMessages })}
      >
        <Tree
          label="平台目录"
          nodes={nodes}
          onExpandedIdsChange={onExpandedIdsChange}
          onSelectedIdsChange={onSelectedIdsChange}
        />
      </MiaixzLocaleProvider>,
    );

    const platform = screen.getByRole("treeitem", { name: "平台" });
    platform.focus();
    fireEvent.keyDown(platform, { key: "ArrowRight" });
    expect(onExpandedIdsChange).toHaveBeenLastCalledWith(["platform"]);
    expect(platform).toHaveAttribute("aria-expanded", "true");
    const services = screen.getByRole("treeitem", { name: "服务" });

    fireEvent.keyDown(platform, { key: "ArrowRight" });
    expect(services).toHaveFocus();
    fireEvent.keyDown(services, { key: " " });
    expect(onSelectedIdsChange).toHaveBeenLastCalledWith(["services"]);
    expect(services).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(services, { key: "ArrowDown" });
    expect(screen.getByRole("treeitem", { name: "设置" })).toHaveFocus();
    fireEvent.keyDown(document.activeElement!, { key: "End" });
    expect(screen.getByRole("treeitem", { name: "审计" })).toHaveFocus();
    fireEvent.keyDown(document.activeElement!, { key: "Home" });
    expect(platform).toHaveFocus();
    fireEvent.keyDown(platform, { key: "ArrowLeft" });
    expect(platform).toHaveAttribute("aria-expanded", "false");
  });

  it("keeps long nested labels reachable while preserving outline hierarchy", () => {
    const longLabel = "这是一个需要在窄目录中截断显示但仍保留完整可访问名称的超长节点标签";
    render(
      <MiaixzLocaleProvider
        i18n={createMiaixzI18n({ locale: "zh-CN", messages: miaixzUiMessages })}
      >
        <Tree
          label="长标签目录"
          nodes={[
            {
              id: "root",
              label: "根节点",
              textValue: "根节点",
              children: [{ id: "long", label: longLabel, textValue: longLabel }],
            },
          ]}
          defaultExpandedIds={["root"]}
          defaultSelectedIds={["long"]}
          connectors
          surface="plain"
        />
      </MiaixzLocaleProvider>,
    );

    const root = screen.getByRole("treeitem", { name: "根节点" });
    const nested = screen.getByRole("treeitem", { name: longLabel });
    expect(root).toHaveAttribute("aria-level", "1");
    expect(root).toHaveAttribute("aria-expanded", "true");
    expect(nested).toHaveAttribute("aria-level", "2");
    expect(nested).toHaveAttribute("aria-selected", "true");
    expect(nested.querySelector(".miaixz-tree-label")).toHaveTextContent(longLabel);
  });

  it("retains controlled multiple selection and disabled nodes", () => {
    const onSelectedIdsChange = vi.fn();
    render(
      <MiaixzLocaleProvider
        i18n={createMiaixzI18n({ locale: "zh-CN", messages: miaixzUiMessages })}
      >
        <Tree
          label="受控目录"
          nodes={[...nodes, { id: "locked", label: "锁定", textValue: "锁定", disabled: true }]}
          onSelectedIdsChange={onSelectedIdsChange}
          selectedIds={["audit"]}
          selectionMode="multiple"
        />
      </MiaixzLocaleProvider>,
    );
    expect(screen.getByRole("tree", { name: "受控目录" })).toHaveAttribute(
      "aria-multiselectable",
      "true",
    );
    expect(screen.getByRole("treeitem", { name: "审计" })).toHaveAttribute("aria-selected", "true");
    const locked = screen.getByRole("treeitem", { name: "锁定" });
    fireEvent.click(locked.firstElementChild!);
    expect(locked).toHaveAttribute("aria-disabled", "true");
    expect(onSelectedIdsChange).not.toHaveBeenCalled();
  });
});

describe("Tree async loader", () => {
  const parent: TreeNode<string> = {
    id: "remote",
    label: "Remote",
    textValue: "Remote",
    value: "remote",
  };

  it("does nothing without a loader and for disabled nodes", () => {
    const withoutLoader = renderHook(() => useTreeAsyncLoader<string>(undefined));
    expect(withoutLoader.result.current.load(parent)).toBeUndefined();
    withoutLoader.unmount();

    const loader = vi.fn();
    const withLoader = renderHook(() => useTreeAsyncLoader(loader));
    expect(withLoader.result.current.load({ ...parent, disabled: true })).toBeUndefined();
    expect(loader).not.toHaveBeenCalled();
    withLoader.unmount();
  });

  it("deduplicates pending work and caches a successful child list", async () => {
    let resolveLoad: ((nodes: readonly TreeNode<string>[]) => void) | undefined;
    const loader = vi.fn(
      (_node: Readonly<TreeNode<string>>, signal: AbortSignal) =>
        new Promise<readonly TreeNode<string>[]>((resolve) => {
          expect(signal.aborted).toBe(false);
          resolveLoad = resolve;
        }),
    );
    const { result, unmount } = renderHook(() => useTreeAsyncLoader(loader));
    let first: Promise<readonly TreeNode<string>[]> | undefined;
    act(() => {
      first = result.current.load(parent);
      expect(result.current.load(parent)).toBe(first);
    });
    expect(result.current.loadingIds.has("remote")).toBe(true);
    await act(async () => {
      resolveLoad?.([{ id: "child", label: "Child", textValue: "Child", value: "child" }]);
      await first;
    });
    expect(result.current.childCache.get("remote")?.[0]?.id).toBe("child");
    expect(result.current.loadingIds.has("remote")).toBe(false);
    expect(result.current.errorIds.has("remote")).toBe(false);
    unmount();
  });

  it("records failures, clears them on retry, and aborts pending work on unmount", async () => {
    const failure = new Error("offline");
    const loader = vi
      .fn()
      .mockRejectedValueOnce(failure)
      .mockImplementationOnce(
        (_node: Readonly<TreeNode<string>>, signal: AbortSignal) =>
          new Promise<readonly TreeNode<string>[]>((_resolve) => {
            signal.addEventListener("abort", () => undefined);
          }),
      );
    const { result, unmount } = renderHook(() => useTreeAsyncLoader(loader));
    let failed: Promise<readonly TreeNode<string>[]> | undefined;
    act(() => {
      failed = result.current.load(parent);
    });
    await expect(failed).rejects.toBe(failure);
    await waitFor(() => expect(result.current.errorIds.has("remote")).toBe(true));

    let pending: Promise<readonly TreeNode<string>[]> | undefined;
    act(() => {
      pending = result.current.load(parent);
    });
    expect(pending).toBeDefined();
    expect(result.current.errorIds.has("remote")).toBe(false);
    const signal = loader.mock.calls[1]?.[1] as AbortSignal;
    unmount();
    expect(signal.aborted).toBe(true);
  });
});

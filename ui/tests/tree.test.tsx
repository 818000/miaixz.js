import { readFileSync } from "node:fs";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createMiaixzI18n } from "@miaixz/sdk/i18n";

import { Tree, type TreeNode } from "../src/components/tree/index.js";
import { MiaixzLocaleProvider, miaixzUiMessages } from "../src/i18n/index.js";

afterEach(cleanup);

const nodes: readonly TreeNode[] = [
  {
    id: "platform",
    label: "平台",
    children: [
      { id: "services", label: "服务" },
      { id: "settings", label: "设置" },
    ],
  },
  { id: "audit", label: "审计" },
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

  it("uses the registered medium weight for outline roots", () => {
    const css = readFileSync("src/styles/components/tree.css", "utf8");
    const defaultSelector = ".miaixz-tree-label {";
    const defaultStart = css.indexOf(defaultSelector);
    const defaultRule = css.slice(defaultStart, css.indexOf("}", defaultStart));
    const selector =
      ".miaixz-tree-outline > .miaixz-tree-item > .miaixz-tree-row .miaixz-tree-label";
    const start = css.indexOf(selector);
    const rule = css.slice(start, css.indexOf("}", start));
    expect(defaultStart).toBeGreaterThan(-1);
    expect(defaultRule).toContain("font-weight: var(--miaixz-font-weight-regular)");
    expect(defaultRule).not.toContain("font-family");
    expect(start).toBeGreaterThan(-1);
    expect(rule).toContain("font-weight: var(--miaixz-font-weight-medium)");
    expect(css).not.toContain("--miaixz-font-weight-semibold");
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
              children: [{ id: "long", label: longLabel }],
            },
          ]}
          defaultExpandedIds={["root"]}
          defaultSelectedIds={["long"]}
          showLevelIndicator
          variant="outline"
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
          nodes={[...nodes, { id: "locked", label: "锁定", disabled: true }]}
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

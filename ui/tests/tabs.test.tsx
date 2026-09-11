import { readFileSync } from "node:fs";
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";

import { ModuleFrame } from "../src/components/module-frame/index.js";
import { Tabs } from "../src/components/tabs/index.js";

/**
 * Renders the controlled route tabs used by ModuleFrame consumers.
 *
 * @returns A module frame with route-level navigation.
 */
function ModuleTabsFixture() {
  const [value, setValue] = useState("overview");
  return (
    <ModuleFrame
      aria-label="空间模块"
      navigation={{
        label: "空间导航",
        value,
        onValueChange: setValue,
        items: [
          { id: "overview", label: "概览" },
          { id: "dataset", label: "数据集" },
          { id: "disabled", label: "已禁用", disabled: true },
        ],
      }}
      title="客户增长空间"
    >
      <p>模块业务内容</p>
    </ModuleFrame>
  );
}

afterEach(cleanup);

describe("Tabs", () => {
  it("keeps density-aware spacing below navigation tabs unless explicitly removed", () => {
    const css = readFileSync("src/styles/components/tabs.css", "utf8");
    const panelRule = css.match(/\.miaixz-tab-panel\s*\{([^}]*)\}/u)?.[1];
    const flushPanelRule = css.match(
      /\.miaixz-tabs-panel-padding-none\s*>\s*\.miaixz-tab-panel\s*\{([^}]*)\}/u,
    )?.[1];

    expect(panelRule).toContain("padding-block-start: var(--miaixz-density-panel-padding)");
    expect(flushPanelRule).toContain("padding-block-start: 0");
    expect(css).not.toMatch(/\.miaixz-tabs-navigation\s*>\s*\.miaixz-tab-panel\s*\{[^}]*padding/u);
  });

  it("preserves controlled navigation state and keyboard behavior inside ModuleFrame", async () => {
    render(<ModuleTabsFixture />);
    const tabs = screen.getAllByRole("tab");
    expect(screen.getByRole("tablist", { name: "空间导航" })).toHaveAttribute(
      "aria-orientation",
      "horizontal",
    );
    expect(tabs).toHaveLength(3);
    expect(screen.getByRole("tab", { name: "概览" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "已禁用" })).toBeDisabled();
    expect(screen.getByText("模块业务内容")).toBeVisible();

    const user = userEvent.setup();
    screen.getByRole("tab", { name: "概览" }).focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "数据集" })).toHaveFocus();
    expect(screen.getByRole("tab", { name: "数据集" })).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "概览" })).toHaveFocus();
    expect(screen.getByRole("tab", { name: "概览" })).toHaveAttribute("aria-selected", "true");

    const css = readFileSync("src/styles/components/tabs.css", "utf8");
    const selectedRule = css.match(
      /\.miaixz-tabs-navigation[\s\S]*?\.miaixz-tab\[aria-selected="true"\]\s*\{([^}]*)\}/u,
    )?.[1];
    expect(selectedRule).toContain("color: var(--miaixz-color-brand)");
    expect(selectedRule).toContain("background: transparent");
    expect(selectedRule).not.toMatch(/#[0-9a-f]{3,8}|rgb\(/iu);
  });

  it("keeps header actions outside the tablist and preserves tab panels", () => {
    render(
      <Tabs
        label="内容"
        actions={<button type="button">搜索</button>}
        items={[{ value: "a", label: "A", content: <p>内容 A</p> }]}
      />,
    );
    const action = screen.getByRole("button", { name: "搜索" });
    expect(action.closest(".miaixz-tabs-header")?.getAttribute("data-actions-placement")).toBe(
      "end",
    );
    expect(action.closest('[role="tablist"]')).toBeNull();
    expect(screen.getByRole("tabpanel", { name: "A" }).textContent).toBe("内容 A");

    const css = readFileSync("src/styles/components/tabs.css", "utf8");
    const headerListRule = css.match(
      /(?:^|\n)\.miaixz-tabs-header\s*>\s*\.miaixz-tabs-list\s*\{([^}]*)\}/u,
    )?.[1];
    expect(headerListRule).toContain("align-self: stretch");
    expect(headerListRule).toContain("border-bottom: 0");
  });
  it("supports adjacent actions without adding them to tab keyboard navigation", async () => {
    render(
      <Tabs
        actionsPlacement="adjacent"
        headerInset
        label="编辑模式"
        actions={<button type="button">版本对比</button>}
        items={[
          { value: "keys", label: "Key-Value", content: <p>键值内容</p> },
          { value: "source", label: "源码", content: <p>源码内容</p> },
        ]}
      />,
    );
    const action = screen.getByRole("button", { name: "版本对比" });
    expect(action.closest(".miaixz-tabs-header")?.getAttribute("data-actions-placement")).toBe(
      "adjacent",
    );
    expect(action.closest('[role="tablist"]')).toBeNull();
    expect(screen.getAllByRole("tab")).toHaveLength(2);
    expect(action.closest(".miaixz-tabs-header")?.getAttribute("data-inset")).toBe("true");
    const user = userEvent.setup();
    screen.getByRole("tab", { name: "Key-Value" }).focus();
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "源码" }));
    expect(screen.getByRole("tabpanel", { name: "源码" }).textContent).toBe("源码内容");
    await user.tab();
    expect(document.activeElement).toBe(action);
  });
  it("keeps interactive panels out of the sequential focus order by default", () => {
    render(
      <Tabs
        items={[
          {
            content: <input aria-label="密码" />,
            label: "密码登录",
            value: "password",
          },
        ]}
        label="登录方式"
      />,
    );

    expect(screen.getByRole("tabpanel", { name: "密码登录" }).hasAttribute("tabindex")).toBe(false);
  });

  it("supports an explicitly focusable panel", () => {
    render(
      <Tabs
        items={[
          {
            content: <p>静态说明</p>,
            label: "说明",
            panelTabIndex: 0,
            value: "description",
          },
        ]}
        label="内容"
      />,
    );

    expect(screen.getByRole("tabpanel", { name: "说明" }).getAttribute("tabindex")).toBe("0");
  });
});

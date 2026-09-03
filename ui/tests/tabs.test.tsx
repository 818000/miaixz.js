import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { Tabs } from "../src/components/tabs/index.js";

afterEach(cleanup);

describe("Tabs", () => {
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

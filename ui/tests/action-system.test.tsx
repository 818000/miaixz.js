/*
 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
 ~                                                                           ~
 ~ Copyright (c) 2015-2026 miaixz.org and other contributors.                ~
 ~                                                                           ~
 ~ Licensed under the Apache License, Version 2.0 (the "License");           ~
 ~ you may not use this file except in compliance with the License.          ~
 ~ You may obtain a copy of the License at                                   ~
 ~                                                                           ~
 ~      https://www.apache.org/licenses/LICENSE-2.0                          ~
 ~                                                                           ~
 ~ Unless required by applicable law or agreed to in writing, software       ~
 ~ distributed under the License is distributed on an "AS IS" BASIS,         ~
 ~ WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  ~
 ~ See the License for the specific language governing permissions and       ~
 ~ limitations under the License.                                            ~
 ~                                                                           ~
 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
*/

import { createMiaixzI18n } from "@miaixz/sdk/i18n";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ActionBar,
  ActionText,
  Dropdown,
  FormActions,
  IconButton,
  miaixzUiMessages,
  MiaixzLocaleProvider,
  MoreActions,
  RowActions,
  type ActionDescriptor,
  type CommandAction,
} from "../src/index.js";

afterEach(cleanup);

const removedHiddenClassName = ["miaixz", "visually", "hidden"].join("-");

/**
 * Supplies framework localization to one action-system test.
 *
 * @param content - Component under test.
 * @returns The testing-library render result.
 */
function renderAction(content: React.ReactNode) {
  return render(
    <MiaixzLocaleProvider i18n={createMiaixzI18n({ locale: "zh-CN", messages: miaixzUiMessages })}>
      {content}
    </MiaixzLocaleProvider>,
  );
}

/**
 * Creates a complete command descriptor without bypassing the frozen contract.
 *
 * @param overrides - Descriptor values changed by the test.
 * @returns A resolved command action.
 */
function commandAction(overrides: Partial<CommandAction> = {}): CommandAction {
  return {
    id: "edit",
    kind: "command",
    label: "编辑",
    icon: "Pencil",
    tone: "neutral",
    onAction: vi.fn(),
    ...overrides,
  };
}

/**
 * Creates a complete primary command descriptor.
 *
 * @param overrides - Descriptor values changed by the test.
 * @returns A resolved primary action.
 */
function primaryAction(overrides: Partial<CommandAction> = {}): CommandAction {
  return {
    id: "save",
    kind: "command",
    label: "保存",
    icon: "Save",
    tone: "brand",
    onAction: vi.fn(),
    ...overrides,
  };
}

describe("ActionText", () => {
  it("uses a button for commands and an anchor for navigation", () => {
    const onEdit = vi.fn();
    renderAction(
      <>
        <ActionText action={commandAction({ onAction: onEdit })} />
        <ActionText
          action={{
            id: "view",
            kind: "navigation",
            label: "查看详情",
            icon: "Eye",
            tone: "neutral",
            href: "/details",
          }}
        />
      </>,
    );

    fireEvent.click(screen.getByRole("button", { name: "编辑" }));
    expect(onEdit).toHaveBeenCalledOnce();
    expect(screen.getByRole("link", { name: "查看详情" })).toHaveAttribute("href", "/details");
  });

  it("owns its icon and disables a loading command", () => {
    renderAction(<ActionText action={commandAction({ loading: true })} />);

    const action = screen.getByRole("button", { name: "编辑" });
    expect(action).toBeDisabled();
    expect(action).toHaveAttribute("aria-busy", "true");
    expect(action.querySelector("svg")).not.toBeNull();
    expect(action.querySelector(".miaixz-hidden")).toHaveTextContent("加载中");
    expect(action.querySelector(`.${removedHiddenClassName}`)).toBeNull();
  });
});

describe("IconButton", () => {
  it("provides an accessible name without rendering visible action text", () => {
    renderAction(<IconButton label="关闭" icon="X" onClick={() => undefined} />);

    const action = screen.getByRole("button", { name: "关闭" });
    expect(action).toHaveClass("miaixz-icon-button");
    expect(action.querySelector(".miaixz-action-label")).toBeNull();
  });
});

describe("MoreActions", () => {
  it("keeps destructive actions last and separated in the menu", () => {
    renderAction(
      <MoreActions
        actions={[
          commandAction({
            id: "delete",
            label: "删除",
            icon: "Trash2",
            tone: "danger",
          }),
          commandAction({ id: "export", label: "导出", icon: "Download" }),
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "更多操作" }));
    const menu = screen.getByRole("menu", { name: "更多操作" });
    expect(
      within(menu)
        .getAllByRole("menuitem")
        .map((item) => item.textContent),
    ).toEqual(["导出", "删除"]);
    expect(menu.querySelector("hr")).not.toBeNull();
    expect(document.querySelector("button button")).toBeNull();
  });
});

describe("Dropdown", () => {
  it("supports a native anchor trigger without navigating away", () => {
    renderAction(
      <Dropdown
        items={[
          {
            id: "archived",
            kind: "action",
            label: "已归档",
            textValue: "已归档",
            onAction: () => undefined,
          },
        ]}
        label="空间分类"
        trigger={<button type="button">更多</button>}
      />,
    );

    const trigger = screen.getByRole("button", { name: "更多" });
    fireEvent.click(trigger);
    expect(screen.getByRole("menu", { name: "空间分类" })).toBeVisible();
  });
});

describe("RowActions", () => {
  it("uses the deterministic zero-capacity hydration partition without layout", () => {
    renderAction(
      <RowActions
        actions={[
          commandAction({ id: "edit" }),
          commandAction({ id: "view", label: "查看", icon: "Eye" }),
          commandAction({
            id: "delete",
            label: "删除",
            icon: "Trash2",
            tone: "danger",
          }),
        ]}
      />,
    );

    expect(screen.queryByRole("button", { name: "编辑" })).toBeNull();
    expect(screen.queryByRole("button", { name: "查看" })).toBeNull();
    expect(screen.queryByRole("button", { name: "删除" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "更多操作" }));
    expect(screen.getByRole("menuitem", { name: "编辑" })).toBeVisible();
    expect(screen.getByRole("menuitem", { name: "查看" })).toBeVisible();
    expect(screen.getByRole("menuitem", { name: "删除" })).toBeVisible();
  });
});

describe("ActionBar", () => {
  it("keeps the primary visible during the zero-capacity hydration partition", () => {
    renderAction(
      <ActionBar
        primary={primaryAction({ label: "新建", icon: "Plus" })}
        actions={[
          commandAction({ id: "edit" }),
          commandAction({ id: "refresh", label: "刷新", icon: "RefreshCw" }),
          commandAction({ id: "export", label: "导出", icon: "Download" }),
        ]}
      />,
    );

    expect(screen.getByRole("button", { name: "新建" })).toHaveAttribute("data-variant", "solid");
    expect(screen.queryByRole("button", { name: "编辑" })).toBeNull();
    expect(screen.queryByRole("button", { name: "刷新" })).toBeNull();
    expect(screen.queryByRole("button", { name: "导出" })).toBeNull();
    expect(screen.getAllByRole("button", { name: "更多操作" })).toHaveLength(1);
  });
});

describe("FormActions", () => {
  it("uses native cancel and submit semantics without a second dirty state", () => {
    const { rerender } = renderAction(
      <form>
        <FormActions
          cancel={{ id: "cancel", label: "取消", onAction: () => undefined }}
          submit={{ id: "save", label: "保存", disabled: true }}
        />
      </form>,
    );
    expect(screen.getByRole("button", { name: "保存" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "保存" })).toHaveAttribute("type", "submit");

    rerender(
      <MiaixzLocaleProvider
        i18n={createMiaixzI18n({ locale: "zh-CN", messages: miaixzUiMessages })}
      >
        <form>
          <FormActions
            cancel={{ id: "cancel", label: "取消", onAction: () => undefined }}
            submit={{ id: "save", label: "保存", loading: true }}
          />
        </form>
      </MiaixzLocaleProvider>,
    );
    expect(screen.getByRole("button", { name: "取消" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "保存" })).toBeDisabled();
  });
});

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
  FormActions,
  IconButton,
  miaixzUiMessages,
  MiaixzLocaleProvider,
  MoreActions,
  RowActions,
  type ActionDescriptor,
  type PrimaryActionDescriptor,
} from "../src/index.js";

afterEach(cleanup);

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
function commandAction(overrides: Partial<ActionDescriptor> = {}): ActionDescriptor {
  return {
    id: "edit",
    intent: "edit",
    label: "编辑",
    icon: "Pencil",
    tone: "neutral",
    confirm: "none",
    placement: "visible",
    onAction: vi.fn(),
    ...overrides,
  } as ActionDescriptor;
}

/**
 * Creates a complete primary command descriptor.
 *
 * @param overrides - Descriptor values changed by the test.
 * @returns A resolved primary action.
 */
function primaryAction(overrides: Partial<PrimaryActionDescriptor> = {}): PrimaryActionDescriptor {
  return {
    id: "save",
    intent: "save",
    label: "保存",
    icon: "Save",
    tone: "brand",
    confirm: "none",
    placement: "form-primary",
    onAction: vi.fn(),
    ...overrides,
  } as PrimaryActionDescriptor;
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
            intent: "view",
            label: "查看详情",
            icon: "Eye",
            tone: "neutral",
            confirm: "none",
            placement: "visible",
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
  });
});

describe("IconButton", () => {
  it("provides an accessible name without rendering visible action text", () => {
    renderAction(
      <IconButton action={commandAction({ label: "关闭", icon: "X", intent: "close" })} />,
    );

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
            intent: "delete",
            label: "删除",
            icon: "Trash2",
            tone: "danger",
          }),
          commandAction({ id: "export", intent: "export", label: "导出", icon: "Download" }),
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

describe("RowActions", () => {
  it("shows two safe text actions and moves danger to overflow on desktop", () => {
    renderAction(
      <RowActions
        actions={[
          commandAction({ id: "edit" }),
          commandAction({ id: "view", intent: "view", label: "查看", icon: "Eye" }),
          commandAction({
            id: "delete",
            intent: "delete",
            label: "删除",
            icon: "Trash2",
            tone: "danger",
          }),
        ]}
      />,
    );

    expect(screen.getByRole("button", { name: "编辑" })).toBeVisible();
    expect(screen.getByRole("button", { name: "查看" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "删除" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "更多操作" }));
    expect(screen.getByRole("menuitem", { name: "删除" })).toBeVisible();
  });
});

describe("ActionBar", () => {
  it("keeps one primary button and at most two ordinary text actions visible", () => {
    renderAction(
      <ActionBar
        primary={primaryAction({ label: "新建", intent: "create", icon: "Plus" })}
        actions={[
          commandAction({ id: "edit" }),
          commandAction({ id: "refresh", intent: "refresh", label: "刷新", icon: "RefreshCw" }),
          commandAction({ id: "export", intent: "export", label: "导出", icon: "Download" }),
        ]}
      />,
    );

    expect(screen.getByRole("button", { name: "新建" })).toHaveClass("miaixz-button-primary");
    expect(screen.getByRole("button", { name: "编辑" })).toHaveClass("miaixz-action-text");
    expect(screen.getByRole("button", { name: "刷新" })).toHaveClass("miaixz-action-text");
    expect(screen.queryByRole("button", { name: "导出" })).toBeNull();
    expect(screen.getAllByRole("button", { name: "更多操作" })).toHaveLength(1);
  });
});

describe("FormActions", () => {
  it("keeps submit disabled until dirty and locks cancel while submitting", () => {
    const { rerender } = renderAction(
      <FormActions
        cancel={commandAction({ id: "cancel", intent: "cancel", label: "取消" })}
        dirty={false}
        submit={primaryAction()}
      />,
    );
    expect(screen.getByRole("button", { name: "保存" })).toBeDisabled();

    rerender(
      <MiaixzLocaleProvider
        i18n={createMiaixzI18n({ locale: "zh-CN", messages: miaixzUiMessages })}
      >
        <FormActions
          cancel={commandAction({ id: "cancel", intent: "cancel", label: "取消" })}
          submit={primaryAction({ loading: true })}
        />
      </MiaixzLocaleProvider>,
    );
    expect(screen.getByRole("button", { name: "取消" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "加载中" })).toBeDisabled();
  });
});

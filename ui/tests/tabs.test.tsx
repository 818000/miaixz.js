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

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Tabs } from "../src/components/tabs/index.js";

afterEach(cleanup);

const items = [
  { value: "details", label: "详情", content: <p>详情内容</p> },
  { value: "source", label: "源码", content: <p>源码内容</p> },
] as const;

describe("Tabs", () => {
  it("renders one data-driven tablist and changes the uncontrolled value with the keyboard", () => {
    render(<Tabs defaultValue="details" items={items} label="内容" activationMode="automatic" />);
    const details = screen.getByRole("tab", { name: "详情" });
    const source = screen.getByRole("tab", { name: "源码" });

    details.focus();
    fireEvent.keyDown(details, { key: "ArrowRight" });

    expect(source).toHaveFocus();
    expect(source).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel", { name: "源码" })).toHaveTextContent("源码内容");
  });

  it("reports controlled changes and rejects an unavailable explicit value", () => {
    const onValueChange = vi.fn();
    render(<Tabs items={items} label="内容" value="details" onValueChange={onValueChange} />);
    fireEvent.click(screen.getByRole("tab", { name: "源码" }));
    expect(onValueChange).toHaveBeenCalledWith("source");

    expect(() => render(<Tabs items={items} label="无效" value="missing" />)).toThrowError(
      expect.objectContaining({ code: "UI_TABS_VALUE_INVALID" }),
    );
  });

  it("covers vertical manual navigation, disabled tabs, counts, and slot owner state", () => {
    const onValueChange = vi.fn();
    const verticalItems = [
      { value: "one", label: "One", content: "One content", count: 1, panelTabIndex: 0 },
      { value: "disabled", label: "Disabled", content: "Disabled content", disabled: true },
      { value: "three", label: "Three", content: "Three content", count: 3 },
    ] as const;
    const { container } = render(
      <Tabs
        activationMode="manual"
        items={verticalItems}
        label="Vertical"
        onValueChange={onValueChange}
        orientation="vertical"
        slotProps={{
          root: { className: "tabs-root" },
          list: { className: "tabs-list" },
          tab: ({ selected }) => ({ className: selected ? "tab-selected" : "tab-idle" }),
          label: { className: "tab-label" },
          count: { className: "tab-count" },
          panel: ({ selected }) => ({ className: selected ? "panel-selected" : "panel-idle" }),
        }}
      />,
    );
    const one = screen.getByRole("tab", { name: "One1" });
    const three = screen.getByRole("tab", { name: "Three3" });
    expect(screen.getByRole("tab", { name: "Disabled" })).toBeDisabled();
    expect(container.querySelector(".tabs-list")).toHaveAttribute("aria-orientation", "vertical");
    one.focus();
    fireEvent.keyDown(one, { key: "ArrowDown" });
    expect(three).toHaveFocus();
    expect(onValueChange).not.toHaveBeenCalled();
    fireEvent.keyDown(three, { key: "Enter" });
    expect(onValueChange).toHaveBeenCalledWith("three");
    fireEvent.keyDown(three, { key: "Home" });
    expect(one).toHaveFocus();
    fireEvent.keyDown(one, { key: "End" });
    expect(three).toHaveFocus();
    fireEvent.keyDown(three, { key: "ArrowUp" });
    expect(one).toHaveFocus();
    fireEvent.keyDown(one, { key: "Unidentified" });
    expect(one).toHaveFocus();
    expect(container.querySelector('.miaixz-tab-panel[tabindex="0"]')).toHaveTextContent(
      "One content",
    );
  });

  it("keeps readonly controlled tabs fixed and validates duplicates and disabled initial values", () => {
    const readonly = render(<Tabs items={items} label="Readonly" value="details" />);
    const source = screen.getByRole("tab", { name: "源码" });
    expect(source).toBeDisabled();
    fireEvent.keyDown(screen.getByRole("tab", { name: "详情" }), { key: "ArrowRight" });
    fireEvent.click(source);
    expect(screen.getByRole("tab", { name: "详情" })).toHaveAttribute("aria-selected", "true");
    readonly.unmount();

    expect(() => render(<Tabs items={[items[0], items[0]]} label="Duplicate" />)).toThrowError(
      expect.objectContaining({ code: "UI_TABS_DUPLICATE_VALUE" }),
    );
    expect(() =>
      render(
        <Tabs
          defaultValue="disabled"
          items={[{ value: "disabled", label: "Disabled", content: "Content", disabled: true }]}
          label="Disabled initial"
        />,
      ),
    ).toThrowError(expect.objectContaining({ code: "UI_TABS_VALUE_INVALID" }));
  });
});

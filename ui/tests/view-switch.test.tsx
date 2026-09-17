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
import { cleanup, fireEvent, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ViewSwitch } from "../src/components/view-switch/index.js";
import { renderWithLocale } from "./test-utils.js";

afterEach(cleanup);

describe("ViewSwitch", () => {
  it("keeps list first, grid second, and exposes the current view through aria-pressed", () => {
    const onValueChange = vi.fn();
    renderWithLocale(
      <ViewSwitch
        aria-label="内容展示方式"
        gridLabel="网格视图"
        listLabel="列表视图"
        onValueChange={onValueChange}
        value="grid"
      />,
    );

    const group = screen.getByRole("group", { name: "内容展示方式" });
    const buttons = within(group).getAllByRole("button");
    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toHaveAccessibleName("列表视图");
    expect(buttons[0]).toHaveAttribute("aria-pressed", "false");
    expect(buttons[1]).toHaveAccessibleName("网格视图");
    expect(buttons[1]).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(buttons[0]!);
    expect(onValueChange).toHaveBeenCalledOnce();
    expect(onValueChange).toHaveBeenCalledWith("list");
  });

  it("does not emit redundant or disabled changes", () => {
    const onValueChange = vi.fn();
    renderWithLocale(
      <ViewSwitch
        aria-label="展示方式"
        gridLabel="网格视图"
        listLabel="列表视图"
        onValueChange={onValueChange}
        value="list"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "列表视图" }));
    expect(onValueChange).not.toHaveBeenCalled();

    cleanup();
    renderWithLocale(
      <ViewSwitch
        aria-label="展示方式"
        disabled
        gridLabel="网格视图"
        listLabel="列表视图"
        onValueChange={onValueChange}
        value="list"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "网格视图" }));
    expect(onValueChange).not.toHaveBeenCalled();
  });
});

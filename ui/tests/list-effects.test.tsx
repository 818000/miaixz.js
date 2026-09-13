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

import { List } from "../src/components/list/index.js";

afterEach(cleanup);

describe("List", () => {
  it("renders static, navigation and command rows from one item model", () => {
    const onAction = vi.fn();
    const { container } = render(
      <List
        bordered
        dividers
        items={[
          { id: "static", kind: "static", title: "静态", description: "说明" },
          { id: "link", kind: "navigation", title: "文档", href: "/docs" },
          { id: "command", kind: "command", title: "刷新", onAction },
        ]}
        surface="panel"
      />,
    );

    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(screen.getByRole("link", { name: "文档" })).toHaveAttribute("href", "/docs");
    fireEvent.click(screen.getByRole("button", { name: "刷新" }));
    expect(onAction).toHaveBeenCalledOnce();
    expect(container.querySelector(".miaixz-list")).toHaveAttribute("data-bordered", "true");
  });

  it("owns disabled command semantics without making static rows interactive", () => {
    render(
      <List
        items={[
          { id: "static", kind: "static", content: <strong>只读</strong> },
          {
            id: "disabled",
            kind: "command",
            title: "不可用",
            disabled: true,
            onAction: () => undefined,
          },
        ]}
      />,
    );

    expect(screen.queryByRole("button", { name: "只读" })).toBeNull();
    expect(screen.getByRole("button", { name: "不可用" })).toBeDisabled();
  });
});

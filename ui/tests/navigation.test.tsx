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
import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Navigation, NavigationRail } from "../src/components/navigation/index.js";
import { renderWithLocale } from "./test-utils.js";

afterEach(cleanup);

describe("Navigation", () => {
  it("renders the sole structured link model with current and icon semantics", () => {
    renderWithLocale(
      <Navigation
        items={[
          {
            id: "workbench",
            current: "page",
            href: "/workbench",
            icon: "LayoutDashboard",
            label: "工作空间",
            textValue: "工作空间",
          },
        ]}
        label="主导航"
        surface="filled"
      />,
    );

    expect(screen.getByRole("navigation", { name: "主导航" })).toHaveAttribute(
      "data-surface",
      "filled",
    );
    expect(screen.getByRole("link", { name: "工作空间" })).toHaveAttribute("aria-current", "page");
  });

  it("renders rail groups from data without the removed opaque navigation path", () => {
    const { container } = renderWithLocale(
      <NavigationRail
        brand={<a href="/">Miaixz</a>}
        expanded
        groups={[
          {
            id: "primary",
            label: "平台底座",
            items: [
              {
                id: "workbench",
                current: "page",
                href: "/workbench",
                label: "工作台",
                textValue: "工作台",
                overflow: "never",
              },
            ],
          },
        ]}
        toggle={<button type="button">收起菜单</button>}
        utility={<button type="button">账户</button>}
        variant="brand"
      />,
    );

    expect(screen.getByRole("link", { name: "工作台" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("平台底座")).toBeVisible();
    expect(container.querySelector("[data-overflow-mode]")).toBeNull();
    expect(container.querySelector(".miaixz-navigation-rail")).toBeNull();
    expect(container.querySelector(".miaixz-navigation-rail-frame")).not.toBeNull();
  });
});

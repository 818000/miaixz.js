import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  Navigation,
  NavigationRail,
  NavigationRailGroup,
} from "../src/components/navigation/index.js";

describe("Navigation", () => {
  it("renders an icon-only category selector with an accessible label", () => {
    render(
      <Navigation
        items={[
          {
            active: true,
            href: "/workbench",
            icon: <span aria-hidden="true">W</span>,
            label: "工作空间",
          },
        ]}
        label="主导航"
        variant="icon"
      />,
    );

    expect(screen.getByRole("navigation", { name: "主导航" }).getAttribute("data-variant")).toBe(
      "icon",
    );
    expect(screen.getByRole("link", { name: "工作空间" }).getAttribute("aria-current")).toBe(
      "page",
    );
  });

  it("reveals a brand without introducing a second navigation level", () => {
    render(
      <NavigationRail
        brand={<a href="/">Miaixz</a>}
        classNames={{ body: "product-navigation-body", utility: "product-navigation-utility" }}
        expanded
        navigation={
          <NavigationRailGroup label="平台底座" separated>
            <a href="/workbench">工作台</a>
          </NavigationRailGroup>
        }
        toggle={<button type="button">收起菜单</button>}
        utility={<button type="button">账户</button>}
        variant="brand"
      />,
    );

    expect(screen.getByRole("link", { name: "Miaixz" })).not.toBeNull();
    expect(screen.getByRole("link", { name: "工作台" })).not.toBeNull();
    expect(screen.getByText("平台底座").className).toContain(
      "miaixz-navigation-rail-group-marker-label",
    );
    expect(screen.queryByRole("region")).toBeNull();
    expect(screen.getByRole("button", { name: "账户" })).not.toBeNull();
    expect(
      screen.getByRole("link", { name: "工作台" }).closest(".product-navigation-body"),
    ).not.toBeNull();
    expect(screen.getByRole("button", { name: "账户" }).parentElement?.className).toContain(
      "product-navigation-utility",
    );
    expect(
      screen.getByRole("button", { name: "收起菜单" }).closest("[data-variant='brand']"),
    ).not.toBeNull();
  });
});

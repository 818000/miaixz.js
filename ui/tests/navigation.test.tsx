import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMiaixzI18n } from "@miaixz/sdk/i18n";
import { describe, expect, it, vi } from "vitest";

import { MiaixzLocaleProvider } from "../src/i18n/index.js";
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

  it("collects lower-priority links without scrolling the adaptive rail", async () => {
    const user = userEvent.setup();
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(160);
    const { container } = render(
      <MiaixzLocaleProvider i18n={createMiaixzI18n()}>
        <NavigationRail
          brand={<a href="/">Miaixz</a>}
          expanded
          groups={[
            {
              id: "primary",
              label: "主要功能",
              items: [
                { id: "active", active: true, href: "/active", label: "当前页面" },
                { id: "optional", href: "/optional", label: "可收纳页面" },
                { id: "optional-two", href: "/optional-two", label: "另一收纳页面" },
              ],
            },
            {
              id: "context",
              label: "上下文",
              placement: "end",
              items: [
                {
                  id: "persistent",
                  href: "/persistent",
                  label: "固定页面",
                  overflow: "never",
                },
              ],
            },
          ]}
          overflowLabel="更多"
          overflowMode="adaptive"
          toggle={<button type="button">收起菜单</button>}
        />
      </MiaixzLocaleProvider>,
    );

    await waitFor(() => expect(screen.getByRole("button", { name: "更多" })).not.toBeNull());
    expect(screen.getByRole("link", { name: "当前页面" })).not.toBeNull();
    expect(screen.getByRole("link", { name: "固定页面" })).not.toBeNull();
    expect(screen.queryByRole("link", { name: "可收纳页面" })).toBeNull();
    expect(
      container.querySelector(".miaixz-navigation-rail-frame")?.getAttribute("data-overflow-mode"),
    ).toBe("adaptive");

    await user.click(screen.getByRole("button", { name: "更多" }));
    expect(screen.getByRole("menuitem", { name: "可收纳页面" }).tagName).toBe("A");
  });
});

import { readFileSync } from "node:fs";
import { createRef } from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ButtonLink, Link, MiaixzLinkProvider, Navigation } from "../../../src/index.js";

afterEach(cleanup);

describe("Link", () => {
  it("renders native inline navigation with stable state attributes", () => {
    const ref = createRef<HTMLAnchorElement>();
    render(
      <Link ref={ref} href="/docs" tone="inherit" underline="always">
        阅读文档
      </Link>,
    );

    const link = screen.getByRole("link", { name: "阅读文档" });
    expect(link).toBe(ref.current);
    expect(link).toHaveAttribute("href", "/docs");
    expect(link).toHaveAttribute("data-ui", "link");
    expect(link).toHaveAttribute("data-tone", "inherit");
    expect(link).toHaveAttribute("data-underline", "always");
    expect(link).toHaveClass("miaixz-link");
  });

  it("supports a router adapter while preserving the final anchor", () => {
    render(
      <Link
        href="/settings"
        renderAnchor={(props, ref) => <a {...props} ref={ref} data-router-link="true" />}
      >
        设置
      </Link>,
    );

    expect(screen.getByRole("link", { name: "设置" })).toHaveAttribute("data-router-link", "true");
  });

  it("supplies one router adapter to every navigation component", () => {
    render(
      <MiaixzLinkProvider
        renderAnchor={(props, ref) => <a {...props} ref={ref} data-global-router="true" />}
      >
        <Link href="/docs">文档</Link>
        <ButtonLink href="/create">创建</ButtonLink>
        <Navigation
          label="主导航"
          items={[{ id: "overview", href: "/overview", label: "概览", textValue: "概览" }]}
        />
      </MiaixzLinkProvider>,
    );

    expect(screen.getByRole("link", { name: "文档" })).toHaveAttribute(
      "data-global-router",
      "true",
    );
    expect(screen.getByRole("link", { name: "创建" })).toHaveAttribute(
      "data-global-router",
      "true",
    );
    expect(screen.getByRole("link", { name: "概览" })).toHaveAttribute(
      "data-global-router",
      "true",
    );
  });

  it("lets a component adapter override the global adapter", () => {
    render(
      <MiaixzLinkProvider
        renderAnchor={(props, ref) => <a {...props} ref={ref} data-adapter="global" />}
      >
        <Link
          href="/local"
          renderAnchor={(props, ref) => <a {...props} ref={ref} data-adapter="local" />}
        >
          局部适配
        </Link>
      </MiaixzLinkProvider>,
    );

    expect(screen.getByRole("link", { name: "局部适配" })).toHaveAttribute("data-adapter", "local");
  });

  it("rejects adapters that do not resolve to a native anchor", () => {
    expect(() =>
      render(
        <Link href="/invalid" renderAnchor={(props) => <span>{props.children}</span>}>
          无效链接
        </Link>,
      ),
    ).toThrow("UI_ANCHOR_RENDERER_INVALID");
  });

  it("keeps component styling independent from the generic anchor recipe", () => {
    const componentCss = readFileSync("src/styles/components/link.css", "utf8");
    const foundationCss = readFileSync("src/styles/foundation/link.css", "utf8");
    expect(componentCss).toContain('.miaixz-link[data-underline="always"]');
    expect(componentCss).toContain("@media (forced-colors: active)");
    expect(foundationCss).toContain(".miaixz-link,");
  });
});

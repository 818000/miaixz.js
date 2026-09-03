import { readFileSync } from "node:fs";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Shell } from "../src/components/shell/index.js";

afterEach(cleanup);

describe("Shell", () => {
  it("insets only the collapsed drawer surface above the header divider", () => {
    const css = readFileSync("src/styles/components/shell.css", "utf8");
    const narrowStyles = css.split("@container miaixz-shell (width < 768px)")[1]!;
    expect(narrowStyles).toMatch(
      /\.miaixz-shell\[data-mobile-navigation-mode="drawer"\]:not\(\[data-navigation-expanded\]\)\s*> \.miaixz-shell-sidebar\s*\{\s*block-size: calc\(var\(--miaixz-layout-header-height\) - var\(--miaixz-space-4\)\);\s*\}/,
    );
    expect(narrowStyles).toMatch(
      /\.miaixz-shell\[data-mobile-navigation-mode="drawer"\]\[data-navigation-expanded\]\s*> \.miaixz-shell-sidebar\s*\{[^}]*block-size: var\(--miaixz-viewport-block\)/,
    );
  });

  it("suppresses vertical boundary bounce for document, main and navigation scroll owners", () => {
    const shell = readFileSync("src/styles/components/shell.css", "utf8");
    const navigation = readFileSync("src/styles/components/navigation.css", "utf8");
    expect(shell).toMatch(
      /html:has\(\.miaixz-shell\),\s*body:has\(\.miaixz-shell\)\s*\{\s*overscroll-behavior-y: none;/,
    );
    expect(shell).toMatch(
      /\.miaixz-shell\[data-header-behavior="fixed"\] > \.miaixz-shell-main\s*\{[^}]*overscroll-behavior-y: none;/,
    );
    expect(shell).toMatch(/\.miaixz-shell-sidebar\s*\{[^}]*overscroll-behavior: contain none;/);
    expect(navigation).toMatch(
      /\.miaixz-navigation-rail-body\s*\{[^}]*overscroll-behavior: contain none;/,
    );
    expect(shell).not.toContain("touch-action: none");
  });
  it("keeps header and sidebar outside main when switching the scroll owner", () => {
    const content = { header: <span>Header</span>, sidebar: <span>Navigation</span> };
    const { container, rerender } = render(
      <Shell {...content}>
        <span>Content</span>
      </Shell>,
    );
    const shell = container.firstElementChild!;
    expect(shell.getAttribute("data-header-behavior")).toBe("fixed");
    expect(screen.getByRole("main").textContent).toBe("Content");
    expect(screen.getByRole("banner").parentElement).toBe(shell);
    expect(screen.getByRole("complementary").parentElement).toBe(shell);
    rerender(
      <Shell {...content} headerBehavior="scroll">
        <span>Content</span>
      </Shell>,
    );
    expect(shell.getAttribute("data-header-behavior")).toBe("scroll");
    expect(shell.hasAttribute("headerBehavior")).toBe(false);
  });

  it("renders a dismissible narrow-screen navigation drawer", async () => {
    const onNavigationDismiss = vi.fn();
    const user = userEvent.setup();

    render(
      <Shell
        header={<span>Header</span>}
        mobileNavigationMode="drawer"
        navigationDismissLabel="Close navigation"
        navigationExpanded
        onNavigationDismiss={onNavigationDismiss}
        sidebar={<span>Navigation</span>}
      >
        <span>Content</span>
      </Shell>,
    );

    const backdrop = screen.getByRole("button", { name: "Close navigation" });
    expect(backdrop.closest("[data-mobile-navigation-mode='drawer']")).not.toBeNull();
    await user.click(backdrop);
    expect(onNavigationDismiss).toHaveBeenCalledOnce();
  });
});

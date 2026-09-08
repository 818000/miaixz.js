import { readFileSync } from "node:fs";
import { createMiaixzI18n } from "@miaixz/sdk/i18n";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useCallback, useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Drawer } from "../src/components/drawer/index.js";
import { Shell } from "../src/components/shell/index.js";
import { MiaixzLocaleProvider } from "../src/i18n/index.js";

interface BoundedDrawerShellProps {
  /**
   * Reports the current shell main-content boundary.
   */
  readonly getRect: () => DOMRect;
  /**
   * Mirrors the current navigation expansion state.
   */
  readonly navigationExpanded: boolean;
}

/**
 * Supplies deterministic observer behavior for boundary geometry tests.
 */
class ResizeObserverStub {
  /**
   * Accepts the native callback without scheduling observations.
   *
   * @param callback - Native resize callback.
   */
  constructor(callback: ResizeObserverCallback) {
    void callback;
  }

  /**
   * Releases the inert observer.
   */
  disconnect(): void {}

  /**
   * Records no observation in the deterministic fixture.
   *
   * @param target - Element that would be observed.
   */
  observe(target: Element): void {
    void target;
  }

  /**
   * Removes no observation from the deterministic fixture.
   *
   * @param target - Element that would stop being observed.
   */
  unobserve(target: Element): void {
    void target;
  }
}

/**
 * Renders a Drawer constrained to the Shell main content.
 *
 * @param props - Boundary fixture properties.
 * @param props.getRect - Reads the current main-content rectangle.
 * @param props.navigationExpanded - Current shell navigation state.
 * @returns A boundary-aware Drawer fixture.
 */
function BoundedDrawerShell({ getRect, navigationExpanded }: BoundedDrawerShellProps) {
  const [boundary, setBoundary] = useState<HTMLElement | null>(null);
  const mainRef = useCallback(
    (element: HTMLElement | null) => {
      if (element !== null) element.getBoundingClientRect = getRect;
      setBoundary(element);
    },
    [getRect],
  );
  return (
    <MiaixzLocaleProvider i18n={createMiaixzI18n()}>
      <Shell
        header={<span>Header</span>}
        mainRef={mainRef}
        navigationExpanded={navigationExpanded}
        sidebar={<span>Navigation</span>}
      >
        <span>Content</span>
        <Drawer
          boundary={boundary}
          closeLabel="关闭详情"
          inset={8}
          open
          placement="left"
          title="边界详情"
          width={360}
          onOpenChange={() => undefined}
        >
          <p>{`完整抽屉内容-${"保持可达".repeat(80)}`}</p>
        </Drawer>
      </Shell>
    </MiaixzLocaleProvider>
  );
}

beforeEach(() => {
  HTMLDialogElement.prototype.showModal ??= function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close ??= function () {
    this.removeAttribute("open");
  };
  vi.stubGlobal("ResizeObserver", ResizeObserverStub);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Shell", () => {
  it("updates a Drawer content boundary when shell navigation and dimensions change", async () => {
    let rect = new DOMRect(240, 65, 760, 650);
    const getRect = () => rect;
    const { container, rerender } = render(
      <BoundedDrawerShell getRect={getRect} navigationExpanded />,
    );
    const dialog = await screen.findByRole("dialog", { name: "边界详情" });
    await waitFor(() => expect(dialog.style.left).toBe("248px"));
    expect(dialog.style.inlineSize).toBe("calc(360px)");
    expect(dialog.style.blockSize).toBe("634px");
    expect(screen.getByText(/^完整抽屉内容-/)).toHaveTextContent("保持可达");

    rect = new DOMRect(65, 65, 895, 590);
    rerender(<BoundedDrawerShell getRect={getRect} navigationExpanded={false} />);
    fireEvent(window, new Event("resize"));
    await waitFor(() => expect(dialog.style.left).toBe("73px"));
    expect(dialog.style.inlineSize).toBe("calc(360px)");
    expect(dialog.style.blockSize).toBe("574px");
    expect(container.firstElementChild).not.toHaveAttribute("data-navigation-expanded");
    expect(screen.getByText(/^完整抽屉内容-/)).toBeVisible();
  });

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

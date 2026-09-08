import { readFileSync } from "node:fs";
import { createMiaixzI18n } from "@miaixz/sdk/i18n";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Button, MiaixzLocaleProvider, Pressable } from "../src/index.js";

afterEach(cleanup);

describe("global text link contract", () => {
  it("provides public decoration-only variants ahead of the disabled rule", () => {
    const css = readFileSync("src/styles/foundation/link.css", "utf8");
    for (const [name, value] of [
      ["underline", "underline"],
      ["no-underline", "none"],
    ]) {
      const start = css.indexOf(`[data-miaixz-theme] :where(.miaixz-link-${name})`);
      const rule = css.slice(start, css.indexOf("}", start));
      expect(start).toBeGreaterThan(-1);
      expect(rule).toContain(":is(:hover, :focus-visible)");
      expect(rule).toContain(`text-decoration-line: ${value};`);
      expect(rule).toContain("text-decoration-color: currentcolor;");
      expect(rule).not.toMatch(/(?:^|[;{])\s*color:/);
      expect(start).toBeLessThan(css.indexOf("color: var(--miaixz-color-text-disabled)"));
    }
    expect(css.indexOf(":where(.miaixz-link-underline)")).toBeLessThan(
      css.indexOf(":where(.miaixz-link-no-underline)"),
    );
  });

  it("accepts decoration classes on shared link actions without changing callbacks", () => {
    const onClick = vi.fn();
    const { container } = render(
      <MiaixzLocaleProvider i18n={createMiaixzI18n()}>
        <Button variant="link" className="miaixz-link-no-underline" onClick={onClick}>
          Action
        </Button>
        <Pressable variant="link" className="miaixz-link-underline" onClick={onClick}>
          Details
        </Pressable>
      </MiaixzLocaleProvider>,
    );
    const buttons = container.querySelectorAll("button");
    expect(buttons[0]!.classList.contains("miaixz-link-no-underline")).toBe(true);
    expect(buttons[1]!.classList.contains("miaixz-link-underline")).toBe(true);
    for (const button of buttons) fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it("keeps native links and public link buttons keyboard reachable with distinct semantics", () => {
    const onClick = vi.fn();
    render(
      <MiaixzLocaleProvider i18n={createMiaixzI18n()}>
        <a className="miaixz-link-underline" href="/audit">
          查看审计
        </a>
        <Button variant="link" onClick={onClick}>
          执行操作
        </Button>
      </MiaixzLocaleProvider>,
    );
    const anchor = screen.getByRole("link", { name: "查看审计" });
    const action = screen.getByRole("button", { name: "执行操作" });
    expect(anchor).toHaveAttribute("href", "/audit");
    expect(action).toHaveAttribute("type", "button");
    anchor.focus();
    expect(anchor).toHaveFocus();
    action.focus();
    expect(action).toHaveFocus();
    fireEvent.click(action);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("shares theme color, underline states and disabled rules across anchors and link buttons", () => {
    const css = readFileSync("src/styles/foundation/link.css", "utf8");
    for (const selector of [
      "a:not(.miaixz-button-primary)",
      ".miaixz-button-link",
      ".miaixz-pressable-link",
    ])
      expect(css).toContain(selector);
    expect(css).toContain("color: var(--miaixz-color-brand)");
    expect(css).toContain(":hover");
    expect(css).toContain(":focus-visible");
    expect(css).toContain("text-decoration-line: underline");
    expect(css).toContain("color: var(--miaixz-color-text-disabled)");
    expect(css).not.toContain("!important");
    const foundation = readFileSync("src/styles/foundation.css", "utf8");
    expect(foundation.match(/@import[^;]+;/)?.[0]).toBe('@import url("./foundation/layers.css");');
    expect(readFileSync("src/styles/foundation.css", "utf8")).toContain(
      '@import url("./foundation/link.css") layer(miaixz-overrides)',
    );
  });

  it("keeps composite link-looking actions as buttons without changing their content or callbacks", () => {
    const onClick = vi.fn();
    const { container } = render(
      <Pressable variant="link" onClick={onClick}>
        <strong>r129</strong>
        <small>版本</small>
      </Pressable>,
    );
    const button = container.querySelector("button")!;
    expect(button.classList.contains("miaixz-pressable-link")).toBe(true);
    expect(button.type).toBe("button");
    expect(button.children).toHaveLength(2);
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
    expect(container.querySelector("a")).toBeNull();
  });

  it("allows scoped anchor text inheritance without overriding disabled or filled-button colors", () => {
    const css = readFileSync("src/styles/foundation/link.css", "utf8");
    const scopedRule = css.slice(
      css.indexOf("/* Regions"),
      css.indexOf("color: var(--miaixz-color-text-disabled)"),
    );
    expect(scopedRule).toContain('[data-miaixz-link-tone="inherit"] a:not(.miaixz-button-primary)');
    expect(scopedRule).toContain(":hover");
    expect(scopedRule).toContain(":focus-visible");
    expect(scopedRule).toContain("color: inherit;");
    expect(css.indexOf("color: inherit;")).toBeLessThan(
      css.indexOf("color: var(--miaixz-color-text-disabled)"),
    );
  });

  it("keeps disabled link actions inert and ordinary pressables opt-out", () => {
    const onClick = vi.fn();
    const { container } = render(
      <MiaixzLocaleProvider i18n={createMiaixzI18n()}>
        <Button variant="link" disabled onClick={onClick}>
          禁用操作
        </Button>
        <Pressable variant="link" disabled onClick={onClick}>
          只读名称
        </Pressable>
        <Pressable>普通按钮</Pressable>
      </MiaixzLocaleProvider>,
    );
    for (const button of container.querySelectorAll("button:disabled")) fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "禁用操作" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "只读名称" })).toBeDisabled();
    expect(container.querySelectorAll(".miaixz-pressable-link")).toHaveLength(1);
  });
});

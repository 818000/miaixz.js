import { readFileSync } from "node:fs";
import { createMiaixzI18n } from "@miaixz/sdk/i18n";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ActionText, ButtonLink, MiaixzLocaleProvider } from "../src/index.js";

afterEach(cleanup);

describe("global link and command semantics", () => {
  it("keeps navigation as anchors and link-looking commands as buttons", () => {
    const execute = vi.fn();
    render(
      <MiaixzLocaleProvider i18n={createMiaixzI18n()}>
        <ActionText
          action={{
            id: "audit",
            intent: "view",
            label: "查看审计",
            icon: "Eye",
            tone: "neutral",
            confirm: "none",
            placement: "visible",
            href: "/audit",
          }}
        />
        <ActionText
          action={{
            id: "execute",
            intent: "validate",
            label: "执行操作",
            icon: "ShieldCheck",
            tone: "neutral",
            confirm: "none",
            placement: "visible",
            onAction: execute,
          }}
        />
        <ButtonLink href="/create" variant="primary">
          创建记录
        </ButtonLink>
      </MiaixzLocaleProvider>,
    );

    expect(screen.getByRole("link", { name: "查看审计" })).toHaveAttribute("href", "/audit");
    expect(screen.getByRole("link", { name: "创建记录" })).toHaveClass("miaixz-button-primary");
    const command = screen.getByRole("button", { name: "执行操作" });
    expect(command).toHaveAttribute("type", "button");
    fireEvent.click(command);
    expect(execute).toHaveBeenCalledOnce();
  });

  it("limits the foundation link recipe to anchors and decoration helpers", () => {
    const css = readFileSync("src/styles/foundation/link.css", "utf8");
    expect(css).toContain("a:not(.miaixz-button, .miaixz-action-text, .miaixz-icon-button)");
    expect(css).toContain(".miaixz-link-underline");
    expect(css).toContain(".miaixz-link-no-underline");
    expect(css).not.toContain("!important");
  });
});

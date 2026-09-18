import "@testing-library/jest-dom/vitest";
import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Tag } from "../../../src/components/tag/index.js";
import { renderWithLocale } from "../../support/test-utils.js";

afterEach(cleanup);

describe("Tag", () => {
  it("uses static, button, and link semantics", () => {
    renderWithLocale(
      <>
        <Tag>Static</Tag>
        <Tag onAction={() => undefined}>Action</Tag>
        <Tag href="/docs">Docs</Tag>
      </>,
    );
    expect(screen.getByText("Static").closest('[data-ui="tag"]')).toHaveTextContent("Static");
    expect(screen.getByRole("button", { name: "Action" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Docs" })).toHaveAttribute("href", "/docs");
  });

  it("removes from the main action and restores focus from the remove button", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    renderWithLocale(
      <Tag onAction={() => undefined} onRemove={onRemove} removeLabel="Remove Alpha">
        Alpha
      </Tag>,
    );
    const action = screen.getByRole("button", { name: "Alpha" });
    const remove = screen.getByRole("button", { name: "Remove Alpha" });
    action.focus();
    await user.keyboard("{Delete}");
    expect(onRemove).toHaveBeenCalledTimes(1);
    remove.focus();
    await user.keyboard("{Escape}");
    expect(action).toHaveFocus();
  });

  it("blocks both actions while disabled", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const onRemove = vi.fn();
    renderWithLocale(
      <Tag disabled onAction={onAction} onRemove={onRemove}>
        Disabled
      </Tag>,
    );
    await user.click(screen.getByRole("button", { name: "Disabled" }));
    await user.click(screen.getByRole("button", { name: "移除" }));
    expect(onAction).not.toHaveBeenCalled();
    expect(onRemove).not.toHaveBeenCalled();
  });
});

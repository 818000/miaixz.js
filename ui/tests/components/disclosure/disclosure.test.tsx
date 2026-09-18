import "@testing-library/jest-dom/vitest";
import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Disclosure } from "../../../src/components/disclosure/index.js";
import { renderWithLocale } from "../../support/test-utils.js";

afterEach(cleanup);

describe("Disclosure", () => {
  it("links the heading button and retained region", async () => {
    const user = userEvent.setup();
    renderWithLocale(<Disclosure summary="Details">Content</Disclosure>);
    const button = screen.getByRole("button", { name: "Details" });
    const region = screen.getByRole("region", { hidden: true });
    expect(button).toHaveAttribute("aria-controls", region.id);
    expect(region).toHaveAttribute("aria-labelledby", button.id);
    expect(region).not.toBeVisible();
    await user.click(button);
    expect(region).toBeVisible();
  });

  it("supports controlled state, disabled state, and unmounting", async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    const view = renderWithLocale(
      <Disclosure
        disabled
        expanded={false}
        onExpandedChange={onExpandedChange}
        summary="Locked"
        unmountOnExit
      >
        Content
      </Disclosure>,
    );
    await user.click(screen.getByRole("button", { name: "Locked" }));
    expect(onExpandedChange).not.toHaveBeenCalled();
    expect(screen.queryByRole("region")).toBeNull();
    view.rerender(
      <Disclosure expanded headingLevel={2} summary="Open" unmountOnExit>
        Content
      </Disclosure>,
    );
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Open");
    expect(screen.getByRole("region")).toHaveTextContent("Content");
  });
});

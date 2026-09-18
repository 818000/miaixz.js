import "@testing-library/jest-dom/vitest";
import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Button, ButtonGroup, ButtonLink } from "../../../src/components/button/index.js";
import { renderWithLocale } from "../../support/test-utils.js";

afterEach(cleanup);

describe("ButtonGroup", () => {
  it("provides group defaults while preserving explicit child props", () => {
    renderWithLocale(
      <ButtonGroup aria-label="Actions" fullWidth size="large" tone="brand" variant="solid">
        <Button>Save</Button>
        <Button tone="danger">Delete</Button>
        <ButtonLink href="/docs">Docs</ButtonLink>
      </ButtonGroup>,
    );
    const save = screen.getByRole("button", { name: "Save" });
    expect(save).toHaveAttribute("data-size", "large");
    expect(save).toHaveAttribute("data-tone", "brand");
    expect(save).toHaveAttribute("data-variant", "solid");
    expect(screen.getByRole("button", { name: "Delete" })).toHaveAttribute("data-tone", "danger");
    expect(screen.getByRole("link", { name: "Docs" })).toHaveAttribute("data-tone", "brand");
    expect(screen.getByRole("group", { name: "Actions" })).toHaveAttribute(
      "data-full-width",
      "true",
    );
  });

  it("disables command and navigation children", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    renderWithLocale(
      <ButtonGroup aria-label="Locked" disabled orientation="vertical">
        <Button onClick={onClick}>Command</Button>
        <ButtonLink href="/next" onClick={onClick}>
          Navigation
        </ButtonLink>
      </ButtonGroup>,
    );
    await user.click(screen.getByRole("button", { name: "Command" }));
    await user.click(screen.getByRole("link", { name: "Navigation" }));
    expect(onClick).not.toHaveBeenCalled();
    expect(screen.getByRole("link", { name: "Navigation" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });
});

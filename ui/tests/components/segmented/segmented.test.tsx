import "@testing-library/jest-dom/vitest";
import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Segmented } from "../../../src/components/segmented/index.js";
import { renderWithLocale } from "../../support/test-utils.js";

afterEach(cleanup);

const items = [
  { value: "list", label: "List", textValue: "List", icon: "Menu" },
  { value: "grid", label: "Grid", textValue: "Grid", icon: "LayoutGrid" },
  { value: "map", label: "Map", textValue: "Map", disabled: true },
] as const;

describe("Segmented", () => {
  it("selects exactly one ordered item", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderWithLocale(<Segmented aria-label="View" items={items} onValueChange={onValueChange} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons.map((button) => button.textContent)).toEqual(["List", "Grid", "Map"]);
    expect(buttons[0]).toHaveAttribute("aria-pressed", "true");
    await user.click(buttons[1]!);
    expect(onValueChange).toHaveBeenCalledWith("grid");
    expect(buttons[1]).toHaveAttribute("aria-pressed", "true");
  });

  it("wraps keyboard focus and skips disabled items", async () => {
    const user = userEvent.setup();
    renderWithLocale(<Segmented aria-label="View" defaultValue="grid" items={items} />);
    const grid = screen.getByRole("button", { name: "Grid" });
    grid.focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("button", { name: "List" })).toHaveFocus();
    await user.keyboard("{End}");
    expect(grid).toHaveFocus();
  });

  it("validates item and controlled-value contracts", () => {
    expect(() => renderWithLocale(<Segmented aria-label="Empty" items={[]} />)).toThrow(
      expect.objectContaining({ code: "UI_SEGMENTED_ITEMS_EMPTY" }),
    );
    expect(() =>
      renderWithLocale(
        <Segmented aria-label="Invalid" items={items} value={"missing" as "list"} />,
      ),
    ).toThrow(expect.objectContaining({ code: "UI_SEGMENTED_VALUE_INVALID" }));
  });
});

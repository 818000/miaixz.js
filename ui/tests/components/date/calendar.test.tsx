import "@testing-library/jest-dom/vitest";
import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Calendar } from "../../../src/components/date/calendar.js";
import { renderWithLocale } from "../../support/test-utils.js";

afterEach(cleanup);

describe("Calendar", () => {
  it("renders six weeks and selects an enabled date", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderWithLocale(
      <Calendar aria-label="Date" onValueChange={onValueChange} referenceDate="2026-09-18" />,
    );
    expect(screen.getAllByRole("gridcell")).toHaveLength(42);
    await user.click(screen.getByRole("gridcell", { name: /2026年9月18日/u }));
    expect(onValueChange).toHaveBeenCalledWith("2026-09-18");
  });

  it("moves focus across dates and respects bounds", async () => {
    const user = userEvent.setup();
    renderWithLocale(
      <Calendar aria-label="Date" max="2026-09-20" min="2026-09-10" referenceDate="2026-09-18" />,
    );
    const day = screen.getByRole("gridcell", { name: /2026年9月18日/u });
    day.focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("gridcell", { name: /2026年9月19日/u })).toHaveFocus();
    expect(screen.getByRole("gridcell", { name: /2026年9月9日/u })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });
});

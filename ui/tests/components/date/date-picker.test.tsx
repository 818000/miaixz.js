import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DatePicker } from "../../../src/components/date/index.js";
import { renderWithLocale } from "../../support/test-utils.js";

afterEach(cleanup);

describe("DatePicker", () => {
  it("commits strict ISO input and submits a hidden value", () => {
    const onValueChange = vi.fn();
    const { container } = renderWithLocale(
      <DatePicker
        aria-label="Birth"
        name="birth"
        onValueChange={onValueChange}
        referenceDate="2026-09-18"
      />,
    );
    const input = screen.getByRole("textbox", { name: "Birth" });
    fireEvent.change(input, { target: { value: "2024-02-29" } });
    fireEvent.blur(input);
    expect(onValueChange).toHaveBeenCalledWith("2024-02-29");
    expect(container.querySelector('input[type="hidden"][name="birth"]')).toHaveValue("2024-02-29");
  });

  it("retains invalid text and restores the committed value on Escape", () => {
    renderWithLocale(
      <DatePicker
        aria-label="Birth"
        defaultValue="2020-01-02"
        name="birth"
        referenceDate="2026-09-18"
      />,
    );
    const input = screen.getByRole("textbox", { name: "Birth" });
    fireEvent.change(input, { target: { value: "2025-02-29" } });
    fireEvent.blur(input);
    expect(input).toHaveAttribute("aria-invalid", "true");
    fireEvent.keyDown(input, { key: "Escape" });
    expect(input).toHaveValue("2020-01-02");
  });
});

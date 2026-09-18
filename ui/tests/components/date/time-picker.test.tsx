import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { TimePicker } from "../../../src/components/date/index.js";
import { renderWithLocale } from "../../support/test-utils.js";

afterEach(cleanup);

describe("TimePicker", () => {
  it("commits aligned 24-hour values and steps with the keyboard", () => {
    const onValueChange = vi.fn();
    renderWithLocale(
      <TimePicker
        aria-label="Start"
        defaultValue="09:00"
        name="start"
        onValueChange={onValueChange}
        step={900}
      />,
    );
    const input = screen.getByRole("textbox", { name: "Start" });
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(onValueChange).toHaveBeenLastCalledWith("09:15");
    fireEvent.change(input, { target: { value: "10:30" } });
    fireEvent.blur(input);
    expect(onValueChange).toHaveBeenLastCalledWith("10:30");
  });

  it("rejects unaligned values and invalid step contracts", () => {
    renderWithLocale(<TimePicker aria-label="Start" name="start" step={900} />);
    const input = screen.getByRole("textbox", { name: "Start" });
    fireEvent.change(input, { target: { value: "10:31" } });
    fireEvent.blur(input);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(() =>
      renderWithLocale(<TimePicker aria-label="Invalid" name="invalid" step={30} />),
    ).toThrow(expect.objectContaining({ code: "UI_TIME_PICKER_STEP_INVALID" }));
  });
});

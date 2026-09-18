import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { NumberInput } from "../../../src/components/input/index.js";
import { renderWithLocale } from "../../support/test-utils.js";

afterEach(cleanup);

describe("NumberInput", () => {
  it("preserves intermediate text and restores it on blur", () => {
    const onValueChange = vi.fn();
    renderWithLocale(<NumberInput defaultValue={2} onValueChange={onValueChange} />);
    const input = screen.getByRole("spinbutton");
    fireEvent.change(input, { target: { value: "-" } });
    expect(input).toHaveValue("-");
    fireEvent.blur(input);
    expect(input).toHaveValue("2");
  });

  it("steps exactly, clamps, and supports keyboard boundaries", async () => {
    const user = userEvent.setup();
    renderWithLocale(<NumberInput defaultValue={0.2} min={0} max={0.4} step={0.1} precision={1} />);
    const input = screen.getByRole("spinbutton");
    input.focus();
    await user.keyboard("{ArrowUp}");
    expect(input).toHaveValue("0.3");
    await user.keyboard("{End}");
    expect(input).toHaveValue("0.4");
    await user.keyboard("{PageDown}");
    expect(input).toHaveValue("0");
  });

  it("keeps empty values null and resets the form", () => {
    const onValueChange = vi.fn();
    renderWithLocale(
      <form data-testid="form">
        <NumberInput defaultValue={3} onValueChange={onValueChange} />
      </form>,
    );
    const input = screen.getByRole("spinbutton");
    fireEvent.change(input, { target: { value: "" } });
    expect(onValueChange).toHaveBeenLastCalledWith(null, { reason: "input", rawValue: "" });
    fireEvent.reset(screen.getByTestId("form"));
    expect(input).toHaveValue("3");
  });

  it("rejects invalid numeric contracts", () => {
    expect(() => renderWithLocale(<NumberInput step={0} />)).toThrow(
      expect.objectContaining({ code: "UI_NUMBER_INPUT_STEP_INVALID" }),
    );
    expect(() => renderWithLocale(<NumberInput precision={13} />)).toThrow(
      expect.objectContaining({ code: "UI_NUMBER_INPUT_PRECISION_INVALID" }),
    );
  });
});

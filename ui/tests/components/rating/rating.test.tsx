import "@testing-library/jest-dom/vitest";
import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Rating } from "../../../src/components/rating/index.js";
import { renderWithLocale } from "../../support/test-utils.js";

afterEach(cleanup);

describe("Rating", () => {
  it("uses native radios and submits the selected value", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderWithLocale(
      <Rating aria-label="Quality" defaultValue={2} name="quality" onValueChange={onValueChange} />,
    );
    const radio = screen.getByRole("radio", { name: "5 分中的 4 分" });
    await user.click(radio);
    expect(onValueChange).toHaveBeenCalledWith(4);
    expect(radio).toBeChecked();
  });

  it("supports half precision and clearing", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderWithLocale(
      <Rating
        aria-label="Quality"
        defaultValue={2.5}
        name="quality"
        onValueChange={onValueChange}
        precision={0.5}
      />,
    );
    const current = screen.getByRole("radio", { name: "5 分中的 2.5 分" });
    await user.click(current);
    expect(onValueChange).toHaveBeenCalledWith(null);
    expect(document.querySelectorAll(".miaixz-rating-star")).toHaveLength(5);
  });

  it("resets uncontrolled state and follows RTL arrow direction", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderWithLocale(
      <form>
        <div dir="rtl">
          <Rating
            aria-label="Quality"
            defaultValue={2}
            name="quality"
            onValueChange={onValueChange}
          />
        </div>
        <button type="reset">Reset</button>
      </form>,
    );
    const selected = screen.getByRole("radio", { name: "5 分中的 2 分" });
    selected.focus();
    await user.keyboard("{ArrowLeft}");
    expect(onValueChange).toHaveBeenLastCalledWith(3);
    expect(screen.getByRole("radio", { name: "5 分中的 3 分" })).toBeChecked();
    await user.click(screen.getByRole("button", { name: "Reset" }));
    expect(selected).toBeChecked();
  });

  it("validates max and value contracts", () => {
    expect(() => renderWithLocale(<Rating aria-label="Invalid" max={0} name="rating" />)).toThrow(
      expect.objectContaining({ code: "UI_RATING_MAX_INVALID" }),
    );
    expect(() =>
      renderWithLocale(<Rating aria-label="Invalid" name="rating" value={1.2} />),
    ).toThrow(expect.objectContaining({ code: "UI_RATING_VALUE_INVALID" }));
  });
});

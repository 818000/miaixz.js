/**
 * Verifies rating behavior in the UI package.
 */

import "@testing-library/jest-dom/vitest";
import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Icon, type IconName } from "@miaixz/icons";
import { renderToStaticMarkup } from "react-dom/server";

import { Rating } from "../../../src/components/rating/index.js";
import { renderWithLocale } from "../../test-utils.helper.js";

afterEach(cleanup);

/**
 * Reads the public Icon character without relying on internal maps or fixed codepoints.
 * @param name - Public icon name.
 * @returns Actual character emitted by Icon.
 */
function iconCharacter(name: IconName): string {
  const element = document.createElement("div");
  element.innerHTML = renderToStaticMarkup(<Icon name={name} />);
  return element.querySelector(".miaixz-icon-glyph")?.getAttribute("data-miaixz-icon-glyph") ?? "";
}

describe("Rating", () => {
  it.each([2.5, 3, null])("uses the public half-star only for the half value %s", (value) => {
    const { container } = renderWithLocale(
      <Rating aria-label="Quality" name="quality" precision={0.5} value={value} />,
    );
    const stars = container.querySelectorAll(".miaixz-rating-star");
    expect(stars).toHaveLength(5);
    expect(container.querySelectorAll('[data-fill="half"]')).toHaveLength(value === 2.5 ? 1 : 0);
    const whole = iconCharacter("star"),
      half = iconCharacter("star-half");
    expect(whole).not.toBe("");
    expect(half).not.toBe(whole);
    for (const [index, star] of Array.from(stars).entries()) {
      expect(
        star
          .querySelector(".miaixz-rating-icon .miaixz-icon-glyph")
          ?.getAttribute("data-miaixz-icon-glyph"),
      ).toBe(whole);
      expect(
        star
          .querySelector(".miaixz-rating-fill .miaixz-icon-glyph")
          ?.getAttribute("data-miaixz-icon-glyph"),
      ).toBe(value === 2.5 && index === 2 ? half : whole);
    }
  });
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

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Slider } from "../../../src/components/slider/index.js";
import { renderWithLocale } from "../../support/test-utils.js";

afterEach(cleanup);

describe("Slider", () => {
  it("keeps the native ref and change contract", () => {
    const ref = createRef<HTMLInputElement>();
    const onChange = vi.fn();
    renderWithLocale(
      <Slider aria-label="Volume" defaultValue={25} onChange={onChange} ref={ref} />,
    );
    const slider = screen.getByRole("slider", { name: "Volume" });
    fireEvent.change(slider, { target: { value: "40" } });
    expect(ref.current).toBe(slider);
    expect(slider).toHaveValue("40");
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("renders formatted output, value text, in-range marks, and orientation", () => {
    const { container } = renderWithLocale(
      <Slider
        aria-label="Progress"
        defaultValue={50}
        formatValue={(value) => `${value}%`}
        getValueText={(value) => `${value} percent`}
        marks={[
          { value: -1, label: "Before" },
          { value: 50, label: "Middle" },
        ]}
        max={100}
        min={0}
        orientation="vertical"
        showValue
      />,
    );
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuetext", "50 percent");
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByText("Middle")).toBeInTheDocument();
    expect(screen.queryByText("Before")).toBeNull();
    expect(container.querySelector(".miaixz-slider-frame")).toHaveAttribute(
      "data-orientation",
      "vertical",
    );
  });

  it("prevents readonly keyboard and pointer mutation", () => {
    const onChange = vi.fn();
    renderWithLocale(<Slider aria-label="Locked" onChange={onChange} readOnly value={10} />);
    const slider = screen.getByRole("slider");
    fireEvent.keyDown(slider, { key: "ArrowRight" });
    fireEvent.pointerDown(slider);
    fireEvent.change(slider, { target: { value: "11" } });
    expect(onChange).not.toHaveBeenCalled();
    expect(slider).toHaveAttribute("aria-readonly", "true");
  });
});

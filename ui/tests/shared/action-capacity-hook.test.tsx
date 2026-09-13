import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { createRef, useMemo, useRef } from "react";
import { describe, expect, it } from "vitest";

import { useActionCapacity } from "../../src/shared/responsive/action-capacity.js";

/**
 * Creates a stable DOMRect-shaped width measurement.
 *
 * @param width - Required intrinsic width.
 * @returns A DOMRect-shaped measurement value.
 */
function widthRect(width: number): DOMRect {
  return {
    bottom: 0,
    height: 0,
    left: 0,
    right: width,
    top: 0,
    width,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  };
}

/**
 * Renders real measurement refs without depending on browser layout.
 *
 * @returns A deterministic action measurement fixture.
 */
function CapacityFixture() {
  const rootRef = useRef<HTMLDivElement>(null);
  const overflowMeasureRef = useRef<HTMLSpanElement>(null);
  const primaryMeasureRef = useRef<HTMLSpanElement>(null);
  const actionMeasureRefs = useMemo(
    () => [
      createRef<HTMLSpanElement>(),
      createRef<HTMLSpanElement>(),
      createRef<HTMLSpanElement>(),
    ],
    [],
  );
  const capacity = useActionCapacity({
    rootRef,
    actionMeasureRefs,
    overflowMeasureRef,
    primaryMeasureRef,
  });
  return (
    <div
      ref={(element) => {
        rootRef.current = element;
        if (element !== null) Object.defineProperty(element, "clientWidth", { value: 220 });
      }}
      style={{ columnGap: 10 }}
    >
      {actionMeasureRefs.map((reference, index) => (
        <span
          key={index}
          ref={(element) => {
            reference.current = element;
            if (element !== null) element.getBoundingClientRect = () => widthRect(50);
          }}
        />
      ))}
      <span
        ref={(element) => {
          overflowMeasureRef.current = element;
          if (element !== null) element.getBoundingClientRect = () => widthRect(40);
        }}
      />
      <span
        ref={(element) => {
          primaryMeasureRef.current = element;
          if (element !== null) element.getBoundingClientRect = () => widthRect(60);
        }}
      />
      <output aria-label="capacity">{capacity}</output>
    </div>
  );
}

describe("useActionCapacity", () => {
  it("measures the root, recipes, primary, overflow trigger, and gap", () => {
    render(<CapacityFixture />);
    expect(screen.getByLabelText("capacity")).toHaveTextContent("1");
  });
});

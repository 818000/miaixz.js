import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";

import { Masonry } from "../../../src/components/masonry/index.js";

afterEach(cleanup);

describe("Masonry", () => {
  it("preserves children and native attributes without wrappers", () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(
      <Masonry aria-label="Cards" className="custom" columns={4} gap="tight" ref={ref}>
        <article>A</article>
        <article>B</article>
        <article>C</article>
      </Masonry>,
    );
    const root = screen.getByLabelText("Cards");
    expect(root).toHaveAttribute("data-columns", "4");
    expect(root).toHaveAttribute("data-gap", "tight");
    expect(root).toHaveClass("custom");
    expect(ref.current).toBe(root);
    expect(
      Array.from(container.querySelectorAll("article")).map((item) => item.textContent),
    ).toEqual(["A", "B", "C"]);
  });

  it("has deterministic server markup", () => {
    expect(
      renderToString(
        <Masonry>
          <span>Item</span>
        </Masonry>,
      ),
    ).toContain('data-ui="masonry"');
  });
});

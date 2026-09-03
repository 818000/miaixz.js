import { render } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { HeatmapLegend } from "../src/components/heatmap/index.js";

describe("HeatmapLegend", () => {
  it("renders localized endpoints and five noninteractive activity swatches", () => {
    const { container } = render(<HeatmapLegend tone="brand" lowLabel="低" highLabel="高" />);
    expect(container.textContent).toBe("低高");
    const cells = container.querySelectorAll(".miaixz-heatmap-legend-cell");
    expect(Array.from(cells, (cell) => cell.getAttribute("data-level"))).toEqual([
      "1",
      "2",
      "3",
      "4",
      "5",
    ]);
    expect(Array.from(cells).every((cell) => cell.getAttribute("aria-hidden") === "true")).toBe(
      true,
    );
    expect(container.querySelector("[style]")).toBeNull();
    expect(container.querySelector(".miaixz-heatmap")).toBeNull();
  });

  it("shares every level selector with the chart instead of defining a separate palette", () => {
    const css = readFileSync("src/styles/components/heatmap.css", "utf8");
    for (let level = 1; level <= 5; level++) {
      expect(css).toContain(
        `.miaixz-heatmap-cell[data-level="${level}"],\n.miaixz-heatmap-legend-cell[data-level="${level}"]`,
      );
    }
  });
});

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { HeatmapLegend } from "../src/components/heatmap/index.js";
import { renderWithLocale } from "./test-utils.js";

const levelLabels = ["无", "很低", "低", "中", "高", "很高"] as const;

describe("HeatmapLegend", () => {
  it("renders all six declared levels with localized accessible descriptions", () => {
    const { container } = renderWithLocale(
      <HeatmapLegend levelLabels={levelLabels} tone="brand" />,
    );
    expect(container.querySelector(".miaixz-heatmap-legend-low")?.textContent).toBe("无");
    expect(container.querySelector(".miaixz-heatmap-legend-high")?.textContent).toBe("很高");
    const cells = container.querySelectorAll(".miaixz-heatmap-legend-cell");
    expect(Array.from(cells, (cell) => cell.getAttribute("data-level"))).toEqual([
      "0",
      "1",
      "2",
      "3",
      "4",
      "5",
    ]);
    expect(cells).toHaveLength(6);
    expect(cells[0]?.parentElement?.getAttribute("aria-hidden")).toBe("true");
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

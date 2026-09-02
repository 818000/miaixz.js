import { fireEvent, render, screen } from "@testing-library/react";
import { createMiaixzI18n } from "@miaixz/sdk/i18n";
import { describe, expect, it, vi } from "vitest";

import { Button } from "../src/components/button/index.js";
import { Columns } from "../src/components/columns/index.js";
import { Donut } from "../src/components/donut/index.js";
import { Heatmap } from "../src/components/heatmap/index.js";
import { Metric } from "../src/components/metric/index.js";
import { Progress } from "../src/components/progress/index.js";
import { Sparkline } from "../src/components/sparkline/index.js";
import { MiaixzLocaleProvider } from "../src/i18n/index.js";
import { useVisualizationGroupMotion } from "../src/internal/use-visualization-motion.js";

function VisualizationMotionGroup() {
  const ref = useVisualizationGroupMotion<HTMLDivElement>({
    selector: "[data-group-visualization]",
  });

  return (
    <div ref={ref}>
      <span data-group-visualization />
    </div>
  );
}

describe("visual component ownership", () => {
  it("renders the reusable resource columns variant", () => {
    const { container } = render(
      <Columns
        aria-label="资源趋势"
        labels={["1", "2", "3"]}
        maximum={100}
        series={[{ label: "资源", values: [25, 50, 75] }]}
        tone="success"
        variant="resource"
      />,
    );

    expect(
      screen.getByRole("img", { name: "资源趋势" }).classList.contains("miaixz-columns-resource"),
    ).toBe(true);
    expect(container.querySelectorAll(".miaixz-columns-bar")).toHaveLength(3);
  });

  it("renders trend geometry inside the shared sparkline", () => {
    const { container } = render(
      <Sparkline aria-label="调用趋势" tone="brand" values={[2, 5, 3, 8]} variant="trend" />,
    );

    expect(
      screen.getByRole("img", { name: "调用趋势" }).classList.contains("miaixz-sparkline-trend"),
    ).toBe(true);
    expect(container.querySelector(".miaixz-sparkline-trend")?.getAttribute("viewBox")).toBe(
      "0 0 360 82",
    );
    expect(container.querySelector(".miaixz-sparkline-grid")?.getAttribute("d")).toBe(
      "M0 18H360 M0 46H360 M0 74H360",
    );
    expect(container.querySelector(".miaixz-sparkline-area")).not.toBeNull();
    expect(container.querySelectorAll(".miaixz-sparkline-point")).toHaveLength(7);
    expect(
      container.querySelector(".miaixz-sparkline-trend")?.getAttribute("preserveAspectRatio"),
    ).toBe("none");
    expect(container.querySelector(".miaixz-sparkline-line")?.getAttribute("d")).toBe(
      "M0 67 C24 63 34 53 60 55 S95 48 120 42 S156 48 180 35 S216 39 240 29 S276 33 300 20 S336 18 360 11",
    );
  });

  it("keeps refresh loading feedback inside the button variant", () => {
    const i18n = createMiaixzI18n();
    const { container } = render(
      <MiaixzLocaleProvider i18n={i18n}>
        <Button loading loadingLabel="正在更新…" variant="refresh">
          数据更新于 10:24
        </Button>
      </MiaixzLocaleProvider>,
    );

    expect(screen.getByRole("button", { name: "正在更新…" }).getAttribute("data-loading")).toBe(
      "true",
    );
    expect(container.querySelector(".miaixz-button-spinner")).not.toBeNull();
    expect(container.querySelector(".miaixz-button-label")?.textContent).toBe("正在更新…");
  });

  it("stops visualization replay immediately when the pointer leaves", () => {
    const i18n = createMiaixzI18n();
    const onPointerLeave = vi.fn();
    const { container } = render(
      <MiaixzLocaleProvider i18n={i18n}>
        <Metric label="指标" value="8" onPointerLeave={onPointerLeave} />
        <Sparkline aria-label="趋势" values={[2, 5, 3]} />
        <Columns
          aria-label="柱图"
          labels={["一", "二"]}
          series={[{ label: "数量", values: [2, 5] }]}
          tone="brand"
        />
        <Donut aria-label="环图" segments={[{ label: "完成", tone: "brand", value: 8 }]} />
        <Heatmap
          aria-label="热图"
          columnLabels={["周一"]}
          levels={[[3]]}
          rowLabels={["上午"]}
          tone="brand"
        />
        <Progress label="完成率" value={80} />
      </MiaixzLocaleProvider>,
    );
    const visualizations = Array.from(
      container.querySelectorAll<HTMLElement>(
        ".miaixz-metric, .miaixz-sparkline, .miaixz-columns, .miaixz-donut, .miaixz-heatmap, .miaixz-progress",
      ),
    );

    expect(visualizations).toHaveLength(6);
    visualizations.forEach((visualization) => {
      fireEvent.pointerEnter(visualization);
      expect(visualization.getAttribute("data-motion-replay")).toBe("true");
      fireEvent.pointerLeave(visualization);
      expect(visualization.hasAttribute("data-motion-replay")).toBe(false);
      expect(visualization.getAttribute("data-motion-state")).toBe("complete");
    });
    expect(onPointerLeave).toHaveBeenCalledOnce();
  });

  it("stops delegated visualization replay immediately when the pointer leaves", () => {
    const { container } = render(<VisualizationMotionGroup />);
    const visualization = container.querySelector<HTMLElement>("[data-group-visualization]");

    expect(visualization).not.toBeNull();
    fireEvent.pointerEnter(visualization as HTMLElement);
    expect(visualization?.getAttribute("data-motion-replay")).toBe("true");
    fireEvent.pointerLeave(visualization as HTMLElement);
    expect(visualization?.hasAttribute("data-motion-replay")).toBe(false);
    expect(visualization?.getAttribute("data-motion-state")).toBe("complete");
  });
});

import { createMiaixzI18n } from "@miaixz/sdk/i18n";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Button } from "../src/components/button/index.js";
import { Columns } from "../src/components/columns/index.js";
import { Donut } from "../src/components/donut/index.js";
import { Heatmap } from "../src/components/heatmap/index.js";
import { Metric } from "../src/components/metric/index.js";
import { Progress } from "../src/components/progress/index.js";
import { Sparkline } from "../src/components/sparkline/index.js";
import { MiaixzLocaleProvider } from "../src/i18n/index.js";
import { useVisualizationGroupMotion } from "../src/shared/use-visualization-motion.js";

/**
 * Renders one delegated visualization-motion fixture.
 *
 * @returns A group containing one visualization target.
 */
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

afterEach(cleanup);

describe("visual component ownership", () => {
  it("keeps donut source data consumer-owned and bounds UI normalization styles", () => {
    const segments = [
      { label: "已完成", tone: "data-1", value: 1 },
      { label: "待处理", tone: "warning", value: 3 },
    ] as const;
    const sourceSnapshot = structuredClone(segments);
    const { container, rerender } = render(<Donut aria-label="任务分布" segments={segments} />);
    const arcs = container.querySelectorAll<SVGCircleElement>(".miaixz-donut-segment");

    expect(segments).toEqual(sourceSnapshot);
    expect(arcs).toHaveLength(2);
    expect(arcs[0]?.style.getPropertyValue("--miaixz-donut-segment")).toBe("25 75");
    expect(arcs[0]?.style.getPropertyValue("--miaixz-donut-offset")).toBe("0");
    expect(arcs[1]?.style.getPropertyValue("--miaixz-donut-segment")).toBe("75 25");
    expect(arcs[1]?.style.getPropertyValue("--miaixz-donut-offset")).toBe("-25");
    expect(arcs[0]?.getAttribute("style")).not.toMatch(/(?:#|rgb|color:|background:)/u);

    rerender(
      <Donut
        aria-label="任务分布"
        segments={[{ label: "已完成", tone: "success", value: 4 }]}
        variant="distribution"
      />,
    );
    const distribution = screen.getByRole("img", { name: "任务分布" });
    expect(distribution.style.getPropertyValue("--miaixz-donut-fill")).toBe(
      "conic-gradient(var(--miaixz-color-success) 0% 100%)",
    );
    expect(distribution.getAttribute("style")).not.toMatch(/(?:#|rgb)/u);
  });

  it("rejects invalid donut values before emitting dynamic geometry", () => {
    expect(() =>
      render(
        <Donut aria-label="无效分布" segments={[{ label: "错误", tone: "danger", value: -1 }]} />,
      ),
    ).toThrow("Donut segment values must be finite non-negative numbers");
  });

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
    expect(container.querySelectorAll(".miaixz-sparkline-point")).toHaveLength(4);
    expect(
      container.querySelector(".miaixz-sparkline-trend")?.getAttribute("preserveAspectRatio"),
    ).toBe("none");
    expect(container.querySelector(".miaixz-sparkline-line")?.getAttribute("points")).toBe(
      "0.00,74.00 120.00,41.00 240.00,63.00 360.00,8.00",
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

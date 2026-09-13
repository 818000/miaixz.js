/*
 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
 ~                                                                           ~
 ~ Copyright (c) 2015-2026 miaixz.org and other contributors.                ~
 ~                                                                           ~
 ~ Licensed under the Apache License, Version 2.0 (the "License");           ~
 ~ you may not use this file except in compliance with the License.          ~
 ~ You may obtain a copy of the License at                                   ~
 ~                                                                           ~
 ~      https://www.apache.org/licenses/LICENSE-2.0                          ~
 ~                                                                           ~
 ~ Unless required by applicable law or agreed to in writing, software       ~
 ~ distributed under the License is distributed on an "AS IS" BASIS,         ~
 ~ WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  ~
 ~ See the License for the specific language governing permissions and       ~
 ~ limitations under the License.                                            ~
 ~                                                                           ~
 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
 */

import "@testing-library/jest-dom/vitest";
import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Columns } from "../src/components/columns/index.js";
import { Donut } from "../src/components/donut/index.js";
import { Heatmap } from "../src/components/heatmap/index.js";
import { Sparkline } from "../src/components/sparkline/index.js";
import { renderWithLocale } from "./test-utils.js";

afterEach(cleanup);

const levels = ["无", "很低", "低", "中", "高", "很高"] as const;

describe("visual component ownership", () => {
  it("normalizes donut geometry without mutating data and exposes an equivalent table", () => {
    const segments = [
      { id: "done", label: "已完成", tone: "data-1", value: 1 },
      { id: "pending", label: "待处理", tone: "warning", value: 3 },
    ] as const;
    const snapshot = structuredClone(segments);
    const { container } = renderWithLocale(<Donut aria-label="任务分布" segments={segments} />);
    const arcs = container.querySelectorAll<SVGCircleElement>(".miaixz-donut-segment");

    expect(segments).toEqual(snapshot);
    expect(arcs).toHaveLength(2);
    expect(arcs[0]?.style.getPropertyValue("--miaixz-donut-segment")).toBe("25 75");
    expect(screen.getByRole("table", { name: "任务分布" })).toHaveTextContent("待处理");
  });

  it("uses stable series ids and data-owned layout for columns", () => {
    const { container } = renderWithLocale(
      <Columns
        aria-label="资源趋势"
        labels={["一", "二"]}
        series={[{ id: "resource", label: "资源", values: [25, 75] }]}
        tone="success"
      />,
    );

    expect(screen.getByRole("group", { name: "资源趋势" })).toHaveAttribute(
      "data-layout",
      "grouped",
    );
    expect(container.querySelectorAll(".miaixz-columns-bar")).toHaveLength(2);
    expect(screen.getByRole("table", { name: "资源趋势" })).toHaveTextContent("75");
  });

  it("renders accessible sparkline geometry from finite runs", () => {
    const { container } = renderWithLocale(
      <Sparkline aria-label="调用趋势" showGrid size="large" values={[2, 5, Number.NaN, 8]} />,
    );
    expect(screen.getByRole("img", { name: "调用趋势" })).toHaveAttribute("data-state", "ready");
    expect(container.querySelectorAll(".miaixz-sparkline-line")).toHaveLength(1);
    expect(container.querySelectorAll(".miaixz-sparkline-points")).toHaveLength(2);
    expect(container.querySelector(".miaixz-sparkline-grid")).not.toBeNull();
  });

  it("renders empty, single-point, constant-area, and custom-formatted sparkline branches", () => {
    const { container } = renderWithLocale(
      <>
        <Sparkline aria-label="Empty trend" values={[Number.NaN]} />
        <Sparkline aria-label="Single trend" description="One point" size="medium" values={[5]} />
        <Sparkline
          aria-label="Area trend"
          showGrid
          size="large"
          slotProps={{
            root: { className: "spark-root" },
            title: { className: "spark-title" },
            description: { className: "spark-description" },
            grid: { className: "spark-grid" },
            area: { className: "spark-area" },
            line: { className: "spark-line" },
            points: { className: "spark-points" },
          }}
          tone="success"
          valueFormatter={(value) => `${value} units`}
          values={[4, 4]}
          variant="area"
        />
      </>,
    );
    expect(screen.getByRole("img", { name: "Empty trend" })).toHaveAttribute("data-state", "empty");
    expect(screen.getByRole("img", { name: "Single trend" })).toHaveAccessibleDescription(
      "One point",
    );
    expect(screen.getByRole("img", { name: "Area trend" })).toHaveAccessibleDescription(/4 units/u);
    expect(container.querySelector(".spark-area")).not.toBeNull();
    expect(container.querySelector(".spark-grid")).not.toBeNull();
    expect(container.querySelector(".spark-points circle")).toHaveAttribute("r", "2.5");
  });

  it("owns heatmap dimensions, level labels and cell semantics", () => {
    renderWithLocale(
      <Heatmap
        aria-label="活跃度"
        columnLabels={["周一"]}
        levelLabels={levels}
        levels={[[3]]}
        rowLabels={["上午"]}
        tone="brand"
      />,
    );
    expect(screen.getByRole("region", { name: "活跃度" })).toBeVisible();
    expect(screen.getByRole("cell", { name: "上午，周一：中" })).toHaveAttribute("data-level", "3");
  });

  it("rejects invalid visualization data with stable error codes", () => {
    expect(() =>
      renderWithLocale(
        <Donut
          aria-label="无效分布"
          segments={[{ id: "invalid", label: "错误", tone: "danger", value: -1 }]}
        />,
      ),
    ).toThrowError(expect.objectContaining({ code: "UI_DONUT_VALUE_INVALID" }));
  });
});

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Header } from "../src/components/header/index.js";
import { Columns } from "../src/components/columns/index.js";
import { Pressable } from "../src/components/pressable/index.js";
import { Panel } from "../src/components/panel/index.js";
import { Metric } from "../src/components/metric/index.js";

afterEach(cleanup);

describe("Composition variants", () => {
  it("keeps compact summaries and emphasized cards in the metric component", () => {
    const { container } = render(
      <>
        <Metric variant="compact" label="命中" value={4} tone="success" />
        <Metric variant="card" emphasized label="在线" value={42} tone="info" />
      </>,
    );
    expect(container.querySelector(".miaixz-metric-compact")?.textContent).toBe("命中4");
    expect(container.querySelector(".miaixz-metric-card")?.getAttribute("data-emphasized")).toBe(
      "true",
    );
  });
  it("separates body flush from header spacing and inline actions", () => {
    const { container } = render(
      <Panel bodyFlush headerLayout="inline" title="标题" actions={<button>新建</button>}>
        正文
      </Panel>,
    );
    const panel = container.querySelector("section")!;
    expect(panel.classList.contains("miaixz-panel-body-flush")).toBe(true);
    expect(panel.classList.contains("miaixz-panel-flush")).toBe(false);
    expect(panel.classList.contains("miaixz-panel-header-inline")).toBe(true);
    expect(panel.hasAttribute("bodyFlush")).toBe(false);
  });
  it("keeps the compact heading and actions accessible without leaking props", () => {
    render(
      <Header
        title="标题"
        description="说明"
        variant="compact"
        spacing="none"
        actions={<button>操作</button>}
      />,
    );
    const header = screen.getByRole("heading", { name: "标题" }).closest("header")!;
    expect(header.classList.contains("miaixz-header-compact")).toBe(true);
    expect(header.hasAttribute("variant")).toBe(false);
    expect(screen.getByRole("button", { name: "操作" })).toBeTruthy();
  });
  it("retains the chart name, series legend and accessible values", () => {
    render(
      <Columns
        aria-label="趋势"
        tone="info"
        variant="paired"
        size="large"
        showLegend
        labels={["周一"]}
        series={[
          { label: "正式", values: [12] },
          { label: "灰度", values: [3] },
        ]}
      />,
    );
    const chart = screen.getByRole("img", { name: "趋势" });
    expect(chart.classList.contains("miaixz-columns-large")).toBe(true);
    expect(chart.querySelector(".miaixz-columns-legend")?.textContent).toBe("正式灰度");
    expect(document.getElementById(chart.getAttribute("aria-describedby")!)?.textContent).toContain(
      "正式 12、灰度 3",
    );
  });
  it("owns selected row, density and separator styles without DOM prop leakage", () => {
    render(
      <Pressable variant="row" density="compact" separator="none" aria-pressed>
        条目
      </Pressable>,
    );
    const row = screen.getByRole("button", { name: "条目" });
    expect(row.classList.contains("miaixz-pressable-density-compact")).toBe(true);
    expect(row.getAttribute("aria-pressed")).toBe("true");
    expect(row.hasAttribute("density")).toBe(false);
  });
});

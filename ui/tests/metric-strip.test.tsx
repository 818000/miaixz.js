import { readFileSync } from "node:fs";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Icon } from "../src/components/icon/index.js";
import { Metric } from "../src/components/metric/index.js";
import { MetricGroup } from "../src/components/metric-group/index.js";

afterEach(cleanup);

describe("optional strip icons", () => {
  it("preserves the workbench five-item summary composition and geometry", () => {
    render(
      <MetricGroup aria-label="工作概览" columns={5} itemVariant="preserve" variant="summary">
        {Array.from({ length: 5 }, (_, index) => (
          <li key={index}>
            <Metric label={`指标 ${index + 1}`} value={index + 1} variant="summary" />
          </li>
        ))}
      </MetricGroup>,
    );
    const group = screen.getByLabelText("工作概览");
    const list = group.querySelector(".miaixz-metric-group-summary-list") as HTMLElement;
    expect(group.getAttribute("data-columns")).toBe("5");
    expect(list.style.getPropertyValue("--miaixz-metric-group-columns")).toBe("5");
    expect(list.children).toHaveLength(5);
    expect(list.querySelectorAll(".miaixz-metric-summary")).toHaveLength(5);
    expect(screen.getByText("指标 5")).toBeTruthy();
    expect(screen.getByText("5")).toBeTruthy();

    const css = readFileSync("src/styles/components/metric-group.css", "utf8");
    const summaryRule = css.match(/\.miaixz-metric-group-summary-list\s*\{([^}]*)\}/)?.[1];
    expect(summaryRule).toContain("height: 114.75px");
    expect(summaryRule).toContain("min-height: calc(86px + var(--miaixz-density-item-height))");
    expect(summaryRule).toContain(
      "grid-template-columns: repeat(var(--miaixz-metric-group-columns), minmax(0, 1fr))",
    );
    expect(css).toMatch(/@container miaixz-metrics \(width <= 1200px\)[\s\S]*height: 150px/u);
    expect(css).toMatch(/minmax\(220px, 1fr\)[\s\S]*overflow: auto hidden/u);
    expect(css).toContain(".miaixz-metric-group-summary-list > li:not(:last-child) .miaixz-metric");
    expect(css).toMatch(/li:hover,[\s\S]*li:focus-within[\s\S]*z-index: 2/u);
  });

  it("keeps metrics static and decorative icons out of the accessibility tree", () => {
    const { container } = render(
      <Metric icon={<Icon name="LayoutGrid" />} label="应用" value="17" variant="strip" />,
    );
    const metric = container.querySelector("article")!;
    expect(metric.classList.contains("miaixz-metric-strip-with-icon")).toBe(true);
    expect(metric.hasAttribute("tabindex")).toBe(false);
    expect(container.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
    expect(container.querySelector("svg")?.getAttribute("focusable")).toBe("false");
    expect(container.querySelector("button, a")).toBeNull();
  });

  it("does not reserve icon space for iconless strips or other variants", () => {
    const { container } = render(
      <>
        <Metric label="指标" value="8" variant="strip" />
        <Metric icon={null} label="指标" value="8" variant="strip" />
        <Metric icon={<Icon name="Server" />} label="指标" value="8" variant="summary" />
      </>,
    );
    expect(container.querySelector(".miaixz-metric-strip-with-icon")).toBeNull();
  });

  it("retains real link and action semantics when supplied by the consumer", () => {
    const action = vi.fn();
    const { container } = render(
      <>
        <Metric
          icon={<Icon name="SlidersHorizontal" />}
          label="配置"
          value="8"
          variant="strip"
          href="/configurations"
        />
        <Metric
          icon={<Icon name="Upload" />}
          label="发布"
          value="8"
          variant="strip"
          onAction={action}
        />
      </>,
    );
    expect(container.querySelector("a")?.getAttribute("href")).toBe("/configurations");
    fireEvent.click(container.querySelector("button")!);
    expect(action).toHaveBeenCalledOnce();
    expect(container.querySelectorAll(".miaixz-metric-strip-with-icon")).toHaveLength(2);
  });

  it("uses only theme paint for circle hover and keyboard focus without coloring dividers", () => {
    const css = readFileSync("src/styles/components/metric.css", "utf8");
    const rule = css.match(
      /\.miaixz-metric-strip-with-icon:hover \.miaixz-metric-icon,\s*\.miaixz-metric-strip-with-icon:focus-visible \.miaixz-metric-icon \{([^}]+)\}/,
    )![1]!;
    expect(rule).toContain("color: var(--miaixz-color-on-brand);");
    expect(rule).toContain("background: var(--miaixz-metric-tone);");
    expect(rule).toContain("border-color: var(--miaixz-metric-tone);");
    expect(css).not.toContain(".miaixz-metric-strip::before");
  });
});

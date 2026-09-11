import { readFileSync } from "node:fs";
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Metric } from "../src/components/metric/index.js";
import { MetricGroup } from "../src/components/metric-group/index.js";

afterEach(cleanup);

const metrics = Array.from({ length: 5 }, (_, index) => (
  <Metric key={index} label={`指标 ${index + 1}`} value={index + 1} />
));

describe("MetricGroup", () => {
  it("preserves the legacy four-column default", () => {
    render(<MetricGroup aria-label="默认指标">{metrics.slice(0, 4)}</MetricGroup>);
    const group = screen.getByLabelText("默认指标");
    expect(group).toHaveAttribute("data-columns", "4");
    expect(group.children).toHaveLength(4);
    for (const item of group.children) expect(item).toHaveClass("miaixz-metric-strip");
  });

  it("supports explicit four- and five-column groups", () => {
    const { rerender } = render(
      <MetricGroup aria-label="指标" columns={4}>
        {metrics.slice(0, 4)}
      </MetricGroup>,
    );
    expect(screen.getByLabelText("指标")).toHaveAttribute("data-columns", "4");
    rerender(
      <MetricGroup aria-label="指标" columns={5}>
        {metrics}
      </MetricGroup>,
    );
    expect(screen.getByLabelText("指标")).toHaveAttribute("data-columns", "5");
    expect(screen.getByLabelText("指标").children).toHaveLength(5);
  });

  it("preserves explicitly selected metric variants", () => {
    render(
      <MetricGroup aria-label="自定义指标" itemVariant="preserve">
        <Metric label="摘要" value="12" variant="summary" />
        <Metric label="紧凑" value="8" variant="compact" />
      </MetricGroup>,
    );
    const group = screen.getByLabelText("自定义指标");
    expect(group.children[0]).toHaveClass("miaixz-metric-summary");
    expect(group.children[1]).toHaveClass("miaixz-metric-compact");
  });

  it("exposes transparent, compact and spacing variants without changing child data", () => {
    render(
      <MetricGroup
        aria-label="紧凑指标"
        columns={5}
        density="compact"
        spacingAfter="compact"
        surface="transparent"
      >
        {metrics}
      </MetricGroup>,
    );
    const group = screen.getByLabelText("紧凑指标");
    expect(group).toHaveClass("miaixz-metric-group-transparent");
    expect(group).toHaveClass("miaixz-metric-group-compact");
    expect(group).toHaveClass("miaixz-metric-group-spacing-compact");
    expect(screen.getByText("指标 5")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("owns horizontal overflow only for explicit five-column groups", () => {
    const css = readFileSync("src/styles/components/metric-group.css", "utf8");
    const fiveColumnRule = css.match(
      /\.miaixz-metric-group\[data-columns="5"\]\s*\{([^}]*)\}/,
    )?.[1];

    expect(fiveColumnRule).toContain("grid-template-columns: repeat(5, minmax(220px, 1fr))");
    expect(fiveColumnRule).toContain("overflow: auto hidden");
    expect(fiveColumnRule).toContain("overscroll-behavior-inline: contain");
    expect(css).toContain('[data-columns="5"]');
    expect(css).not.toContain("miaixz-metric-group-scroll");
  });

  it("owns separator removal for the final item in both column modes", () => {
    const css = readFileSync("src/styles/components/metric-group.css", "utf8");
    expect(css).toContain('[data-columns="4"] > .miaixz-metric-strip:nth-child(4n)');
    expect(css).toContain('[data-columns="5"] > .miaixz-metric-strip:nth-child(5n)');
    expect(css).toMatch(
      /\.miaixz-metric-group > \.miaixz-metric-strip\s*\{[\s\S]*border-inline-end:/u,
    );
    expect(css).toMatch(
      /\.miaixz-metric-group > \.miaixz-metric-strip:last-child\s*\{[\s\S]*border-block-end: 0/u,
    );
  });
});

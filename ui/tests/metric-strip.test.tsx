import { readFileSync } from "node:fs";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Icon } from "../src/components/icon/index.js";
import { Metric } from "../src/components/metric/index.js";

afterEach(cleanup);

describe("optional strip icons", () => {
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

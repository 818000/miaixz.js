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
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Metric, Metrics } from "../src/components/metrics/index.js";
import { renderWithLocale } from "./test-utils.js";

afterEach(cleanup);

describe("Metrics", () => {
  it("uses explicit layout, column, surface and density dimensions", () => {
    renderWithLocale(
      <Metrics
        aria-label="关键指标"
        columns={5}
        density="compact"
        layout="grid"
        responsive="mobile"
        spacingAfter="compact"
        surface="plain"
      >
        <Metric label="用户" value="8" />
        <Metric label="订单" value="5" variant="card" />
      </Metrics>,
    );

    const group = screen.getByRole("group", { name: "关键指标" });
    expect(group).toHaveAttribute("data-layout", "grid");
    expect(group).toHaveAttribute("data-columns", "5");
    expect(group).toHaveAttribute("data-density", "compact");
    expect(group).toHaveAttribute("data-responsive", "mobile");
    expect(group).toHaveAttribute("data-spacing-after", "compact");
    expect(group).toHaveAttribute("data-surface", "plain");
    expect(screen.getByText("订单").closest(".miaixz-metric")).toHaveAttribute(
      "data-variant",
      "card",
    );
  });

  it("omits an ARIA name when none was supplied", () => {
    const { container } = renderWithLocale(
      <Metrics>
        <Metric label="用户" value="8" />
      </Metrics>,
    );
    const metrics = container.querySelector(".miaixz-metrics");
    expect(metrics).not.toHaveAttribute("aria-label");
    expect(metrics).not.toHaveAttribute("role");
  });

  it("preserves aria-labelledby naming without manufacturing a second label", () => {
    renderWithLocale(
      <>
        <h2 id="metrics-heading">指标</h2>
        <Metrics aria-labelledby="metrics-heading">
          <Metric label="用户" value="8" />
        </Metrics>
      </>,
    );
    expect(screen.getByRole("group", { name: "指标" })).toHaveAttribute(
      "aria-labelledby",
      "metrics-heading",
    );
  });
});

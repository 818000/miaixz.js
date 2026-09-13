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

import { Header } from "../src/components/header/index.js";
import { Metric } from "../src/components/metrics/index.js";
import { Panel } from "../src/components/panel/index.js";

afterEach(cleanup);

describe("composition dimensions", () => {
  it("keeps density and spacing on Header without leaking component props", () => {
    render(
      <Header
        actions={<button type="button">操作</button>}
        density="compact"
        description="说明"
        spacing="none"
        title="标题"
      />,
    );
    const header = screen.getByRole("heading", { name: "标题" }).closest("header");
    expect(header).toHaveAttribute("data-density", "compact");
    expect(header).toHaveAttribute("data-spacing", "none");
    expect(header).not.toHaveAttribute("density");
    expect(screen.getByRole("button", { name: "操作" })).toBeVisible();
  });

  it("composes Panel from final surface, frame and density dimensions", () => {
    render(
      <Panel
        aria-label="设置"
        as="section"
        density="comfortable"
        frame="outlined"
        surface="filled"
        title="设置"
      >
        正文
      </Panel>,
    );
    const panel = screen.getByRole("region", { name: "设置" });
    expect(panel).toHaveAttribute("data-frame", "outlined");
    expect(panel).toHaveAttribute("data-surface", "filled");
    expect(panel).toHaveAttribute("data-density", "comfortable");
  });

  it("keeps metric variant and emphasis as independent final dimensions", () => {
    const { container } = render(
      <Metric emphasized label="在线" value="42" variant="card" tone="info" />,
    );
    expect(container.querySelector(".miaixz-metric")).toHaveAttribute("data-variant", "card");
    expect(container.querySelector(".miaixz-metric")).toHaveAttribute("data-emphasized", "true");
  });
});

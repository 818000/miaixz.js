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
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Metric, Metrics } from "../src/components/metrics/index.js";
import { renderWithLocale } from "./test-utils.js";

afterEach(cleanup);

describe("Metric interaction contracts", () => {
  it("maps strip layout through one shared context while preserving explicit variants", () => {
    renderWithLocale(
      <Metrics aria-label="指标" layout="strip">
        <Metric label="默认" value="8" />
        <Metric label="卡片" value="5" variant="card" />
      </Metrics>,
    );
    expect(screen.getByText("默认").closest(".miaixz-metric")).toHaveAttribute(
      "data-variant",
      "strip",
    );
    expect(screen.getByText("卡片").closest(".miaixz-metric")).toHaveAttribute(
      "data-variant",
      "card",
    );
  });

  it("renders static, navigation and action metrics with distinct native semantics", () => {
    const onAction = vi.fn();
    render(
      <>
        <Metric label="静态" value="1" />
        <Metric href="/details" label="链接" value="2" />
        <Metric label="动作" onAction={onAction} value="3" />
      </>,
    );

    expect(screen.queryByRole("button", { name: /静态/u })).toBeNull();
    expect(screen.getByRole("link", { name: /链接/u })).toHaveAttribute("href", "/details");
    fireEvent.click(screen.getByRole("button", { name: /动作/u }));
    expect(onAction).toHaveBeenCalledOnce();
  });
});

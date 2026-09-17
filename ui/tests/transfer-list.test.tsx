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

import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { TransferList } from "../src/components/transfer-list/index.js";

afterEach(cleanup);

describe("TransferList", () => {
  it("renders the shared two-pane contract with stable defaults", () => {
    render(
      <TransferList
        label="成员转移"
        source={<p>候选成员</p>}
        sourceLabel="可选成员"
        sourceHeader="候选"
        target={<p>已选成员</p>}
        targetLabel="已选成员"
        targetHeader="已选"
      />,
    );

    const transfer = screen.getByRole("region", { name: "成员转移" });
    expect(transfer).toHaveAttribute("data-ui", "transfer-list");
    expect(transfer).toHaveAttribute("data-target-size", "standard");
    expect(transfer).toHaveAttribute("data-mobile-pane-size", "comfortable");
    expect(within(transfer).getByText("候选成员")).toBeVisible();
    expect(within(transfer).getByText("已选成员")).toBeVisible();
    expect(within(transfer).getByRole("region", { name: "可选成员" })).toBeVisible();
    expect(within(transfer).getByRole("complementary", { name: "已选成员" })).toBeVisible();
  });

  it("exposes finite geometry choices and slot composition", () => {
    render(
      <TransferList
        label="数据集关联"
        mobilePaneSize="compact"
        source={<p>目录</p>}
        sourceLabel="可选数据集"
        sourceHeader="数据集"
        sourceHeaderLayout="between"
        target={<p>关联项</p>}
        targetLabel="已关联数据集"
        targetHeader="已关联"
        targetHeaderLayout="stack"
        targetSize="compact"
        slotProps={{ root: { className: "consumer-root" } }}
      />,
    );

    const transfer = screen.getByRole("region", { name: "数据集关联" });
    expect(transfer).toHaveClass("consumer-root");
    expect(transfer).toHaveAttribute("data-target-size", "compact");
    expect(transfer).toHaveAttribute("data-mobile-pane-size", "compact");
    expect(transfer).toHaveAttribute("data-source-header-layout", "between");
    expect(transfer).toHaveAttribute("data-target-header-layout", "stack");
  });
});

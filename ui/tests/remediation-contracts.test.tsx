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

import * as editor from "../src/components/editor/index.js";
import {
  Descriptions,
  EditorLayout,
  EditorSection,
  EditorSummary,
  Steps,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../src/index.js";
import * as ui from "../src/index.js";

afterEach(cleanup);

describe("remediation public contracts", () => {
  it("keeps scoped Editor helpers out of the root while retaining formal compositions", () => {
    expect(ui).toHaveProperty("EditorLayout");
    expect(ui).toHaveProperty("EditorSummary");
    expect(ui).not.toHaveProperty("EditorGroup");
    expect(ui).not.toHaveProperty("EditorPicker");
    expect(editor).toHaveProperty("EditorGroup");
    expect(editor).toHaveProperty("EditorPicker");
    expect(ui).toHaveProperty("Graph");
  });

  it("renders ordered Steps from the sole item collection", () => {
    render(
      <Steps
        items={[
          { id: "draft", label: "草稿", status: "complete" },
          { id: "review", label: "审核", status: "current" },
          { id: "publish", label: "发布", status: "disabled" },
        ]}
        label="发布流程"
      />,
    );
    const list = screen.getByRole("list", { name: "发布流程" });
    expect(
      within(list)
        .getAllByRole("listitem")
        .map((item) => item.dataset.status),
    ).toEqual(["complete", "current", "disabled"]);
    expect(within(list).getByText("审核").closest("li")).toHaveAttribute("aria-current", "step");
  });

  it("renders Descriptions as ordered native terms and definitions", () => {
    render(
      <Descriptions
        columns={2}
        items={[
          { id: "owner", label: "负责人", value: "Kimi" },
          { id: "scope", label: "范围", value: "生产" },
        ]}
      />,
    );
    expect(screen.getAllByRole("term").map((term) => term.textContent)).toEqual(["负责人", "范围"]);
    expect(screen.getByText("负责人").closest("dl")).toHaveAttribute("data-columns", "2");
  });

  it("keeps Editor summary data and section content in fixed owners", () => {
    render(
      <EditorLayout
        summary={
          <EditorSummary
            avatar={<span>KL</span>}
            items={[{ id: "role", label: "角色", value: "管理员" }]}
            subtitle="@kimi"
            title="Kimi"
          />
        }
      >
        <EditorSection description="基础字段" title="基础信息">
          <label>
            名称
            <input />
          </label>
        </EditorSection>
      </EditorLayout>,
    );
    expect(screen.getByRole("heading", { name: "Kimi" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "基础信息" })).toBeVisible();
    expect(screen.getByRole("textbox", { name: "名称" })).toBeVisible();
  });

  it("keeps TableHeader and TableHead as distinct semantic components", () => {
    render(
      <Table density="compact">
        <TableCaption>成员</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>姓名</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Kimi</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByRole("table", { name: "成员" })).toHaveAttribute("data-density", "compact");
    expect(screen.getByRole("columnheader", { name: "姓名" }).tagName).toBe("TH");
  });
});

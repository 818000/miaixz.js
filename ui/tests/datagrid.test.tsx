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
import { cleanup, fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Datagrid, type DatagridColumn } from "../src/components/datagrid/index.js";
import { renderWithLocale } from "./test-utils.js";

afterEach(cleanup);

interface Row {
  /**
   * Stable fixture identifier.
   */
  readonly id: string;
  /**
   * Visible fixture name.
   */
  readonly name: string;
}

const columns: readonly DatagridColumn<Row>[] = [
  { id: "name", header: "名称", cell: (row) => row.name, sortable: true, widthPercent: 80 },
];

describe("Datagrid", () => {
  it("renders a semantic table with the final layout and density dimensions", () => {
    renderWithLocale(
      <Datagrid
        bodyLayout="fill"
        caption="数据列表"
        captionVisibility="hidden"
        columns={columns}
        density="comfortable"
        getRowId={(row) => row.id}
        layout="fixed"
        rows={[{ id: "a", name: "Alpha" }]}
        surface="inset"
      />,
    );

    const table = screen.getByRole("table", { name: "数据列表" });
    expect(table).toBeVisible();
    expect(table.closest(".miaixz-datagrid")).toHaveAttribute("data-body-layout", "fill");
    expect(table.closest(".miaixz-datagrid")).toHaveAttribute("data-density", "comfortable");
    expect(screen.getByRole("cell", { name: "Alpha" })).toBeVisible();
    expect(screen.getByRole("columnheader", { name: /名称/u })).toHaveStyle({ width: "80%" });
  });

  it("cycles server-owned sorting without introducing grid semantics", () => {
    const onSortChange = vi.fn();
    renderWithLocale(
      <Datagrid
        caption="排序列表"
        columns={columns}
        getRowId={(row) => row.id}
        onSortChange={onSortChange}
        rows={[{ id: "a", name: "Alpha" }]}
      />,
    );
    expect(screen.queryByRole("grid")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "名称" }));
    expect(onSortChange).toHaveBeenCalledWith({ columnId: "name", direction: "ascending" });
  });

  it("reports multiple selection through controlled row ids", () => {
    const onSelectedRowIdsChange = vi.fn();
    renderWithLocale(
      <Datagrid
        caption="选择列表"
        columns={columns}
        getRowId={(row) => row.id}
        onSelectedRowIdsChange={onSelectedRowIdsChange}
        rows={[{ id: "a", name: "Alpha" }]}
        selectedRowIds={[]}
        selectionMode="multiple"
      />,
    );
    fireEvent.click(screen.getByRole("checkbox", { name: "选择行" }));
    expect(onSelectedRowIdsChange).toHaveBeenCalledWith(["a"]);
  });
});

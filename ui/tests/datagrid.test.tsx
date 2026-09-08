import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { createMiaixzI18n } from "@miaixz/sdk/i18n";
import { MiaixzLocaleProvider, miaixzUiMessages } from "../src/i18n/index.js";
import { Datagrid, type DatagridColumn } from "../src/components/datagrid/index.js";
import { Status } from "../src/components/status/index.js";
import { readFileSync } from "node:fs";

afterEach(cleanup);

describe("List composition", () => {
  it.each(["content", "fill"] as const)("exposes the %s body layout contract", (bodyLayout) => {
    const { container } = render(
      <MiaixzLocaleProvider
        i18n={createMiaixzI18n({ locale: "zh-CN", messages: miaixzUiMessages })}
      >
        <Datagrid
          bodyLayout={bodyLayout}
          caption="布局测试"
          rows={[{ id: "a" }]}
          getRowId={(row) => row.id}
          columns={[{ id: "id", header: "记录", cell: (row) => row.id }]}
        />
      </MiaixzLocaleProvider>,
    );
    expect(container.querySelector(`.miaixz-datagrid-body-${bodyLayout}`)).not.toBeNull();
    expect(container.querySelector("[bodyLayout]")).toBeNull();
  });

  it("limits sticky heads to fill mode and lets content-mode wheel events reach the page", () => {
    const css = readFileSync("src/styles/components/datagrid.css", "utf8");
    expect(css).toMatch(
      /\.miaixz-datagrid-body-content \.miaixz-datagrid-container\s*\{\s*overscroll-behavior-y: auto;/,
    );
    expect(css).toMatch(/\.miaixz-datagrid-body-fill \.miaixz-table-head\s*\{\s*position: sticky;/);
    expect(css).not.toMatch(/\.miaixz-datagrid \.miaixz-table-head\s*\{\s*position: sticky;/);
  });

  it("keeps compact table typography and row geometry on public roles", () => {
    const css = readFileSync("src/styles/components/datagrid.css", "utf8");
    const compactTable = css.match(
      /\.miaixz-datagrid-rows-compact \.miaixz-table\s*\{([^}]*)\}/,
    )?.[1];
    const compactCell = css.match(
      /\.miaixz-datagrid-rows-compact \.miaixz-table-cell\s*\{([^}]*)\}/,
    )?.[1];
    const compactHeader = css.match(
      /\.miaixz-datagrid-rows-compact \.miaixz-table-header\s*\{([^}]*)\}/,
    )?.[1];

    expect(compactTable).toContain("font-size: var(--miaixz-text-compact-body-size)");
    expect(compactTable).toContain("line-height: var(--miaixz-text-compact-body-line-height)");
    expect(compactCell).toContain("height: 48px");
    expect(compactCell).toContain("padding: 8px 10px");
    expect(compactHeader).toContain("height: 40px");
    expect(compactHeader).toContain("font-size: var(--miaixz-text-compact-caption-size)");
    expect(compactHeader).toContain("line-height: var(--miaixz-text-compact-caption-line-height)");
    expect(`${compactTable}${compactHeader}`).not.toMatch(/font-size:\s*(?:10|12)px/);
  });

  it("keeps a hidden caption accessible and fixed widths on column headers", () => {
    render(
      <MiaixzLocaleProvider
        i18n={createMiaixzI18n({ locale: "zh-CN", messages: miaixzUiMessages })}
      >
        <Datagrid
          variant="inset"
          layout="fixed"
          rowSize="comfortable"
          captionVisibility="hidden"
          caption="数据列表"
          selectionMode="multiple"
          selectionWidthPercent={4}
          rows={[{ id: "a" }]}
          getRowId={(row) => row.id}
          columns={[{ id: "name", header: "名称", widthPercent: 96, cell: (row) => row.id }]}
        />
      </MiaixzLocaleProvider>,
    );
    expect(screen.getByRole("table", { name: "数据列表" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "名称" }).style.width).toBe("96%");
    expect(screen.getAllByRole("columnheader")[0]?.style.width).toBe("4%");
    expect(
      screen.getByRole("table").closest(".miaixz-datagrid")?.hasAttribute("captionVisibility"),
    ).toBe(false);
  });
  it("places business content between the status marker and label", () => {
    const { container } = render(
      <Status variant="split" label="健康" tone="success">
        <strong>生产</strong>
      </Status>,
    );
    expect(container.querySelector(".miaixz-status-content")?.textContent).toBe("生产");
    expect(screen.getByText("健康")).toBeTruthy();
  });

  it("keeps empty and long business values inside the semantic Table composition", () => {
    const i18n = createMiaixzI18n({ locale: "zh-CN", messages: miaixzUiMessages });
    const columns: readonly DatagridColumn<Readonly<Record<"name", string>>>[] = [
      {
        id: "name",
        header: "名称",
        cell: (row) => row.name,
      },
    ];
    const { rerender } = render(
      <MiaixzLocaleProvider i18n={i18n}>
        <Datagrid
          caption="空数据列表"
          columns={columns}
          emptyState={<span>当前没有记录</span>}
          getRowId={(row) => row.name}
          rowSize="compact"
          rows={[]}
        />
      </MiaixzLocaleProvider>,
    );
    const empty = screen.getByText("当前没有记录");
    expect(empty.closest("td")?.getAttribute("colspan")).toBe("1");

    const longName = "不会因为紧凑密度或固定表格组合而从语义单元格中丢失的超长业务名称";
    rerender(
      <MiaixzLocaleProvider i18n={i18n}>
        <Datagrid
          caption="长数据列表"
          columns={columns}
          getRowId={(row) => row.name}
          layout="fixed"
          rowSize="compact"
          rows={[{ name: longName }]}
        />
      </MiaixzLocaleProvider>,
    );
    expect(screen.getByRole("cell", { name: longName }).textContent).toBe(longName);
    expect(screen.getByRole("table", { name: "长数据列表" })).toBeTruthy();
  });
});

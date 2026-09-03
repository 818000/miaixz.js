import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { createMiaixzI18n } from "@miaixz/sdk/i18n";
import { MiaixzLocaleProvider, miaixzUiMessages } from "../src/i18n/index.js";
import { Datagrid } from "../src/components/datagrid/index.js";
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
});

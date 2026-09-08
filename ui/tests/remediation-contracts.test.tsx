import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import * as ui from "../src/index.js";
import {
  Descriptions,
  EditorGroup,
  EditorLayout,
  EditorOverview,
  EditorPicker,
  EditorSection,
  EditorSummary,
  Steps,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "../src/index.js";

afterEach(cleanup);

describe("remediation public contracts", () => {
  it("exports every new composition from the public root", () => {
    for (const name of [
      "Descriptions",
      "EditorGroup",
      "EditorLayout",
      "EditorOverview",
      "EditorPicker",
      "EditorSection",
      "EditorSummary",
      "Steps",
      "TableContainer",
    ]) {
      expect(ui).toHaveProperty(name);
    }
  });

  it("renders ordered Steps with stable defaults and semantic states", () => {
    render(
      <Steps
        items={[
          { id: "draft", label: "草稿" },
          { id: "review", label: "审核", status: "current" },
          { id: "publish", label: "发布", status: "disabled" },
        ]}
        label="发布流程"
      />,
    );

    const list = screen.getByRole("list", { name: "发布流程" });
    expect(list).toHaveClass("miaixz-steps");
    expect(list).not.toHaveAttribute("data-interactive");
    expect(
      within(list)
        .getAllByRole("listitem")
        .map((item) => item.dataset.status),
    ).toEqual(["pending", "current", "disabled"]);
    expect(within(list).getByText("审核").closest("li")).toHaveAttribute("aria-current", "step");
  });

  it("renders Descriptions as ordered native terms and definitions", () => {
    render(
      <Descriptions
        items={[
          { id: "owner", label: "负责人", value: "Kimi" },
          { id: "scope", label: "范围", value: "生产" },
        ]}
      />,
    );

    expect(screen.getAllByRole("term").map((term) => term.textContent)).toEqual(["负责人", "范围"]);
    expect(screen.getAllByRole("definition").map((value) => value.textContent)).toEqual([
      "Kimi",
      "生产",
    ]);
    expect(screen.getByText("负责人").closest("dl")).toHaveAttribute("data-columns", "1");
  });

  it("keeps Editor compositions generic and preserves consumer content order", () => {
    render(
      <EditorLayout
        summary={
          <EditorSummary
            avatar={<span>KL</span>}
            items={[{ label: "角色", value: "管理员" }]}
            subtitle="@kimi"
            title="Kimi"
          />
        }
      >
        <EditorOverview items={[{ label: "状态", value: "启用" }]} />
        <EditorSection description="基础字段" title="基础信息">
          <EditorGroup title="身份">
            <label>
              名称
              <input />
            </label>
          </EditorGroup>
          <EditorPicker aria-label="候选项">候选内容</EditorPicker>
        </EditorSection>
      </EditorLayout>,
    );

    expect(screen.getByRole("heading", { name: "Kimi" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "基础信息" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "身份" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "名称" })).toBeInTheDocument();
    expect(screen.getByLabelText("候选项")).toHaveTextContent("候选内容");
  });

  it("wraps semantic tables with default and transparent surface contracts", () => {
    const { rerender } = render(
      <TableContainer data-testid="container">
        <Table variant="compact">
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
        </Table>
      </TableContainer>,
    );
    expect(screen.getByTestId("container")).toHaveClass("miaixz-table-container");
    expect(screen.getByTestId("container")).not.toHaveClass("miaixz-table-container-transparent");
    expect(screen.getByRole("table", { name: "成员" })).toHaveClass("miaixz-table-compact");

    rerender(<TableContainer data-testid="container" frame="plain" surface="transparent" />);
    expect(screen.getByTestId("container")).toHaveClass("miaixz-table-container-transparent");
    expect(screen.getByTestId("container")).toHaveClass("miaixz-table-container-plain");
  });

  if (import.meta.env.MODE === "typecheck") {
    /*
     * @ts-expect-error Steps only accepts public semantic states.
     */
    void (<Steps items={[{ id: "x", label: "X", status: "active" }]} label="invalid" />);
    /*
     * @ts-expect-error Descriptions has a bounded column contract.
     */
    void (<Descriptions columns={4} items={[]} />);
    /*
     * @ts-expect-error EditorSection has no business-specific layout variant.
     */
    void (<EditorSection layout="service-release" title="invalid" />);
    /*
     * @ts-expect-error TableContainer surface is intentionally bounded.
     */
    void (<TableContainer surface="brand" />);
  }
});

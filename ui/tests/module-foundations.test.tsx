import { readFileSync } from "node:fs";
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { EditorLayout, EditorSection, EditorSummary } from "../src/components/editor/index.js";
import { ModuleFrame } from "../src/components/module-frame/index.js";
import { Panel } from "../src/components/panel/index.js";

afterEach(cleanup);

describe("module foundations", () => {
  it("preserves ModuleFrame defaults and exposes bounded layout variants", () => {
    const { rerender } = render(
      <ModuleFrame aria-label="默认模块" description="默认说明" title="默认标题">
        默认内容
      </ModuleFrame>,
    );
    const frame = screen.getByRole("region", { name: "默认模块" });
    expect(screen.getByRole("heading", { name: "默认标题", level: 1 })).toBeInTheDocument();
    expect(frame).not.toHaveClass("miaixz-module-frame-compact");
    expect(frame).not.toHaveClass("miaixz-module-frame-workspace");
    expect(frame).not.toHaveAttribute("aria-disabled");

    rerender(
      <ModuleFrame
        aria-label="变化模块"
        contentProps={{ className: "consumer-content", "data-spacing": "none" }}
        disabled
        mastheadProps={{ className: "consumer-masthead" }}
        title="变化标题"
        variant="compact"
      >
        变化内容
      </ModuleFrame>,
    );
    const varied = screen.getByRole("region", { name: "变化模块" });
    expect(varied).toHaveClass("miaixz-module-frame-compact");
    expect(varied).toHaveAttribute("aria-disabled", "true");
    expect(varied.querySelector(".miaixz-module-frame-masthead")).toHaveClass("consumer-masthead");
    expect(varied.querySelector(".miaixz-module-frame-content")).toHaveClass("consumer-content");
    expect(varied.querySelector(".miaixz-module-frame-content")).toHaveAttribute(
      "data-spacing",
      "none",
    );
  });

  it("keeps Editor defaults and public variants independent of business fields", () => {
    render(
      <EditorLayout data-testid="editor" summary={<aside>摘要</aside>} variant="divided">
        <EditorSection description="说明" layout="associations" title="关联关系">
          字段由消费者提供
        </EditorSection>
      </EditorLayout>,
    );
    expect(screen.getByTestId("editor")).toHaveClass("miaixz-editor-layout-divided");
    const section = screen.getByRole("heading", { name: "关联关系" }).closest("section");
    expect(section).toHaveClass("miaixz-editor-section");
    expect(section?.querySelector(".miaixz-editor-section-body")).toHaveClass(
      "miaixz-editor-associations",
    );

    const types = readFileSync("src/components/editor/editor.types.ts", "utf8");
    for (const businessField of ["applicationId", "environmentId", "serviceId", "tenantId"]) {
      expect(types).not.toContain(businessField);
    }
  });

  it("keeps summary, association and footer content reachable in narrow editor containers", () => {
    const longAssociation = "需要在窄容器中重排但不能隐藏的完整关联信息";
    render(
      <EditorLayout
        data-testid="narrow-editor"
        summary={
          <EditorSummary
            avatar={<span>KI</span>}
            footer={<button type="button">摘要操作</button>}
            items={[{ label: "关联", value: longAssociation }]}
            subtitle="完整档案"
            title="Kimi Liu"
          />
        }
        variant="divided"
      >
        <EditorSection description="窄容器仍完整显示" layout="associations" title="关联信息">
          <span>{longAssociation}</span>
          <span>第二个关联字段</span>
        </EditorSection>
      </EditorLayout>,
    );

    expect(screen.getByText("Kimi Liu")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "摘要操作" })).toBeInTheDocument();
    expect(screen.getAllByText(longAssociation)).toHaveLength(2);
    expect(screen.getByText("第二个关联字段")).toBeInTheDocument();

    const css = readFileSync("src/styles/components/editor.css", "utf8");
    const containerStart = css.indexOf("@container miaixz-editor (width <= 48rem)");
    const containerRules = css.slice(
      containerStart,
      css.indexOf(".miaixz-editor-fieldset", containerStart),
    );
    expect(containerStart).toBeGreaterThan(-1);
    expect(containerRules).toContain("grid-column: 1 / -1");
    expect(containerRules).toContain("grid-template-columns: 1fr");
    expect(containerRules).toContain("position: static");
    expect(containerRules).not.toMatch(/display:\s*none|visibility:\s*hidden/u);
  });

  it("preserves Panel defaults and composes public surface variants", () => {
    const { rerender } = render(
      <Panel data-testid="panel" title="默认面板">
        正文
      </Panel>,
    );
    const panel = screen.getByTestId("panel");
    expect(panel).toHaveClass("miaixz-panel-default");
    expect(panel).toHaveClass("miaixz-panel-body-content");
    expect(panel).toHaveClass("miaixz-panel-header-default");
    expect(panel).not.toHaveAttribute("data-selected");

    rerender(
      <Panel
        bodyGap="none"
        bodyLayout="fill"
        bodyPadding="none"
        headerLayout="inline"
        headerSize="note"
        interactive
        selected
        surface="transparent"
        title="组合面板"
      >
        正文
      </Panel>,
    );
    expect(panel).toHaveClass("miaixz-panel-body-fill");
    expect(panel).toHaveClass("miaixz-panel-body-gap-none");
    expect(panel).toHaveClass("miaixz-panel-body-padding-none");
    expect(panel).toHaveClass("miaixz-panel-header-inline");
    expect(panel).toHaveClass("miaixz-panel-header-note");
    expect(panel).toHaveClass("miaixz-panel-interactive");
    expect(panel).toHaveClass("miaixz-panel-transparent");
    expect(panel).toHaveAttribute("data-selected", "true");
  });

  it("keeps controlled ModuleFrame navigation generic", () => {
    const onValueChange = vi.fn();
    render(
      <ModuleFrame
        aria-label="模块"
        navigation={{
          label: "模块导航",
          value: "one",
          onValueChange,
          items: [
            { id: "one", label: "一" },
            { id: "two", label: "二" },
          ],
        }}
        title="模块"
      >
        内容
      </ModuleFrame>,
    );
    screen.getByRole("tab", { name: "二" }).click();
    expect(onValueChange).toHaveBeenCalledWith("two");
  });

  if (import.meta.env.MODE === "typecheck") {
    /*
     * @ts-expect-error ModuleFrame does not expose business-specific gutters.
     */
    void (
      <ModuleFrame aria-label="x" gutter="service" title="x">
        x
      </ModuleFrame>
    );
    /*
     * @ts-expect-error Panel variants remain a bounded public set.
     */
    void (<Panel variant="workbench">x</Panel>);
  }
});

import { createMiaixzI18n } from "@miaixz/sdk/i18n";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Button, ButtonLink, MiaixzLocaleProvider, Pressable } from "../src/index.js";
import { bindPressInteractions } from "../src/shared/press-interaction.js";

afterEach(cleanup);

const actionRect = {
  x: 10,
  y: 20,
  left: 10,
  top: 20,
  right: 110,
  bottom: 60,
  width: 100,
  height: 40,
  toJSON: () => ({}),
} as DOMRect;

describe("shared press interaction", () => {
  it("starts delegated pointer feedback for an explicit ripple target", () => {
    const { container } = render(
      <div data-miaixz-theme="miaixz">
        <button type="button" data-miaixz-ripple="true" className="miaixz-interactive">
          保存
        </button>
      </div>,
    );
    const root = container.firstElementChild as HTMLElement;
    const button = screen.getByRole("button", { name: "保存" });
    vi.spyOn(button, "getBoundingClientRect").mockReturnValue(actionRect);
    const unbind = bindPressInteractions(root);

    fireEvent.pointerDown(button, { button: 0, clientX: 30, clientY: 30 });
    const layer = button.querySelector<HTMLElement>(".miaixz-interaction-ripple-layer");
    expect(button).toHaveClass("miaixz-interactive");
    expect(layer).toHaveAttribute("data-origin", "pointer");
    fireEvent.animationEnd(layer?.firstElementChild as Element);
    expect(button.querySelector(".miaixz-interaction-ripple-layer")).toBeNull();
    unbind();
  });

  it("does not turn generic semantic controls or Pressable content into ripple buttons", () => {
    const { container } = render(
      <MiaixzLocaleProvider i18n={createMiaixzI18n()}>
        <div data-miaixz-theme="miaixz">
          <button type="button">选项卡</button>
          <Pressable variant="row">选择详情</Pressable>
        </div>
      </MiaixzLocaleProvider>,
    );
    const root = container.querySelector<HTMLElement>("[data-miaixz-theme]")!;
    const tab = screen.getByRole("button", { name: "选项卡" });
    const row = screen.getByRole("button", { name: "选择详情" });
    const unbind = bindPressInteractions(root);

    fireEvent.pointerDown(tab, { button: 0, clientX: 30, clientY: 30 });
    fireEvent.pointerDown(row, { button: 0, clientX: 30, clientY: 30 });
    expect(tab.querySelector(".miaixz-interaction-ripple-layer")).toBeNull();
    expect(row.querySelector(".miaixz-interaction-ripple-layer")).toBeNull();
    expect(row).not.toHaveClass("miaixz-interactive");
    unbind();
  });

  it("covers framed buttons, real ButtonLink navigation and Pressable selection", () => {
    render(
      <MiaixzLocaleProvider i18n={createMiaixzI18n()}>
        <Button variant="primary">创建</Button>
        <Button variant="secondary">取消</Button>
        <Button variant="danger">删除</Button>
        <ButtonLink href="/create">前往创建</ButtonLink>
        <Pressable variant="row">选择详情</Pressable>
      </MiaixzLocaleProvider>,
    );
    expect(screen.getByRole("button", { name: "创建" })).toHaveClass("miaixz-button-primary");
    expect(screen.getByRole("button", { name: "创建" })).toHaveAttribute(
      "data-miaixz-ripple",
      "true",
    );
    expect(screen.getByRole("button", { name: "取消" })).toHaveClass("miaixz-button-secondary");
    expect(screen.getByRole("button", { name: "删除" })).toHaveClass("miaixz-button-danger");
    expect(screen.getByRole("link", { name: "前往创建" })).toHaveAttribute("href", "/create");
    expect(screen.getByRole("link", { name: "前往创建" })).toHaveAttribute(
      "data-miaixz-ripple",
      "true",
    );
    expect(screen.getByRole("button", { name: "选择详情" })).toHaveClass("miaixz-pressable-row");
    expect(screen.getByRole("button", { name: "选择详情" })).not.toHaveAttribute(
      "data-miaixz-ripple",
    );
  });
});

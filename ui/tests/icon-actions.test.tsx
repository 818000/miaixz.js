import { createMiaixzI18n } from "@miaixz/sdk/i18n";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Button } from "../src/components/button/index.js";
import { Alert } from "../src/components/alert/index.js";
import { Search } from "../src/components/search/index.js";
import { MiaixzLocaleProvider } from "../src/i18n/index.js";

afterEach(cleanup);

describe("shared frameless icon actions", () => {
  it("retains button semantics, accessible name, tooltip and callback without a wrapper", () => {
    const click = vi.fn();
    const { container, rerender } = render(
      <MiaixzLocaleProvider i18n={createMiaixzI18n()}>
        <Button iconOnly aria-label="展开主菜单" onClick={click}>
          <svg aria-hidden="true" />
        </Button>
      </MiaixzLocaleProvider>,
    );
    const button = screen.getByRole("button", { name: "展开主菜单" }) as HTMLButtonElement;
    expect(container.firstElementChild).toBe(button);
    expect(button.type).toBe("button");
    expect(button.title).toBe("展开主菜单");
    expect(button.className).toContain("miaixz-button-icon-only");
    expect(button.className).toContain("miaixz-link-no-underline");
    fireEvent.click(button);
    expect(click).toHaveBeenCalledOnce();
    rerender(
      <MiaixzLocaleProvider i18n={createMiaixzI18n()}>
        <Button iconOnly aria-label="收起主菜单" title="自定义提示">
          <svg aria-hidden="true" />
        </Button>
      </MiaixzLocaleProvider>,
    );
    expect(button.title).toBe("自定义提示");
    expect(button.getAttribute("aria-label")).toBe("收起主菜单");
  });

  it("keeps disabled and loading actions inert and text buttons outside this contract", () => {
    const click = vi.fn();
    render(
      <MiaixzLocaleProvider i18n={createMiaixzI18n()}>
        <Button iconOnly disabled aria-label="禁用" onClick={click}>
          ×
        </Button>
        <Button iconOnly loading aria-label="加载中" onClick={click}>
          ×
        </Button>
        <Button variant="primary" onClick={click}>
          保存
        </Button>
      </MiaixzLocaleProvider>,
    );
    for (const name of ["禁用", "加载中"]) {
      const button = screen.getByRole("button", { name }) as HTMLButtonElement;
      expect(button.disabled).toBe(true);
      fireEvent.click(button);
    }
    expect(click).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "加载中" }).getAttribute("aria-busy")).toBe("true");
    const save = screen.getByRole("button", { name: "保存" });
    expect(save.className).not.toContain("miaixz-button-icon-only");
    expect(save.hasAttribute("title")).toBe(false);
    fireEvent.click(save);
    expect(click).toHaveBeenCalledOnce();
  });

  it("automatically covers composed dismiss and search-clear controls", () => {
    const dismiss = vi.fn();
    const clear = vi.fn();
    render(
      <MiaixzLocaleProvider i18n={createMiaixzI18n()}>
        <Alert onDismiss={dismiss} dismissLabel="关闭提示">
          消息
        </Alert>
        <Search value="redis" onValueChange={clear} clearLabel="清除搜索" />
      </MiaixzLocaleProvider>,
    );
    for (const name of ["关闭提示", "清除搜索"]) {
      const button = screen.getByRole("button", { name });
      expect(button.getAttribute("title")).toBe(name);
      expect(button.className).toContain("miaixz-button-icon-only");
      fireEvent.click(button);
    }
    expect(dismiss).toHaveBeenCalledOnce();
    expect(clear).toHaveBeenCalledExactlyOnceWith("");
  });
});

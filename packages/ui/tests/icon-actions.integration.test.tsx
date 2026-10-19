/**
 * Verifies icon actions behavior in the UI package.
 */

import { createMiaixzI18n } from "@miaixz/sdk/i18n";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Alert, IconButton, MiaixzLocaleProvider, Search } from "../src/index.js";

afterEach(cleanup);

const removedHiddenClassName = ["miaixz", "visually", "hidden"].join("-");

/**
 * Inputs controlling the Icon Action Fixture test fixture.
 */
interface IconActionFixtureProps {
  /**
   * Visible and accessible action label.
   */
  readonly label: string;
  /**
   * Optional command callback.
   */
  readonly onAction?: () => void;
  /**
   * Whether interaction is unavailable.
   */
  readonly disabled?: boolean;
  /**
   * Whether progress is active.
   */
  readonly loading?: boolean;
}

/**
 * Renders one icon command using the frozen action contract.
 *
 * @param properties - Partial command overrides.
 * @param properties.label - Visible and accessible label.
 * @param properties.onAction - Optional command callback.
 * @param properties.disabled - Whether interaction is unavailable.
 * @param properties.loading - Whether progress is active.
 * @returns The rendered icon action.
 */
function iconAction(properties: IconActionFixtureProps) {
  return (
    <IconButton
      label={properties.label}
      icon="close"
      {...(properties.disabled === undefined ? {} : { disabled: properties.disabled })}
      {...(properties.loading === undefined ? {} : { loading: properties.loading })}
      onClick={properties.onAction ?? (() => undefined)}
    />
  );
}

describe("shared icon actions", () => {
  it("keeps icon commands accessible, visually quiet and tooltip-enabled", () => {
    const click = vi.fn();
    render(
      <MiaixzLocaleProvider i18n={createMiaixzI18n()}>
        {iconAction({ label: "展开主菜单", onAction: click })}
      </MiaixzLocaleProvider>,
    );

    const button = screen.getByRole("button", { name: "展开主菜单" });
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveClass("miaixz-icon-button");
    expect(button).toHaveClass("miaixz-interactive");
    expect(button).toHaveAttribute("data-miaixz-ripple", "true");
    expect(button).toHaveAttribute("aria-describedby");
    fireEvent.click(button);
    expect(click).toHaveBeenCalledOnce();
  });

  it("keeps disabled and loading commands inert", () => {
    const click = vi.fn();
    render(
      <MiaixzLocaleProvider i18n={createMiaixzI18n()}>
        {iconAction({ label: "禁用", disabled: true, onAction: click })}
        {iconAction({ label: "加载中", loading: true, onAction: click })}
      </MiaixzLocaleProvider>,
    );
    for (const name of ["禁用", "加载中"]) {
      const button = screen.getByRole("button", { name });
      expect(button).toBeDisabled();
      fireEvent.click(button);
    }
    expect(click).not.toHaveBeenCalled();
    const loadingButton = screen.getByRole("button", { name: "加载中" });
    expect(loadingButton).toHaveAttribute("aria-busy", "true");
    expect(loadingButton.querySelector(".miaixz-hidden")).not.toBeNull();
    expect(loadingButton.querySelector(`.${removedHiddenClassName}`)).toBeNull();
  });

  it("covers composed dismiss and search-clear controls", () => {
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
    const dismissButton = screen.getByRole("button", { name: "关闭提示" });
    expect(dismissButton).toHaveClass("miaixz-icon-button");
    fireEvent.click(dismissButton);
    const clearButton = screen.getByRole("button", { name: "清除搜索" });
    expect(clearButton).toHaveClass("miaixz-field-action");
    expect(clearButton).not.toHaveClass("miaixz-icon-button");
    expect(clearButton).toHaveAttribute("aria-describedby");
    fireEvent.click(clearButton);
    expect(dismiss).toHaveBeenCalledOnce();
    expect(clear).toHaveBeenCalledExactlyOnceWith("", "clear");
  });

  it("clears an uncontrolled search and restores input focus without submitting its form", () => {
    const change = vi.fn();
    const clear = vi.fn();
    const submit = vi.fn((event) => event.preventDefault());
    render(
      <MiaixzLocaleProvider i18n={createMiaixzI18n()}>
        <form onSubmit={submit}>
          <Search
            defaultValue="redis"
            aria-label="搜索服务"
            clearLabel="清除搜索"
            onValueChange={change}
            onClear={clear}
            slotProps={{
              clear: (state) => ({
                title: "清空当前查询",
                className: state.filled ? "filled-clear" : "",
              }),
            }}
          />
        </form>
      </MiaixzLocaleProvider>,
    );
    const input = screen.getByRole("searchbox", { name: "搜索服务" });
    const button = screen.getByRole("button", { name: "清除搜索" });
    expect(button).toHaveAttribute("title", "清空当前查询");
    expect(button).toHaveClass("filled-clear");
    expect(button).toHaveAttribute("type", "button");
    fireEvent.click(button);
    expect(change).toHaveBeenCalledExactlyOnceWith("", "clear");
    expect(clear).toHaveBeenCalledOnce();
    expect(input).toHaveValue("");
    expect(input).toHaveFocus();
    expect(submit).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "清除搜索" })).not.toBeInTheDocument();
  });

  it("preserves the clear slot's ability to cancel the action", () => {
    const change = vi.fn();
    const clear = vi.fn();
    render(
      <MiaixzLocaleProvider i18n={createMiaixzI18n()}>
        <Search
          defaultValue="redis"
          clearLabel="清除搜索"
          onValueChange={change}
          onClear={clear}
          slotProps={{ clear: { onClick: (event) => event.preventDefault() } }}
        />
      </MiaixzLocaleProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "清除搜索" }));
    expect(screen.getByRole("searchbox")).toHaveValue("redis");
    expect(change).not.toHaveBeenCalled();
    expect(clear).not.toHaveBeenCalled();
  });
});

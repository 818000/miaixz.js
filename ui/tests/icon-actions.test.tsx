import { createMiaixzI18n } from "@miaixz/sdk/i18n";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Alert, IconButton, MiaixzLocaleProvider, Search } from "../src/index.js";

afterEach(cleanup);

const removedHiddenClassName = ["miaixz", "visually", "hidden"].join("-");

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
      icon="X"
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
    for (const name of ["关闭提示", "清除搜索"]) {
      const button = screen.getByRole("button", { name });
      expect(button).toHaveClass("miaixz-icon-button");
      fireEvent.click(button);
    }
    expect(dismiss).toHaveBeenCalledOnce();
    expect(clear).toHaveBeenCalledExactlyOnceWith("", "clear");
  });
});

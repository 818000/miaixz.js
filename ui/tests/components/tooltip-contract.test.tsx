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
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Tooltip } from "../../src/components/tooltip/tooltip.js";

beforeEach(() => vi.useFakeTimers());

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("Tooltip closed interaction contract", () => {
  it("coordinates pointer and focus ownership across enter and leave delays", () => {
    const onOpenChange = vi.fn();
    render(
      <Tooltip
        content="Helpful text"
        enterDelay={20}
        leaveDelay={30}
        onOpenChange={onOpenChange}
        placement="right"
        slotProps={{
          trigger: { className: "tooltip-trigger-slot" },
          content: ({ open }) => ({
            className: open ? "tooltip-open-slot" : "tooltip-closed-slot",
          }),
        }}
      >
        <button aria-describedby="existing-description" type="button">
          Help
        </button>
      </Tooltip>,
    );
    const trigger = screen.getByRole("button", { name: "Help" });
    expect(trigger).toHaveClass("tooltip-trigger-slot");
    expect(trigger.getAttribute("aria-describedby")).toContain("existing-description");
    fireEvent.pointerEnter(trigger, { pointerType: "mouse" });
    act(() => vi.advanceTimersByTime(19));
    expect(screen.queryByRole("tooltip")).toBeNull();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByRole("tooltip")).toHaveTextContent("Helpful text");
    expect(screen.getByRole("tooltip")).toHaveClass("tooltip-open-slot");
    expect(onOpenChange).toHaveBeenLastCalledWith(true);

    fireEvent.focus(trigger);
    fireEvent.pointerLeave(trigger, { pointerType: "mouse" });
    act(() => vi.advanceTimersByTime(30));
    expect(screen.getByRole("tooltip")).toBeVisible();
    fireEvent.blur(trigger);
    act(() => vi.advanceTimersByTime(30));
    expect(screen.queryByRole("tooltip")).toBeNull();
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it("supports touch long-press, release, cancellation, and disabled touch mode", () => {
    const first = render(
      <Tooltip content="Touch help" enterTouchDelay={40} leaveTouchDelay={50}>
        <button type="button">Touch target</button>
      </Tooltip>,
    );
    const target = screen.getByRole("button", { name: "Touch target" });
    fireEvent.pointerDown(target, { pointerType: "mouse" });
    act(() => vi.advanceTimersByTime(50));
    expect(screen.queryByRole("tooltip")).toBeNull();
    fireEvent.pointerDown(target, { pointerType: "touch" });
    act(() => vi.advanceTimersByTime(40));
    expect(screen.getByRole("tooltip")).toHaveTextContent("Touch help");
    fireEvent.pointerUp(target, { pointerType: "touch" });
    act(() => vi.advanceTimersByTime(49));
    expect(screen.getByRole("tooltip")).toBeVisible();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByRole("tooltip")).toBeNull();
    fireEvent.pointerDown(target, { pointerType: "touch" });
    act(() => vi.advanceTimersByTime(40));
    fireEvent.pointerCancel(target, { pointerType: "touch" });
    act(() => vi.advanceTimersByTime(50));
    expect(screen.queryByRole("tooltip")).toBeNull();
    first.unmount();

    render(
      <Tooltip content="Disabled touch" disableTouch>
        <button type="button">No touch</button>
      </Tooltip>,
    );
    const disabledTouch = screen.getByRole("button", { name: "No touch" });
    fireEvent.pointerDown(disabledTouch, { pointerType: "touch" });
    fireEvent.pointerUp(disabledTouch, { pointerType: "touch" });
    fireEvent.pointerCancel(disabledTouch, { pointerType: "touch" });
    act(() => vi.runAllTimers());
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("anchors a disabled button through its wrapper and handles escape", () => {
    const onOpenChange = vi.fn();
    const { container } = render(
      <Tooltip content="Unavailable" defaultOpen onOpenChange={onOpenChange} placement="bottom">
        <button disabled style={{ color: "gray" }} type="button">
          Disabled action
        </button>
      </Tooltip>,
    );
    const wrapper = container.querySelector<HTMLElement>(
      '[data-miaixz-tooltip-disabled-trigger="true"]',
    )!;
    const button = screen.getByRole("button", { name: "Disabled action" });
    expect(button.style.pointerEvents).toBe("none");
    expect(button.style.color).toBe("gray");
    expect(screen.getByRole("tooltip")).toHaveTextContent("Unavailable");
    fireEvent.pointerLeave(wrapper);
    act(() => vi.runAllTimers());
    expect(screen.queryByRole("tooltip")).toBeNull();
    fireEvent.pointerEnter(wrapper);
    act(() => vi.advanceTimersByTime(300));
    expect(screen.getByRole("tooltip")).toBeVisible();
    fireEvent.keyDown(button, { key: "Escape" });
    expect(screen.queryByRole("tooltip")).toBeNull();
  });

  it("reports controlled dismissal without mutating the controlled value", () => {
    const onOpenChange = vi.fn();
    render(
      <Tooltip content="Controlled" onOpenChange={onOpenChange} open>
        <button type="button">Controlled trigger</button>
      </Tooltip>,
    );
    const trigger = screen.getByRole("button", { name: "Controlled trigger" });
    fireEvent.keyDown(trigger, { key: "Escape" });
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.getByRole("tooltip")).toBeVisible();
  });

  it("rejects every non-finite or negative public delay", () => {
    for (const props of [
      { enterDelay: -1 },
      { leaveDelay: Number.NaN },
      { enterTouchDelay: Number.POSITIVE_INFINITY },
      { leaveTouchDelay: -2 },
    ]) {
      expect(() =>
        render(
          <Tooltip content="Invalid" {...props}>
            <button type="button">Invalid</button>
          </Tooltip>,
        ),
      ).toThrowError(expect.objectContaining({ code: "UI_TOOLTIP_DELAY_INVALID" }));
    }
  });
});

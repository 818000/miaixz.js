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

/**
 * Verifies Appearance positioning through real pointer, keyboard, and viewport events.
 */

import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, renderHook, screen } from "@testing-library/react";
import type { KeyboardEvent, PointerEvent } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  clampPosition,
  numericCssValue,
  useAppearancePosition,
} from "../../src/appearance/use-appearance-position.js";

interface HarnessProps {
  readonly draggable?: boolean;
  readonly position?: number;
  readonly onActivate?: () => void;
  readonly onPositionChange?: (position: number) => void;
}

/**
 * Exposes the positioning hook through a real root and trigger.
 *
 * @param props - Harness positioning properties.
 * @returns Hook state projected onto test elements.
 */
function Harness(props: HarnessProps) {
  const { draggable = true, position, onActivate = () => undefined, onPositionChange } = props;
  const { canMove, dragging, positionStyle, rootRef, triggerHandlers } = useAppearancePosition({
    draggable,
    positionBlockPx: position,
    onPositionBlockPxChange: onPositionChange,
    onActivate,
  });
  return (
    <div
      data-can-move={String(canMove)}
      data-dragging={String(dragging)}
      data-testid="root"
      ref={rootRef}
      style={positionStyle}
    >
      <button data-testid="trigger" type="button" {...triggerHandlers}>
        Appearance
      </button>
    </div>
  );
}

let animationFrames: Map<number, FrameRequestCallback>;
let nextAnimationFrame: number;

beforeEach(() => {
  animationFrames = new Map();
  nextAnimationFrame = 1;
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
    const identifier = nextAnimationFrame++;
    animationFrames.set(identifier, callback);
    return identifier;
  });
  vi.spyOn(window, "cancelAnimationFrame").mockImplementation((identifier) => {
    animationFrames.delete(identifier);
  });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("Appearance position", () => {
  it("parses CSS numbers and clamps to both safe-area edges", () => {
    const root = document.createElement("div");
    root.style.setProperty("--valid", "8.5px");
    root.style.setProperty("--invalid", "not-a-number");
    root.style.setProperty("--miaixz-safe-area-block-start", "10px");
    root.style.setProperty("--miaixz-safe-area-block-end", "20px");
    Object.defineProperty(root, "offsetHeight", { configurable: true, value: 50 });
    expect(numericCssValue(root, "--valid", 3)).toBe(8.5);
    expect(numericCssValue(root, "--invalid", 3)).toBe(3);
    expect(clampPosition(root, -10)).toBe(10);
    expect(clampPosition(root, 200)).toBe(200);
    expect(clampPosition(root, window.innerHeight + 100)).toBe(window.innerHeight - 70);

    const detachedDocument = document.implementation.createHTMLDocument("detached");
    const detachedRoot = detachedDocument.createElement("div");
    expect(clampPosition(detachedRoot, 42)).toBe(42);
  });

  it("activates without movement when dragging is disabled or read-only", () => {
    const onActivate = vi.fn();
    const { rerender } = render(<Harness draggable={false} onActivate={onActivate} />);
    expect(screen.getByTestId("root")).toHaveAttribute("data-can-move", "false");
    fireEvent.click(screen.getByRole("button"));
    expect(onActivate).toHaveBeenCalledTimes(1);

    rerender(<Harness position={80} onActivate={onActivate} />);
    expect(screen.getByTestId("root")).toHaveStyle({
      insetBlockEnd: "auto",
      insetBlockStart: "calc(80px + var(--miaixz-appearance-trigger-size) / 2)",
    });
    expect(screen.getByTestId("root")).toHaveAttribute("data-can-move", "false");
    fireEvent.keyDown(screen.getByRole("button"), { key: "ArrowDown" });
    fireEvent.click(screen.getByRole("button"));
    expect(onActivate).toHaveBeenCalledTimes(2);
  });

  it("moves a controlled trigger by keyboard and ignores unrelated keys", () => {
    const onPositionChange = vi.fn();
    render(<Harness position={100} onPositionChange={onPositionChange} />);
    const root = screen.getByTestId("root");
    root.style.setProperty("--miaixz-density-component-gap", "20px");
    const trigger = screen.getByRole("button");
    fireEvent.keyDown(trigger, { key: "Enter" });
    expect(onPositionChange).not.toHaveBeenCalled();
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    fireEvent.keyDown(trigger, { key: "ArrowUp" });
    fireEvent(window, new Event("resize"));
    expect(onPositionChange).toHaveBeenNthCalledWith(1, 120);
    expect(onPositionChange).toHaveBeenNthCalledWith(2, 80);
  });

  it("drags, schedules the latest frame, suppresses the drag click, and cancels", () => {
    vi.useFakeTimers();
    const onActivate = vi.fn();
    const onPositionChange = vi.fn();
    render(<Harness position={100} onActivate={onActivate} onPositionChange={onPositionChange} />);
    const root = screen.getByTestId("root");
    const trigger = screen.getByRole("button") as HTMLButtonElement;
    trigger.setPointerCapture = vi.fn();

    fireEvent.pointerDown(trigger, { button: 1, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(trigger, { clientY: 120, pointerId: 1 });
    expect(root).toHaveAttribute("data-dragging", "false");

    fireEvent.pointerDown(trigger, { button: 0, clientY: 100, pointerId: 1 });
    expect(trigger.setPointerCapture).toHaveBeenCalledWith(1);
    fireEvent.pointerMove(trigger, { clientY: 120, pointerId: 2 });
    fireEvent.pointerMove(trigger, { clientY: 103, pointerId: 1 });
    expect(root).toHaveAttribute("data-dragging", "false");
    fireEvent.pointerMove(trigger, { clientY: 110, pointerId: 1 });
    fireEvent.pointerMove(trigger, { clientY: 115, pointerId: 1 });
    expect(window.cancelAnimationFrame).toHaveBeenCalledWith(1);
    expect(root).toHaveAttribute("data-dragging", "true");
    const latestFrame = animationFrames.get(2);
    expect(latestFrame).toBeDefined();
    act(() => latestFrame?.(0));
    expect(root.style.transform).toBe("translate(0, calc(-50% + 15px))");

    fireEvent.pointerUp(trigger, { pointerId: 2 });
    expect(onPositionChange).not.toHaveBeenCalled();
    fireEvent.pointerUp(trigger, { pointerId: 1 });
    expect(onPositionChange).toHaveBeenCalledWith(115);
    expect(root.style.transform).toBe("");
    expect(root).toHaveAttribute("data-dragging", "false");
    fireEvent.click(trigger);
    expect(onActivate).not.toHaveBeenCalled();
    act(() => vi.runOnlyPendingTimers());
    fireEvent.click(trigger);
    expect(onActivate).toHaveBeenCalledTimes(1);

    fireEvent.pointerDown(trigger, { button: 0, clientY: 100, pointerId: 3 });
    fireEvent.pointerCancel(trigger, { pointerId: 4 });
    fireEvent.pointerCancel(trigger, { pointerId: 3 });
    expect(onPositionChange).toHaveBeenCalledTimes(1);

    fireEvent.pointerDown(trigger, { button: 0, clientY: 100, pointerId: 5 });
    fireEvent.pointerUp(trigger, { pointerId: 5 });
    fireEvent.pointerDown(trigger, { button: 0, clientY: 100, pointerId: 6 });
    fireEvent.pointerMove(trigger, { clientY: 110, pointerId: 6 });
    fireEvent.pointerUp(trigger, { pointerId: 6 });
    expect(window.cancelAnimationFrame).toHaveBeenCalledWith(3);
  });

  it("clamps an uncontrolled position after viewport resize and cleans pending work", () => {
    const { unmount } = render(<Harness />);
    const root = screen.getByTestId("root");
    const trigger = screen.getByRole("button");
    Object.defineProperty(root, "offsetHeight", { configurable: true, value: 40 });
    vi.spyOn(root, "getBoundingClientRect").mockReturnValue({
      bottom: 140,
      height: 40,
      left: 0,
      right: 40,
      top: 100,
      width: 40,
      x: 0,
      y: 100,
      toJSON: () => undefined,
    });
    fireEvent(window, new Event("resize"));
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    expect(root.style.insetBlockStart).toContain("112px");
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 100 });
    fireEvent(window, new Event("resize"));
    expect(root.style.insetBlockStart).toContain("60px");

    fireEvent.pointerDown(trigger, { button: 0, clientY: 60, pointerId: 7 });
    fireEvent.pointerMove(trigger, { clientY: 80, pointerId: 7 });
    expect(animationFrames.size).toBe(1);
    const pendingFrame = [...animationFrames.values()][0];
    unmount();
    expect(animationFrames.size).toBe(0);
    act(() => pendingFrame?.(0));
  });

  it("safely ignores movement handlers before a root is attached", () => {
    const onActivate = vi.fn();
    const onPositionChange = vi.fn();
    const hook = renderHook(() =>
      useAppearancePosition({
        draggable: true,
        positionBlockPx: undefined,
        onPositionBlockPxChange: onPositionChange,
        onActivate,
      }),
    );
    const handlers = hook.result.current.triggerHandlers;
    if (!("onKeyDown" in handlers)) throw new Error("Missing handlers");
    handlers.onKeyDown({
      key: "ArrowDown",
      preventDefault: vi.fn(),
    } as unknown as KeyboardEvent<HTMLButtonElement>);
    handlers.onPointerDown({
      button: 0,
      clientY: 40,
      currentTarget: {},
      pointerId: 9,
    } as unknown as PointerEvent<HTMLButtonElement>);
    handlers.onPointerUp({
      pointerId: 9,
      preventDefault: vi.fn(),
    } as unknown as PointerEvent<HTMLButtonElement>);
    expect(onPositionChange).not.toHaveBeenCalled();
  });
});

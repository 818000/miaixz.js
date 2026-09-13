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

/* eslint-disable jsdoc/require-jsdoc, react-hooks/refs --
 * Test fixtures deliberately expose hook results through rendered controls.
 */

import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  clampPosition,
  numericCssValue,
  useAppearancePosition,
} from "../../src/patterns/appearance/use-appearance-position.js";
import {
  useVisualizationGroupMotion,
  useVisualizationMotion,
} from "../../src/shared/use-visualization-motion.js";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({
    x: 0,
    y: 10,
    top: 10,
    bottom: 110,
    left: 0,
    right: 100,
    width: 100,
    height: 100,
    toJSON: () => ({}),
  });
});

function installMatchMedia(reduced: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches: reduced,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

function Visualization({ onEnter = () => undefined }: { readonly onEnter?: () => void }) {
  const motion = useVisualizationMotion<HTMLDivElement>({
    forwardedRef: null,
    replayDuration: 50,
    onPointerEnter: onEnter,
  });
  return (
    <div
      ref={motion.ref}
      data-testid="visualization"
      data-motion-state={motion.motionState}
      onPointerEnter={motion.handlePointerEnter}
      onPointerLeave={motion.handlePointerLeave}
    >
      chart
      <button type="button" onClick={motion.replay}>
        replay
      </button>
    </div>
  );
}

function VisualizationGroup() {
  const ref = useVisualizationGroupMotion<HTMLDivElement>({
    selector: ".chart",
    replayDuration: 50,
  });
  return (
    <div ref={ref} data-testid="group">
      <div className="chart">one</div>
      <div className="chart">two</div>
    </div>
  );
}

describe("visualization motion", () => {
  it("runs entry, replay, stop, and timer completion for one visualization", () => {
    installMatchMedia(false);
    const onEnter = vi.fn();
    render(<Visualization onEnter={onEnter} />);
    const chart = screen.getByTestId("visualization");
    act(() => vi.advanceTimersByTime(20));
    expect(chart).toHaveAttribute("data-motion-state", "enter");
    act(() => vi.advanceTimersByTime(50));
    expect(chart).toHaveAttribute("data-motion-state", "complete");
    fireEvent.pointerEnter(chart);
    expect(onEnter).toHaveBeenCalledTimes(1);
    expect(chart).toHaveAttribute("data-motion-replay", "true");
    fireEvent.pointerLeave(chart);
    expect(chart).not.toHaveAttribute("data-motion-replay");
    fireEvent.click(screen.getByRole("button", { name: "replay" }));
    act(() => vi.advanceTimersByTime(50));
    expect(chart).not.toHaveAttribute("data-motion-replay");
  });

  it("completes immediately and suppresses replay under reduced motion", () => {
    installMatchMedia(true);
    render(<Visualization />);
    const chart = screen.getByTestId("visualization");
    act(() => vi.advanceTimersByTime(0));
    expect(chart).toHaveAttribute("data-motion-state", "complete");
    fireEvent.pointerEnter(chart);
    expect(chart).not.toHaveAttribute("data-motion-replay");
  });

  it("delegates entry and replay lifecycle to every matching group child", () => {
    installMatchMedia(false);
    render(<VisualizationGroup />);
    const charts = screen.getByTestId("group").querySelectorAll<HTMLElement>(".chart");
    act(() => vi.advanceTimersByTime(20));
    expect(charts[0]).toHaveAttribute("data-motion-state", "enter");
    expect(charts[1]).toHaveAttribute("data-motion-state", "enter");
    fireEvent.pointerEnter(charts[0]!);
    expect(charts[0]).toHaveAttribute("data-motion-replay", "true");
    fireEvent.pointerLeave(charts[0]!);
    expect(charts[0]).not.toHaveAttribute("data-motion-replay");
    act(() => vi.advanceTimersByTime(50));
    expect(charts[1]).toHaveAttribute("data-motion-state", "complete");
  });

  it("uses IntersectionObserver once and unobserves intersecting roots", () => {
    installMatchMedia(false);
    const disconnect = vi.fn();
    const unobserve = vi.fn();
    let callback: IntersectionObserverCallback | undefined;
    vi.stubGlobal(
      "IntersectionObserver",
      vi.fn(function (next: IntersectionObserverCallback) {
        callback = next;
        return { observe: vi.fn(), unobserve, disconnect };
      }),
    );
    render(<VisualizationGroup />);
    const first = screen.getByTestId("group").querySelector<HTMLElement>(".chart")!;
    act(() =>
      callback?.(
        [{ isIntersecting: true, target: first } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      ),
    );
    expect(first).toHaveAttribute("data-motion-state", "enter");
    expect(unobserve).toHaveBeenCalledWith(first);
  });
});

function PositionFixture({
  controlled,
  onActivate,
  onChange,
}: {
  readonly controlled?: number;
  readonly onActivate: () => void;
  readonly onChange?: (value: number) => void;
}) {
  const position = useAppearancePosition({
    draggable: true,
    positionBlockPx: controlled,
    onPositionBlockPxChange: onChange,
    onActivate,
  });
  return (
    <div
      ref={position.rootRef}
      data-testid="position"
      data-dragging={position.dragging}
      style={position.positionStyle}
    >
      <button type="button" {...position.triggerHandlers}>
        move
      </button>
    </div>
  );
}

describe("Appearance position controller", () => {
  it("supports activation, keyboard movement, drag commit, and click suppression", () => {
    const onActivate = vi.fn();
    const onChange = vi.fn();
    render(<PositionFixture controlled={40} onActivate={onActivate} onChange={onChange} />);
    const root = screen.getByTestId("position");
    Object.defineProperty(root, "offsetHeight", { configurable: true, value: 20 });
    root.style.setProperty("--miaixz-density-component-gap", "8");
    const trigger = screen.getByRole("button", { name: "move" });
    fireEvent.click(trigger);
    expect(onActivate).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(trigger, { key: "ArrowDown" });
    expect(onChange).toHaveBeenCalledWith(48);

    fireEvent.pointerDown(trigger, { button: 0, pointerId: 7, clientY: 40 });
    fireEvent.pointerMove(trigger, { pointerId: 7, clientY: 60 });
    act(() => vi.advanceTimersByTime(20));
    expect(root).toHaveAttribute("data-dragging", "true");
    fireEvent.pointerUp(trigger, { pointerId: 7, clientY: 60 });
    expect(onChange).toHaveBeenCalledWith(60);
    fireEvent.click(trigger);
    expect(onActivate).toHaveBeenCalledTimes(1);
    act(() => vi.advanceTimersByTime(0));
  });

  it("clamps using safe-area tokens and preserves a value without a window", () => {
    const root = document.createElement("div");
    Object.defineProperty(root, "offsetHeight", { configurable: true, value: 20 });
    root.style.setProperty("--miaixz-safe-area-block-start", "10px");
    root.style.setProperty("--miaixz-safe-area-block-end", "15px");
    expect(numericCssValue(root, "--missing", 12)).toBe(12);
    expect(numericCssValue(root, "--miaixz-safe-area-block-start", 0)).toBe(10);
    expect(clampPosition(root, -10)).toBe(10);
    expect(clampPosition(root, 10_000)).toBe(window.innerHeight - 35);
  });
});

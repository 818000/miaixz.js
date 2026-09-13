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

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";

/**
 * Minimum pointer movement that starts a drag.
 */
export const dragThreshold = 4;

/**
 * Mutable state for one active Appearance drag.
 */
export interface DragState {
  /**
   * Pointer that owns the drag.
   */
  readonly pointerId: number;
  /**
   * Initial pointer block coordinate.
   */
  readonly startPointerY: number;
  /**
   * Initial trigger block-start edge.
   */
  readonly startTop: number;
  /**
   * Whether movement crossed the drag threshold.
   */
  moved: boolean;
  /**
   * Latest requested block-start edge.
   */
  currentTop: number;
}

interface AppearancePositionOptions {
  /**
   * Enables trigger movement.
   */
  readonly draggable: boolean;
  /**
   * Supplies the controlled block position.
   */
  readonly positionBlockPx: number | undefined;
  /**
   * Reports committed position changes.
   */
  readonly onPositionBlockPxChange: ((position: number) => void) | undefined;
  /**
   * Activates the drawer after an unsuppressed click.
   */
  readonly onActivate: () => void;
}

/**
 * Owns Appearance pointer, keyboard, and viewport position state.
 *
 * @param options - Position control and activation callbacks.
 * @returns Root state and trigger handlers used by Appearance.
 */
export function useAppearancePosition(options: AppearancePositionOptions) {
  const { draggable, positionBlockPx, onPositionBlockPxChange, onActivate } = options;
  const [dragging, setDragging] = useState(false);
  const [uncontrolledPosition, setUncontrolledPosition] = useState<number>();
  const rootRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | undefined>(undefined);
  const suppressClickRef = useRef(false);
  const suppressClickTimerRef = useRef<number | undefined>(undefined);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const position = positionBlockPx ?? uncontrolledPosition;
  const canMove =
    draggable && (positionBlockPx === undefined || onPositionBlockPxChange !== undefined);

  useEffect(() => {
    if (!canMove) return undefined;
    const root = rootRef.current;
    if (root === null) return undefined;
    const handleResize = () => {
      if (positionBlockPx === undefined) {
        setUncontrolledPosition((value) =>
          value === undefined ? undefined : clampPosition(root, value),
        );
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [canMove, positionBlockPx]);

  useEffect(
    () => () => {
      if (suppressClickTimerRef.current !== undefined) {
        window.clearTimeout(suppressClickTimerRef.current);
      }
      if (animationFrameRef.current !== undefined) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    },
    [],
  );

  const moveTo = (proposedTop: number, notify = false) => {
    const root = rootRef.current;
    if (root === null) return;
    const next = clampPosition(root, proposedTop);
    setUncontrolledPosition(next);
    if (notify) onPositionBlockPxChange?.(next);
  };
  const releaseDrag = (drag: DragState) => {
    if (animationFrameRef.current !== undefined) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = undefined;
    }
    dragRef.current = undefined;
    setDragging(false);
    if (rootRef.current !== null) rootRef.current.style.transform = "";
    if (!drag.moved) return;
    suppressClickRef.current = true;
    moveTo(drag.currentTop, true);
    suppressClickTimerRef.current = window.setTimeout(() => {
      suppressClickRef.current = false;
      suppressClickTimerRef.current = undefined;
    }, 0);
  };
  const onClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (suppressClickRef.current) {
      event.preventDefault();
      suppressClickRef.current = false;
      return;
    }
    onActivate();
  };
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    event.preventDefault();
    const root = rootRef.current;
    if (root === null) return;
    const step = numericCssValue(root, "--miaixz-density-component-gap", 12);
    moveTo(
      (position ?? root.getBoundingClientRect().top) + (event.key === "ArrowUp" ? -step : step),
      true,
    );
  };
  const onPointerCancel = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (drag?.pointerId === event.pointerId) releaseDrag(drag);
  };
  const onPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    const currentTop = position ?? rootRef.current?.getBoundingClientRect().top ?? 0;
    dragRef.current = {
      pointerId: event.pointerId,
      startPointerY: event.clientY,
      startTop: currentTop,
      moved: false,
      currentTop,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const onPointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (drag?.pointerId !== event.pointerId) return;
    const offset = event.clientY - drag.startPointerY;
    if (!drag.moved && Math.abs(offset) < dragThreshold) return;
    drag.moved = true;
    drag.currentTop = drag.startTop + offset;
    setDragging(true);
    event.preventDefault();
    if (animationFrameRef.current !== undefined) {
      window.cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = window.requestAnimationFrame(() => {
      animationFrameRef.current = undefined;
      if (rootRef.current !== null) {
        rootRef.current.style.transform = `translate(0, calc(-50% + ${offset}px))`;
      }
    });
  };
  const onPointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (drag?.pointerId !== event.pointerId) return;
    if (drag.moved) event.preventDefault();
    releaseDrag(drag);
  };

  const positionStyle =
    position === undefined
      ? undefined
      : ({
          insetBlockEnd: "auto",
          insetBlockStart: `calc(${position}px + var(--miaixz-appearance-trigger-size) / 2)`,
        } satisfies CSSProperties);

  return {
    canMove,
    dragging,
    positionStyle,
    rootRef,
    triggerHandlers: canMove
      ? { onClick, onKeyDown, onPointerCancel, onPointerDown, onPointerMove, onPointerUp }
      : { onClick },
  };
}

/**
 * Reads one numeric CSS custom property.
 *
 * @param element - Element that owns the computed token value.
 * @param property - CSS custom property name.
 * @param fallback - Value used when the token cannot be parsed.
 * @returns Parsed numeric value.
 */
export function numericCssValue(element: Element, property: string, fallback: number): number {
  const value = Number.parseFloat(getComputedStyle(element).getPropertyValue(property));
  return Number.isFinite(value) ? value : fallback;
}

/**
 * Keeps the trigger within the visible block axis.
 *
 * @param root - Floating trigger wrapper.
 * @param proposedTop - Proposed block-start edge.
 * @returns Clamped block-start edge.
 */
export function clampPosition(root: HTMLDivElement, proposedTop: number): number {
  const viewport = root.ownerDocument.defaultView;
  if (viewport === null) return proposedTop;
  const safeStart = numericCssValue(root, "--miaixz-safe-area-block-start", 0);
  const safeEnd = numericCssValue(root, "--miaixz-safe-area-block-end", 0);
  const maximum = Math.max(safeStart, viewport.innerHeight - root.offsetHeight - safeEnd);
  return Math.min(maximum, Math.max(safeStart, proposedTop));
}

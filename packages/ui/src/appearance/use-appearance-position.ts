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
 * Implements the use appearance position React hook.
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

/**
 * Controlled launcher position, drag enablement, and callbacks for movement and activation.
 */
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
 * Owns the Appearance pointer, keyboard, and viewport position state.
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
    /**
     * Reclamps an existing uncontrolled trigger position after viewport resizing.
     *
     * @returns No return value.
     */
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

  /**
   * Clamps and stores the appearance trigger position, optionally reporting the change.
   *
   * @param proposedTop - Requested viewport-top position in CSS pixels.
   * @param notify - Whether to notify the controlled-position callback.
   * @returns No return value; leaves state unchanged when the root is absent.
   */
  const moveTo = (proposedTop: number, notify = false) => {
    const root = rootRef.current;
    if (root === null) return;
    const next = clampPosition(root, proposedTop);
    setUncontrolledPosition(next);
    if (notify) onPositionBlockPxChange?.(next);
  };
  /**
   * Ends pointer dragging, commits moved positions, and suppresses the resulting click.
   *
   * @param drag - Pointer drag state being released.
   * @returns No return value; clears pending animation and temporary transforms.
   */
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
  /**
   * Activates the appearance panel unless the click follows a drag.
   *
   * @param event - Trigger button click event.
   * @returns No return value; a suppressed click is prevented.
   */
  const onClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (suppressClickRef.current) {
      event.preventDefault();
      suppressClickRef.current = false;
      return;
    }
    onActivate();
  };
  /**
   * Moves the appearance trigger up or down by its configured spacing step.
   *
   * @param event - Trigger keyboard event.
   * @returns No return value; handled arrow keys prevent native scrolling.
   */
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
  /**
   * Releases a cancelled drag only when the pointer identifier matches.
   *
   * @param event - Cancelled trigger pointer event.
   * @returns No return value; unrelated pointer events are ignored.
   */
  const onPointerCancel = (event: PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    if (drag?.pointerId === event.pointerId) releaseDrag(drag);
  };
  /**
   * Starts a primary-button drag and captures its pointer on the trigger.
   *
   * @param event - Trigger pointer-down event.
   * @returns No return value; non-primary button presses are ignored.
   */
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
  /**
   * Updates a captured drag after the movement threshold is crossed.
   *
   * @param event - Trigger pointer-move event.
   * @returns No return value; visual movement is scheduled for the next animation frame.
   */
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
  /**
   * Commits the matching drag and prevents activation after actual movement.
   *
   * @param event - Trigger pointer-up event.
   * @returns No return value; releases drag state and its temporary presentation.
   */
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

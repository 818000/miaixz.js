import { useEffect, useLayoutEffect, type RefObject } from "react";

/**
 * Defines every fixed placement used by package-owned Popover and Tooltip surfaces.
 */
export type MiaixzFloatingPlacement =
  "bottom-start" | "bottom-end" | "top-start" | "top-end" | "top" | "right" | "bottom" | "left";

/**
 * Describes one resolved viewport-relative floating position.
 */
interface MiaixzFloatingPosition {
  /**
   * Identifies the resolved placement after main-axis flipping.
   */
  readonly placement: MiaixzFloatingPlacement;

  /**
   * Supplies the clamped viewport x coordinate.
   */
  readonly x: number;

  /**
   * Supplies the clamped viewport y coordinate.
   */
  readonly y: number;
}

/**
 * Keeps floating surfaces and viewport edges separated by the frozen eight-pixel gap.
 */
const miaixzFloatingGap = 8;

/**
 * Uses layout timing in browsers and passive timing during server rendering.
 */
const useMiaixzClientLayoutEffect = typeof document === "undefined" ? useEffect : useLayoutEffect;

/**
 * Positions one open Portal surface and maintains it across geometry changes.
 *
 * @param triggerRef - Reference containing the anchor element.
 * @param contentRef - Reference containing the fixed surface.
 * @param open - Whether geometry observers should be active.
 * @param placement - Requested logical placement.
 * @param portalTarget - Current Portal target used to retrigger observers after remounting.
 */
export function useMiaixzFloatingPosition(
  triggerRef: RefObject<HTMLElement | null>,
  contentRef: RefObject<HTMLElement | null>,
  open: boolean,
  placement: MiaixzFloatingPlacement,
  portalTarget: HTMLElement | null,
): void {
  useMiaixzClientLayoutEffect(() => {
    const trigger = triggerRef.current;
    const content = contentRef.current;
    if (!open || trigger === null || content === null) return undefined;
    const ownerDocument = trigger.ownerDocument;
    const viewport = ownerDocument.defaultView;
    if (viewport === null) return undefined;

    const update = () => {
      const position = calculateMiaixzFloatingPosition(
        trigger.getBoundingClientRect(),
        content.getBoundingClientRect(),
        placement,
        viewport.innerWidth,
        viewport.innerHeight,
        viewport.getComputedStyle(trigger).direction === "rtl",
      );
      content.style.left = `${position.x}px`;
      content.style.top = `${position.y}px`;
      content.dataset.placement = position.placement;
      content.dataset.miaixzPositioned = "true";
    };

    update();
    ownerDocument.addEventListener("scroll", update, true);
    viewport.addEventListener("resize", update);
    const resizeObserver =
      typeof ResizeObserver === "function" ? new ResizeObserver(update) : undefined;
    resizeObserver?.observe(trigger);
    resizeObserver?.observe(content);

    return () => {
      ownerDocument.removeEventListener("scroll", update, true);
      viewport.removeEventListener("resize", update);
      resizeObserver?.disconnect();
      delete content.dataset.miaixzPositioned;
    };
  }, [contentRef, open, placement, portalTarget, triggerRef]);
}

/**
 * Resolves flipping, logical alignment, and viewport clamping for one floating surface.
 *
 * @param trigger - Viewport geometry of the anchor element.
 * @param content - Viewport geometry of the floating surface.
 * @param requestedPlacement - Caller-requested logical placement.
 * @param viewportWidth - Current layout viewport width.
 * @param viewportHeight - Current layout viewport height.
 * @param rightToLeft - Whether logical inline start resolves to the right edge.
 * @returns Resolved placement and clamped viewport coordinates.
 */
export function calculateMiaixzFloatingPosition(
  trigger: DOMRect,
  content: DOMRect,
  requestedPlacement: MiaixzFloatingPlacement,
  viewportWidth: number,
  viewportHeight: number,
  rightToLeft: boolean,
): MiaixzFloatingPosition {
  const placement = resolveMiaixzFloatingPlacement(
    trigger,
    content,
    requestedPlacement,
    viewportWidth,
    viewportHeight,
  );
  let x: number;
  let y: number;

  if (placement === "top" || placement === "bottom") {
    x = trigger.left + (trigger.width - content.width) / 2;
    y =
      placement === "top"
        ? trigger.top - content.height - miaixzFloatingGap
        : trigger.bottom + miaixzFloatingGap;
  } else if (placement === "left" || placement === "right") {
    x =
      placement === "left"
        ? trigger.left - content.width - miaixzFloatingGap
        : trigger.right + miaixzFloatingGap;
    y = trigger.top + (trigger.height - content.height) / 2;
  } else {
    const alignStart = placement.endsWith("-start");
    const alignLeft = rightToLeft ? !alignStart : alignStart;
    x = alignLeft ? trigger.left : trigger.right - content.width;
    y = placement.startsWith("top-")
      ? trigger.top - content.height - miaixzFloatingGap
      : trigger.bottom + miaixzFloatingGap;
  }

  return {
    placement,
    x: clampMiaixzFloatingCoordinate(
      x,
      miaixzFloatingGap,
      viewportWidth - content.width - miaixzFloatingGap,
    ),
    y: clampMiaixzFloatingCoordinate(
      y,
      miaixzFloatingGap,
      viewportHeight - content.height - miaixzFloatingGap,
    ),
  };
}

/**
 * Flips one requested placement when its main-axis surface does not fit.
 *
 * @param trigger - Viewport geometry of the anchor element.
 * @param content - Viewport geometry of the floating surface.
 * @param placement - Requested placement.
 * @param viewportWidth - Current layout viewport width.
 * @param viewportHeight - Current layout viewport height.
 * @returns Original or opposite placement.
 */
function resolveMiaixzFloatingPlacement(
  trigger: DOMRect,
  content: DOMRect,
  placement: MiaixzFloatingPlacement,
  viewportWidth: number,
  viewportHeight: number,
): MiaixzFloatingPlacement {
  if (
    (placement === "bottom" || placement.startsWith("bottom-")) &&
    trigger.bottom + miaixzFloatingGap + content.height > viewportHeight - miaixzFloatingGap
  ) {
    return placement === "bottom"
      ? "top"
      : (placement.replace("bottom-", "top-") as MiaixzFloatingPlacement);
  }
  if (
    (placement === "top" || placement.startsWith("top-")) &&
    trigger.top - miaixzFloatingGap - content.height < miaixzFloatingGap
  ) {
    return placement === "top"
      ? "bottom"
      : (placement.replace("top-", "bottom-") as MiaixzFloatingPlacement);
  }
  if (
    placement === "right" &&
    trigger.right + miaixzFloatingGap + content.width > viewportWidth - miaixzFloatingGap
  ) {
    return "left";
  }
  if (
    placement === "left" &&
    trigger.left - miaixzFloatingGap - content.width < miaixzFloatingGap
  ) {
    return "right";
  }
  return placement;
}

/**
 * Clamps one coordinate while handling surfaces larger than the available viewport.
 *
 * @param value - Requested coordinate.
 * @param minimum - Minimum safe viewport coordinate.
 * @param maximum - Maximum safe viewport coordinate.
 * @returns Coordinate constrained to the valid interval.
 */
function clampMiaixzFloatingCoordinate(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), Math.max(minimum, maximum));
}

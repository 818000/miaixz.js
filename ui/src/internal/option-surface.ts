import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import { useMiaixzFloatingPosition } from "./overlay/floating-position.js";

/**
 * Limits an option surface to six actual rows before it scrolls.
 */
const miaixzVisibleOptionLimit = 6;

/**
 * Uses layout timing in browsers and passive timing during server rendering.
 */
const useClientLayoutEffect = typeof document === "undefined" ? useEffect : useLayoutEffect;

/**
 * Measures the first six rows without assuming fixed typography or row height.
 *
 * @param surface - Open surface containing the option rows.
 * @returns Border-box height cap, or undefined when all rows fit naturally.
 */
export function measureMiaixzOptionSurfaceHeight(surface: HTMLElement): number | undefined {
  const options = surface.querySelectorAll<HTMLElement>('[role="option"]');
  if (options.length <= miaixzVisibleOptionLimit) return undefined;
  const first = options[0]!.getBoundingClientRect();
  const last = options[miaixzVisibleOptionLimit - 1]!.getBoundingClientRect();
  const style = surface.ownerDocument.defaultView!.getComputedStyle(surface);
  const edges = [
    style.paddingTop,
    style.paddingBottom,
    style.borderTopWidth,
    style.borderBottomWidth,
  ];
  return Math.ceil(
    last.bottom - first.top + edges.reduce((sum, value) => sum + (parseFloat(value) || 0), 0),
  );
}

/**
 * Keeps the active option inside this surface without scrolling its ancestors.
 *
 * @param surface - Scrollable option panel.
 * @param activeOptionId - Option to reveal after its geometry settles.
 */
function revealMiaixzOption(surface: HTMLElement, activeOptionId: string | undefined): void {
  if (!activeOptionId) return;
  const option = surface.ownerDocument.getElementById(activeOptionId);
  if (!option || !surface.contains(option)) return;
  const panel = surface.getBoundingClientRect();
  const row = option.getBoundingClientRect();
  const top = panel.top + surface.clientTop;
  const bottom = top + surface.clientHeight;
  // Scroll this panel only; scrollIntoView would also move the page or drawer.
  if (row.top < top) surface.scrollTop -= top - row.top;
  else if (row.bottom > bottom) surface.scrollTop += row.bottom - bottom;
}

/**
 * Synchronizes shared Select, Combobox and Picker panel sizing and keyboard scrolling.
 *
 * @param triggerRef - Control whose border-box width anchors the surface.
 * @param surfaceRef - Scrollable option surface.
 * @param open - Whether the surface is open.
 * @param portalTarget - Portal destination, including modal-local portals.
 * @param activeOptionId - Keyboard or pointer active option to keep visible.
 */
export function useMiaixzOptionSurface(
  triggerRef: RefObject<HTMLElement | null>,
  surfaceRef: RefObject<HTMLElement | null>,
  open: boolean,
  portalTarget: HTMLElement | null,
  activeOptionId: string | undefined,
): void {
  const activeOptionRef = useRef(activeOptionId);
  useClientLayoutEffect(() => {
    activeOptionRef.current = activeOptionId;
  }, [activeOptionId]);

  useClientLayoutEffect(() => {
    const trigger = triggerRef.current;
    const surface = surfaceRef.current;
    if (!open || trigger === null || surface === null) return undefined;
    const viewport = trigger.ownerDocument.defaultView!;
    const update = () => {
      surface.style.width = `${trigger.getBoundingClientRect().width}px`;
      const height = measureMiaixzOptionSurfaceHeight(surface);
      surface.style.maxBlockSize =
        height === undefined ? "" : `min(${height}px, var(--miaixz-responsive-overlay-block-size))`;
      // Theme/font/layout changes can apply the height cap after the panel first opens.
      revealMiaixzOption(surface, activeOptionRef.current);
    };
    const resize = typeof ResizeObserver === "function" ? new ResizeObserver(update) : undefined;
    const observeRows = () => {
      resize?.disconnect();
      resize?.observe(trigger);
      resize?.observe(surface);
      surface.querySelectorAll('[role="option"]').forEach((option) => resize?.observe(option));
      update();
    };
    const mutation = new MutationObserver(observeRows);
    mutation.observe(surface, { childList: true, subtree: true, characterData: true });
    observeRows();
    viewport.addEventListener("resize", update);
    return () => {
      resize?.disconnect();
      mutation.disconnect();
      viewport.removeEventListener("resize", update);
    };
  }, [open, portalTarget, surfaceRef, triggerRef]);

  // Resolve the final top-layer geometry before revealing the active row.
  useMiaixzFloatingPosition(triggerRef, surfaceRef, open, "bottom-start", portalTarget);

  useClientLayoutEffect(() => {
    const surface = surfaceRef.current;
    if (!open || !activeOptionId || surface === null) return;
    revealMiaixzOption(surface, activeOptionId);
  }, [activeOptionId, open, portalTarget, surfaceRef]);
}

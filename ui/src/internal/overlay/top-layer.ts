import { useEffect, useLayoutEffect, type RefObject } from "react";

/**
 * Uses layout timing in browsers and passive timing during server rendering.
 */
const useMiaixzClientLayoutEffect = typeof document === "undefined" ? useEffect : useLayoutEffect;

/**
 * Synchronizes a non-modal surface with the browser manual Popover top layer.
 *
 * Unsupported browsers retain a fixed non-modal fallback by removing the unsupported attribute.
 * Cross-modal fallback is intentionally not promised by the frozen browser support contract.
 *
 * @param ref - Reference containing the Portal surface.
 * @param open - Whether the surface should be visible.
 * @param portalTarget - Current Portal destination used to synchronize remounts.
 */
export function useMiaixzManualPopover(
  ref: RefObject<HTMLElement | null>,
  open: boolean,
  portalTarget: HTMLElement | null,
): void {
  useMiaixzClientLayoutEffect(() => {
    const element = ref.current;
    if (element === null) return undefined;
    return synchronizeMiaixzManualPopover(element, open);
  }, [open, portalTarget, ref]);
}

/**
 * Applies one top-layer state transition and returns exact teardown behavior.
 *
 * @param element - Connected or test-owned surface receiving top-layer state.
 * @param open - Whether the surface should be visible.
 * @returns Cleanup that hides the synchronized surface.
 */
export function synchronizeMiaixzManualPopover(element: HTMLElement, open: boolean): () => void {
  if (typeof element.showPopover !== "function" || typeof element.hidePopover !== "function") {
    element.removeAttribute("popover");
    element.hidden = !open;
    element.toggleAttribute("data-miaixz-top-layer-fallback", open);
    return () => {
      element.hidden = true;
      element.removeAttribute("data-miaixz-top-layer-fallback");
    };
  }

  element.hidden = false;
  if (open && !element.matches(":popover-open")) element.showPopover();
  if (!open && element.matches(":popover-open")) element.hidePopover();
  return () => {
    if (element.matches(":popover-open")) element.hidePopover();
  };
}

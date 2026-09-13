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

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

import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";

import { lockMiaixzDocumentScroll } from "./document-scroll-lock.js";
import { isTopMiaixzModal, registerMiaixzModal } from "./portal-target.js";

/**
 * Uses layout timing in browsers and passive timing during server rendering.
 */
const useMiaixzClientLayoutEffect = typeof document === "undefined" ? useEffect : useLayoutEffect;

/**
 * Selects interactive elements that can initiate a controlled modal transition.
 */
const miaixzModalTriggerSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[contenteditable='true']",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

/**
 * Limits pointer-based restoration fallback to the interaction that immediately opened a modal.
 */
const miaixzModalInteractionWindow = 1000;

/**
 * Retains one shared pointer observer for each independent document realm.
 */
const miaixzModalInteractionRecords = new WeakMap<Document, MiaixzModalInteractionRecord>();

/**
 * Describes the shared recent-interaction state for one document realm.
 */
interface MiaixzModalInteractionRecord {
  /**
   * Counts mounted modal hooks using the document observer.
   */
  references: number;

  /**
   * Stores the most recent interactive pointer target.
   */
  target: HTMLElement | null;

  /**
   * Stores the wall-clock time at which the pointer interaction occurred.
   */
  recordedAt: number;

  /**
   * Handles pointer activity captured before application click handlers run.
   */
  readonly handlePointerDown: (event: PointerEvent) => void;
  /**
   * Clears pointer history when keyboard interaction takes over.
   */
  readonly handleKeyDown: () => void;
}

/**
 * Synchronizes a controlled state with one native modal, its stack, and document scroll lock.
 *
 * @param ref - Reference containing the native dialog element.
 * @param open - Controlled modal open state.
 * @param portalTarget - Current Portal target used to retrigger synchronization after mounting.
 * @param requestClose - Controlled close request used by the document Escape fallback.
 * @returns Stable reference to the element focused before the modal opened.
 */
export function useMiaixzNativeModal(
  ref: RefObject<HTMLDialogElement | null>,
  open: boolean,
  portalTarget: HTMLElement | null,
  requestClose?: () => void,
): RefObject<HTMLElement | null> {
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const requestCloseRef = useRef(requestClose);
  useMiaixzClientLayoutEffect(() => {
    requestCloseRef.current = requestClose;
  }, [requestClose]);
  useEffect(() => {
    const ownerDocument = ref.current?.ownerDocument ?? portalTarget?.ownerDocument;
    if (ownerDocument === undefined) return undefined;
    return observeMiaixzModalInteractions(ownerDocument);
  }, [portalTarget, ref]);

  useMiaixzClientLayoutEffect(() => {
    const dialog = ref.current;
    if (dialog === null) return undefined;

    if (!open) {
      if (dialog.open) dialog.close();
      return undefined;
    }

    if (!dialog.open) {
      restoreFocusRef.current = resolveMiaixzModalRestoreTarget(dialog.ownerDocument);
      dialog.showModal();
    }
    const unregisterModal = registerMiaixzModal(dialog);
    const unlockDocument = lockMiaixzDocumentScroll(dialog.ownerDocument);
    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (
        event.key !== "Escape" ||
        event.defaultPrevented ||
        event.isComposing ||
        !isTopMiaixzModal(dialog) ||
        hasOpenMiaixzBlockingPopover(dialog)
      ) {
        return;
      }
      event.preventDefault();
      const EventConstructor = dialog.ownerDocument.defaultView?.Event ?? Event;
      const cancelEvent = new EventConstructor("cancel", { bubbles: true, cancelable: true });
      dialog.dispatchEvent(cancelEvent);
      if (!cancelEvent.defaultPrevented && requestCloseRef.current !== undefined) {
        requestCloseRef.current();
      }
    };
    dialog.ownerDocument.addEventListener("keydown", handleEscape, true);
    return () => {
      dialog.ownerDocument.removeEventListener("keydown", handleEscape, true);
      unregisterModal();
      unlockDocument();
    };
  }, [open, portalTarget, ref]);
  return restoreFocusRef;
}

/**
 * Detects an interactive popover that must consume Escape before its modal.
 *
 * Non-interactive tooltips never create an extra dismissal step: Escape closes the owning modal
 * and unmounting the modal also removes its tooltip. Menus, listboxes, and other interactive
 * popovers remain responsible for the first Escape key press.
 *
 * @param dialog - Active dialog whose descendants are inspected.
 * @returns Whether a descendant currently occupies the popover top layer.
 */
function hasOpenMiaixzBlockingPopover(dialog: HTMLDialogElement): boolean {
  try {
    return [...dialog.querySelectorAll<HTMLElement>("[popover]:popover-open")].some(
      (popover) => popover.getAttribute("role") !== "tooltip",
    );
  } catch {
    return false;
  }
}

/**
 * Installs or reuses the document observer that remembers pointer-triggered modal initiators.
 *
 * Safari does not focus buttons after pointer activation, so activeElement alone cannot identify
 * the trigger. The short-lived captured target preserves cross-browser restoration without adding
 * a public trigger property to controlled Dialog and Drawer APIs.
 *
 * @param ownerDocument - Document whose modal interactions should be observed.
 * @returns Cleanup that releases the shared observer reference.
 */
function observeMiaixzModalInteractions(ownerDocument: Document): () => void {
  let record = miaixzModalInteractionRecords.get(ownerDocument);
  if (record === undefined) {
    record = {
      references: 0,
      target: null,
      recordedAt: 0,
      handlePointerDown: (event) => {
        const activeRecord = miaixzModalInteractionRecords.get(ownerDocument);
        if (activeRecord === undefined) return;
        activeRecord.target = findMiaixzModalInteractionTarget(event.target);
        activeRecord.recordedAt = Date.now();
      },
      handleKeyDown: () => {
        const activeRecord = miaixzModalInteractionRecords.get(ownerDocument);
        if (activeRecord === undefined) return;
        activeRecord.target = null;
        activeRecord.recordedAt = 0;
      },
    };
    miaixzModalInteractionRecords.set(ownerDocument, record);
    ownerDocument.addEventListener("pointerdown", record.handlePointerDown, true);
    ownerDocument.addEventListener("keydown", record.handleKeyDown, true);
  }
  record.references += 1;

  let active = true;
  return () => {
    if (!active) return;
    active = false;
    const activeRecord = miaixzModalInteractionRecords.get(ownerDocument);
    if (activeRecord === undefined) return;
    activeRecord.references -= 1;
    if (activeRecord.references > 0) return;
    ownerDocument.removeEventListener("pointerdown", activeRecord.handlePointerDown, true);
    ownerDocument.removeEventListener("keydown", activeRecord.handleKeyDown, true);
    miaixzModalInteractionRecords.delete(ownerDocument);
  };
}

/**
 * Resolves the focus destination to restore when a native modal closes.
 *
 * @param ownerDocument - Document whose active and recent interaction targets should be inspected.
 * @returns Connected trigger target, current focus target, or null when neither is meaningful.
 */
function resolveMiaixzModalRestoreTarget(ownerDocument: Document): HTMLElement | null {
  const record = miaixzModalInteractionRecords.get(ownerDocument);
  if (
    record?.target !== null &&
    record?.target !== undefined &&
    record.target.isConnected &&
    Date.now() - record.recordedAt <= miaixzModalInteractionWindow
  ) {
    return record.target;
  }
  const activeElement = ownerDocument.activeElement;
  return isMiaixzFocusableReference(activeElement) &&
    activeElement !== ownerDocument.body &&
    activeElement !== ownerDocument.documentElement
    ? activeElement
    : null;
}

/**
 * Finds the nearest enabled interactive ancestor for one pointer event target.
 *
 * @param value - Pointer event target, which may be a nested icon or text node.
 * @returns Nearest connected focusable ancestor or null when no trigger exists.
 */
function findMiaixzModalInteractionTarget(value: unknown): HTMLElement | null {
  if (
    typeof value !== "object" ||
    value === null ||
    !("closest" in value) ||
    typeof value.closest !== "function"
  ) {
    return null;
  }
  const candidate = value.closest(miaixzModalTriggerSelector) as unknown;
  return isMiaixzFocusableReference(candidate) && candidate.isConnected ? candidate : null;
}

/**
 * Determines whether an active-element value can be retained as a focus restoration target.
 *
 * @param value - Candidate active element from the modal's document realm.
 * @returns Whether the candidate exposes a connected HTMLElement focus contract.
 */
function isMiaixzFocusableReference(value: unknown): value is HTMLElement {
  return (
    typeof value === "object" &&
    value !== null &&
    "focus" in value &&
    typeof value.focus === "function" &&
    "isConnected" in value
  );
}

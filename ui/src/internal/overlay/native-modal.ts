import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";

import { lockMiaixzDocumentScroll } from "./document-scroll-lock.js";
import { registerMiaixzModal } from "./portal-target.js";

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
  /** Clears pointer history when keyboard interaction takes over. */
  readonly handleKeyDown: () => void;
}

/**
 * Synchronizes a controlled state with one native modal, its stack, and document scroll lock.
 *
 * @param ref - Reference containing the native dialog element.
 * @param open - Controlled modal open state.
 * @param portalTarget - Current Portal target used to retrigger synchronization after mounting.
 * @returns Stable reference to the element focused before the modal opened.
 */
export function useMiaixzNativeModal(
  ref: RefObject<HTMLDialogElement | null>,
  open: boolean,
  portalTarget: HTMLElement | null,
): RefObject<HTMLElement | null> {
  const restoreFocusRef = useRef<HTMLElement | null>(null);
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
    return () => {
      unregisterModal();
      unlockDocument();
    };
  }, [open, portalTarget, ref]);
  return restoreFocusRef;
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

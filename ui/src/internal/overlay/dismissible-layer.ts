import { useEffect, useRef, type RefObject } from "react";

/**
 * Identifies the user interaction that dismissed an overlay layer.
 */
export type MiaixzDismissReason = "escape" | "outside";

/**
 * Configures one active package-owned dismissible layer.
 */
interface MiaixzDismissibleLayerOptions {
  /**
   * Controls whether the layer participates in the document stack.
   */
  readonly active: boolean;

  /**
   * References the trigger or wrapper owned by the layer.
   */
  readonly triggerRef: RefObject<HTMLElement | null>;

  /**
   * References the Portal surface owned by the layer.
   */
  readonly contentRef: RefObject<HTMLElement | null>;

  /**
   * Receives a package-defined dismissal request.
   */
  readonly onDismiss: (reason: MiaixzDismissReason) => void;

  /**
   * Identifies the current Portal target and document realm.
   */
  readonly portalTarget: HTMLElement | null;
}

/**
 * Represents one registered layer in document activation order.
 */
interface MiaixzDismissibleLayerEntry {
  /**
   * References the trigger or wrapper owned by the layer.
   */
  readonly triggerRef: RefObject<HTMLElement | null>;

  /**
   * References the Portal surface owned by the layer.
   */
  readonly contentRef: RefObject<HTMLElement | null>;

  /**
   * Requests dismissal using the current React callback.
   */
  readonly dismiss: (reason: MiaixzDismissReason) => void;
}

/**
 * Stores active dismissible layers and shared listeners for one document realm.
 */
interface MiaixzDismissibleLayerStore {
  /**
   * Retains layers in activation order.
   */
  readonly entries: MiaixzDismissibleLayerEntry[];

  /**
   * Removes the shared document listeners.
   */
  readonly removeListeners: () => void;
}

/**
 * Isolates dismissible overlay branches between document realms.
 */
const miaixzDismissibleLayerStores = new WeakMap<Document, MiaixzDismissibleLayerStore>();

/**
 * Registers Escape and external-pointer dismissal for one active overlay surface.
 *
 * @param options - Layer registration and dismissal configuration.
 */
export function useMiaixzDismissibleLayer(options: MiaixzDismissibleLayerOptions): void {
  const dismissRef = useRef(options.onDismiss);

  useEffect(() => {
    dismissRef.current = options.onDismiss;
  }, [options.onDismiss]);

  useEffect(() => {
    const ownerDocument = options.portalTarget?.ownerDocument;
    if (!options.active || ownerDocument === undefined) return undefined;
    const entry: MiaixzDismissibleLayerEntry = {
      triggerRef: options.triggerRef,
      contentRef: options.contentRef,
      dismiss: (reason) => dismissRef.current(reason),
    };
    const store = getMiaixzDismissibleLayerStore(ownerDocument);
    store.entries.push(entry);
    return () => {
      const index = store.entries.indexOf(entry);
      if (index >= 0) store.entries.splice(index, 1);
      if (store.entries.length === 0) {
        store.removeListeners();
        miaixzDismissibleLayerStores.delete(ownerDocument);
      }
    };
  }, [options.active, options.contentRef, options.portalTarget, options.triggerRef]);
}

/**
 * Returns the existing document stack or installs its shared event listeners.
 *
 * @param ownerDocument - Document whose overlay stack is requested.
 * @returns The active dismissible-layer store.
 */
function getMiaixzDismissibleLayerStore(ownerDocument: Document): MiaixzDismissibleLayerStore {
  const existing = miaixzDismissibleLayerStores.get(ownerDocument);
  if (existing !== undefined) return existing;

  const entries: MiaixzDismissibleLayerEntry[] = [];
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Escape" || event.defaultPrevented) return;
    const topLayer = entries.at(-1);
    if (topLayer === undefined) return;
    event.preventDefault();
    topLayer.dismiss("escape");
  };
  const handlePointerDown = (event: PointerEvent) => {
    const path = event.composedPath();
    let containingIndex = -1;
    for (let index = entries.length - 1; index >= 0; index -= 1) {
      const entry = entries[index];
      if (entry !== undefined && doesMiaixzLayerContainPath(entry, path)) {
        containingIndex = index;
        break;
      }
    }
    for (let index = entries.length - 1; index > containingIndex; index -= 1) {
      entries[index]?.dismiss("outside");
    }
  };

  ownerDocument.addEventListener("keydown", handleKeyDown, true);
  ownerDocument.addEventListener("pointerdown", handlePointerDown, true);
  const created: MiaixzDismissibleLayerStore = {
    entries,
    removeListeners: () => {
      ownerDocument.removeEventListener("keydown", handleKeyDown, true);
      ownerDocument.removeEventListener("pointerdown", handlePointerDown, true);
    },
  };
  miaixzDismissibleLayerStores.set(ownerDocument, created);
  return created;
}

/**
 * Tests whether an event path belongs to a layer trigger or Portal surface.
 *
 * @param entry - Layer whose owned nodes should be inspected.
 * @param path - Composed event path crossing shadow and Portal boundaries.
 * @returns Whether the pointer event occurred inside the layer.
 */
function doesMiaixzLayerContainPath(
  entry: MiaixzDismissibleLayerEntry,
  path: EventTarget[],
): boolean {
  const trigger = entry.triggerRef.current;
  const content = entry.contentRef.current;
  return path.some(
    (target) =>
      target === trigger ||
      target === content ||
      (target instanceof Node &&
        (trigger?.contains(target) === true || content?.contains(target) === true)),
  );
}

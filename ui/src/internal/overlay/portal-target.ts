import { useSyncExternalStore } from "react";

/**
 * Stores modal ordering and subscriptions for one document realm.
 */
interface MiaixzModalStore {
  /**
   * Retains open native dialogs in top-layer activation order.
   */
  readonly dialogs: HTMLDialogElement[];

  /**
   * Receives changes to the active modal stack.
   */
  readonly listeners: Set<() => void>;
}

/**
 * Isolates active modal state between independent document realms.
 */
const miaixzModalStores = new WeakMap<Document, MiaixzModalStore>();

/**
 * Provides a stable no-op subscription for client document discovery.
 *
 * @returns A no-op cleanup function.
 */
function subscribeToMiaixzClientDocument(): () => void {
  return () => undefined;
}

/**
 * Registers one open native modal and publishes its top-layer order.
 *
 * @param dialog - Open native dialog entering the modal stack.
 * @returns An idempotent registration cleanup function.
 */
export function registerMiaixzModal(dialog: HTMLDialogElement): () => void {
  const store = getMiaixzModalStore(dialog.ownerDocument);
  const existingIndex = store.dialogs.indexOf(dialog);
  if (existingIndex >= 0) store.dialogs.splice(existingIndex, 1);
  store.dialogs.push(dialog);
  publishMiaixzModalStore(store);

  let active = true;
  return () => {
    if (!active) return;
    active = false;
    const index = store.dialogs.indexOf(dialog);
    if (index >= 0) store.dialogs.splice(index, 1);
    publishMiaixzModalStore(store);
  };
}

/**
 * Resolves the package-owned Portal destination for an anchored or global overlay.
 *
 * Anchored overlays use the nearest open native dialog so modal focus containment remains valid.
 * Global overlays use the topmost registered modal and otherwise fall back to the document body.
 *
 * @param anchor - Optional overlay trigger or wrapper element.
 * @param useTopModal - Whether an unanchored overlay should follow the topmost modal.
 * @returns A client Portal target, or null before client mounting.
 */
export function useMiaixzPortalTarget(
  anchor: HTMLElement | null = null,
  useTopModal = false,
): HTMLElement | null {
  const ownerDocument = useSyncExternalStore(
    subscribeToMiaixzClientDocument,
    () => anchor?.ownerDocument ?? document,
    () => null,
  );
  const topModal = useSyncExternalStore(
    (listener) => subscribeToMiaixzModalStore(ownerDocument, listener),
    () => getTopMiaixzModal(ownerDocument),
    () => null,
  );

  if (ownerDocument === null) return null;
  if (useTopModal) return topModal ?? ownerDocument.body;
  return anchor?.closest<HTMLDialogElement>("dialog[open]") ?? ownerDocument.body;
}

/**
 * Returns the mutable modal store for one document, creating it when necessary.
 *
 * @param ownerDocument - Document whose modal stack is requested.
 * @returns The document-scoped modal store.
 */
function getMiaixzModalStore(ownerDocument: Document): MiaixzModalStore {
  const existing = miaixzModalStores.get(ownerDocument);
  if (existing !== undefined) return existing;
  const created: MiaixzModalStore = { dialogs: [], listeners: new Set() };
  miaixzModalStores.set(ownerDocument, created);
  return created;
}

/**
 * Returns the connected topmost native modal for a document.
 *
 * @param ownerDocument - Document whose active modal should be read.
 * @returns The topmost connected open dialog, or null when none exists.
 */
function getTopMiaixzModal(ownerDocument: Document | null): HTMLDialogElement | null {
  if (ownerDocument === null) return null;
  const store = miaixzModalStores.get(ownerDocument);
  if (store === undefined) return null;
  for (let index = store.dialogs.length - 1; index >= 0; index -= 1) {
    const dialog = store.dialogs[index];
    if (dialog?.isConnected && dialog.open) return dialog;
  }
  return null;
}

/**
 * Subscribes to modal target changes without creating a store during server rendering.
 *
 * @param ownerDocument - Document whose modal changes should be observed.
 * @param listener - Snapshot listener supplied by React.
 * @returns Subscription cleanup.
 */
function subscribeToMiaixzModalStore(
  ownerDocument: Document | null,
  listener: () => void,
): () => void {
  if (ownerDocument === null) return () => undefined;
  const store = getMiaixzModalStore(ownerDocument);
  store.listeners.add(listener);
  return () => store.listeners.delete(listener);
}

/**
 * Notifies every current modal-store subscriber.
 *
 * @param store - Modal store whose ordering changed.
 */
function publishMiaixzModalStore(store: MiaixzModalStore): void {
  for (const listener of store.listeners) listener();
}

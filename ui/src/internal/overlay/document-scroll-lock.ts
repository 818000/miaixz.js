/**
 * Retains the exact inline styles and nesting depth for one scrolling root.
 */
interface MiaixzDocumentScrollLock {
  /**
   * Counts active native modal owners.
   */
  count: number;

  /**
   * Preserves the caller-owned inline overflow value.
   */
  readonly overflow: string;

  /**
   * Preserves the caller-owned inline logical scrollbar compensation.
   */
  readonly paddingInlineEnd: string;

  /**
   * Identifies the root scrolling element being locked.
   */
  readonly root: HTMLElement;
}

/**
 * Coordinates nested native modal scroll locks per document realm.
 */
const miaixzDocumentScrollLocks = new WeakMap<Document, MiaixzDocumentScrollLock>();

/**
 * Locks one document scrolling root while preserving its exact caller-owned inline values.
 *
 * @param ownerDocument - Document whose background scrolling should be suspended.
 * @returns An idempotent unlock function.
 */
export function lockMiaixzDocumentScroll(ownerDocument: Document): () => void {
  const existing = miaixzDocumentScrollLocks.get(ownerDocument);
  if (existing !== undefined) {
    existing.count += 1;
    return createMiaixzScrollUnlock(ownerDocument, existing);
  }

  const root =
    (ownerDocument.scrollingElement as HTMLElement | null) ?? ownerDocument.documentElement;
  const state: MiaixzDocumentScrollLock = {
    count: 1,
    overflow: root.style.overflow,
    paddingInlineEnd: root.style.paddingInlineEnd,
    root,
  };
  const viewport = ownerDocument.defaultView;
  const scrollbarWidth = Math.max(0, (viewport?.innerWidth ?? root.clientWidth) - root.clientWidth);
  root.style.overflow = "hidden";
  if (scrollbarWidth > 0 && viewport !== null) {
    const computedPadding = viewport.getComputedStyle(root).paddingInlineEnd;
    root.style.paddingInlineEnd =
      computedPadding === "0px"
        ? `${scrollbarWidth}px`
        : `calc(${computedPadding} + ${scrollbarWidth}px)`;
  }
  miaixzDocumentScrollLocks.set(ownerDocument, state);
  return createMiaixzScrollUnlock(ownerDocument, state);
}

/**
 * Creates an idempotent release operation for one reference-counted document lock.
 *
 * @param ownerDocument - Document owning the lock.
 * @param state - Shared lock state for that document.
 * @returns An idempotent unlock function.
 */
function createMiaixzScrollUnlock(
  ownerDocument: Document,
  state: MiaixzDocumentScrollLock,
): () => void {
  let active = true;
  return () => {
    if (!active) return;
    active = false;
    state.count -= 1;
    if (state.count > 0) return;
    state.root.style.overflow = state.overflow;
    state.root.style.paddingInlineEnd = state.paddingInlineEnd;
    miaixzDocumentScrollLocks.delete(ownerDocument);
  };
}

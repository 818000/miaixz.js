import { Fragment, useEffect, type ReactElement, type ReactNode, type RefObject } from "react";

/**
 * Selects elements that can participate in keyboard focus order.
 */
const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[contenteditable='true']",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

/**
 * Stores the active focus scopes for each independent document realm.
 */
const focusScopeStacks = new WeakMap<Document, FocusScopeEntry[]>();

/**
 * Describes the internal state retained while one focus scope is active.
 */
interface FocusScopeEntry {
  /**
   * Uniquely identifies the activation instance.
   */
  readonly id: symbol;

  /**
   * Contains every focusable node owned by the scope.
   */
  readonly container: HTMLElement;

  /**
   * Identifies the document that owns the scope.
   */
  readonly document: Document;

  /**
   * Identifies the element that should receive focus after deactivation.
   */
  restoreTarget: HTMLElement | undefined;

  /**
   * Tracks whether the scope added a temporary container tabindex.
   */
  addedContainerTabIndex: boolean;
}

/**
 * Configures the package-internal focus scope component.
 */
interface FocusScopeProps {
  /**
   * Controls whether the focus boundary is active.
   */
  readonly active: boolean;

  /**
   * References the element that owns focusable descendants.
   */
  readonly containerRef: RefObject<HTMLElement | null>;

  /**
   * Optionally identifies the preferred initial focus element.
   */
  readonly initialFocusRef?: RefObject<HTMLElement | null>;

  /**
   * Optionally supplies a restoration target captured before a native modal changes focus.
   */
  readonly restoreFocusRef?: RefObject<HTMLElement | null>;

  /**
   * Supplies content without introducing another DOM wrapper.
   */
  readonly children: ReactNode;
}

/**
 * Activates the single package-internal focus boundary around rendered children.
 *
 * Activation is deferred to a microtask so native dialog synchronization can finish before the
 * first focus move. Cleanup cancels pending activation or deactivates the live scope exactly once.
 *
 * @param props - Internal focus boundary configuration.
 * @param props.active - Whether the focus boundary is active.
 * @param props.containerRef - Reference to the scope container.
 * @param props.initialFocusRef - Optional reference to the preferred initial target.
 * @param props.restoreFocusRef - Optional reference to a pre-captured restoration target.
 * @param props.children - Content rendered without an additional wrapper.
 * @returns Rendered children without an additional DOM element.
 * @internal
 */
export function FocusScope({
  active,
  containerRef,
  initialFocusRef,
  restoreFocusRef,
  children,
}: FocusScopeProps): ReactElement {
  useEffect(() => {
    if (!active) return undefined;
    const container = containerRef.current;
    if (container === null) return undefined;
    let cancelled = false;
    let deactivate: (() => void) | undefined;
    queueMicrotask(() => {
      if (cancelled) return;
      deactivate = activateMiaixzFocusScope(
        container,
        initialFocusRef?.current ?? undefined,
        restoreFocusRef === undefined ? undefined : restoreFocusRef.current,
      );
    });
    return () => {
      cancelled = true;
      deactivate?.();
    };
  }, [active, containerRef, initialFocusRef, restoreFocusRef]);

  return <Fragment>{children}</Fragment>;
}

/**
 * Activates focus entry, Tab containment, nested-scope ownership, and restoration for one element.
 *
 * This package-internal function is exported only for direct reuse and deterministic unit tests;
 * it is not re-exported from any public package entry.
 *
 * @param container - Element whose descendants form the focus boundary.
 * @param initialFocus - Optional preferred initial focus element inside the container.
 * @param restoreFocusTarget - Optional pre-captured restoration target; null disables restoration.
 * @returns An idempotent function that removes the scope and restores a valid focus target.
 * @internal
 */
export function activateMiaixzFocusScope(
  container: HTMLElement,
  initialFocus?: HTMLElement,
  restoreFocusTarget?: HTMLElement | null,
): () => void {
  const ownerDocument = container.ownerDocument;
  const stack = getFocusScopeStack(ownerDocument);
  const activeElement = ownerDocument.activeElement;
  const entry: FocusScopeEntry = {
    id: Symbol("miaixz-focus-scope"),
    container,
    document: ownerDocument,
    restoreTarget:
      restoreFocusTarget === undefined
        ? isFocusableReference(activeElement)
          ? activeElement
          : undefined
        : (restoreFocusTarget ?? undefined),
    addedContainerTabIndex: false,
  };

  /**
   * Keeps keyboard Tab movement inside the current topmost scope.
   *
   * @param event - Keyboard event dispatched from the scope container.
   */
  const handleKeyDown = (event: KeyboardEvent): void => {
    if (
      event.key !== "Tab" ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      getTopFocusScope(ownerDocument)?.id !== entry.id
    ) {
      return;
    }

    const focusable = getFocusableElements(container);
    if (focusable.length === 0) {
      event.preventDefault();
      focusScopeEntry(entry);
      return;
    }

    const first = focusable[0];
    const last = focusable.at(-1);
    const current = ownerDocument.activeElement;
    const currentIsInside = isFocusableReference(current) && container.contains(current);
    if (event.shiftKey && (!currentIsInside || current === first)) {
      event.preventDefault();
      if (last !== undefined) focusElement(last);
    } else if (!event.shiftKey && (!currentIsInside || current === last)) {
      event.preventDefault();
      if (first !== undefined) focusElement(first);
    }
  };

  /**
   * Redirects programmatic focus back into the current topmost scope.
   *
   * @param event - Focus event observed by the owner document.
   */
  const handleFocusIn = (event: FocusEvent): void => {
    if (getTopFocusScope(ownerDocument)?.id !== entry.id) return;
    const target = event.target;
    if (!isFocusableReference(target) || !container.contains(target)) focusScopeEntry(entry);
  };

  stack.push(entry);
  container.addEventListener("keydown", handleKeyDown);
  ownerDocument.addEventListener("focusin", handleFocusIn);
  focusScopeEntry(entry, initialFocus);

  let active = true;
  return () => {
    if (!active) return;
    active = false;
    const currentStack = getFocusScopeStack(ownerDocument);
    const entryIndex = currentStack.findIndex((candidate) => candidate.id === entry.id);
    if (entryIndex < 0) return;
    const wasTopScope = entryIndex === currentStack.length - 1;
    currentStack.splice(entryIndex, 1);
    container.removeEventListener("keydown", handleKeyDown);
    ownerDocument.removeEventListener("focusin", handleFocusIn);
    restoreContainerTabIndex(entry);

    if (!wasTopScope) {
      const nestedEntry = currentStack[entryIndex];
      if (
        nestedEntry !== undefined &&
        entry.restoreTarget !== undefined &&
        nestedEntry.restoreTarget !== undefined &&
        entry.container.contains(nestedEntry.restoreTarget)
      ) {
        nestedEntry.restoreTarget = entry.restoreTarget;
      }
      return;
    }

    restoreFocusAfterScope(entry, currentStack.at(-1));
    if (currentStack.length === 0) focusScopeStacks.delete(ownerDocument);
  };
}

/**
 * Returns the mutable activation stack for one document realm.
 *
 * @param ownerDocument - Document whose scopes are being coordinated.
 * @returns Existing or newly created focus-scope stack.
 */
function getFocusScopeStack(ownerDocument: Document): FocusScopeEntry[] {
  const existing = focusScopeStacks.get(ownerDocument);
  if (existing !== undefined) return existing;
  const created: FocusScopeEntry[] = [];
  focusScopeStacks.set(ownerDocument, created);
  return created;
}

/**
 * Returns the active topmost scope for one document.
 *
 * @param ownerDocument - Document whose scope stack should be inspected.
 * @returns Topmost scope or undefined when none is active.
 */
function getTopFocusScope(ownerDocument: Document): FocusScopeEntry | undefined {
  return focusScopeStacks.get(ownerDocument)?.at(-1);
}

/**
 * Reads the current focusable descendants in document order.
 *
 * @param container - Scope container to inspect.
 * @returns Connected, enabled, assistive-visible focus targets.
 */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelector)).filter(
    (element) =>
      element.isConnected &&
      !element.hasAttribute("disabled") &&
      element.getAttribute("aria-hidden") !== "true" &&
      element.closest("[hidden], [inert], [aria-hidden='true']") === null,
  );
}

/**
 * Moves focus to the preferred target, first focusable descendant, or the container itself.
 *
 * @param entry - Active scope receiving focus.
 * @param preferred - Optional preferred target within the scope.
 */
function focusScopeEntry(entry: FocusScopeEntry, preferred?: HTMLElement): void {
  if (
    preferred !== undefined &&
    preferred.isConnected &&
    entry.container.contains(preferred) &&
    focusElement(preferred)
  ) {
    return;
  }

  const first = getFocusableElements(entry.container)[0];
  if (first !== undefined && focusElement(first)) return;
  if (entry.container.getAttribute("tabindex") === null) {
    entry.container.setAttribute("tabindex", "-1");
    entry.addedContainerTabIndex = true;
  }
  focusElement(entry.container);
}

/**
 * Restores focus to the captured target or to the still-active parent scope.
 *
 * @param entry - Scope being removed.
 * @param parent - Remaining parent scope, when one exists.
 */
function restoreFocusAfterScope(entry: FocusScopeEntry, parent: FocusScopeEntry | undefined): void {
  const target = entry.restoreTarget;
  if (
    target !== undefined &&
    target.isConnected &&
    (parent === undefined || parent.container.contains(target)) &&
    focusElement(target)
  ) {
    return;
  }
  if (parent !== undefined) focusScopeEntry(parent);
}

/**
 * Removes a tabindex added only to support an otherwise empty focus scope.
 *
 * @param entry - Scope whose container attributes should be restored.
 */
function restoreContainerTabIndex(entry: FocusScopeEntry): void {
  if (entry.addedContainerTabIndex) entry.container.removeAttribute("tabindex");
}

/**
 * Determines whether an unknown active-element value can safely receive focus.
 *
 * @param value - Candidate active or restoration target.
 * @returns Whether the candidate exposes the required HTMLElement focus contract.
 */
function isFocusableReference(value: unknown): value is HTMLElement {
  return (
    typeof value === "object" &&
    value !== null &&
    "focus" in value &&
    typeof value.focus === "function" &&
    "isConnected" in value
  );
}

/**
 * Attempts a focus move without allowing detached or browser-specific failures to escape cleanup.
 *
 * @param element - Connected element that should receive focus.
 * @returns Whether the owner document reports the element as active after the move.
 */
function focusElement(element: HTMLElement): boolean {
  try {
    element.focus({ preventScroll: true });
    return element.ownerDocument.activeElement === element;
  } catch {
    return false;
  }
}

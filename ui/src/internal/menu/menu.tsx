import {
  useEffect,
  useRef,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type RefObject,
} from "react";

import { classNames } from "../class-names.js";

/**
 * Selects enabled items owned by the package-internal menu pattern.
 */
const miaixzMenuItemSelector = [
  '[role="menuitem"]',
  '[role="menuitemcheckbox"]',
  '[role="menuitemradio"]',
].join(",");

/**
 * Selects document-order focus targets when Tab leaves a Portal menu.
 */
const miaixzDocumentTabStopSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[contenteditable='true']",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

/**
 * Configures the package-internal WAI-ARIA menu behavior.
 */
export interface MiaixzMenuProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Controls initial focus and active keyboard behavior.
   */
  readonly active: boolean;

  /**
   * References the menu button used for restoration and Tab ordering.
   */
  readonly triggerRef: RefObject<HTMLButtonElement | null>;

  /**
   * Requests closure and chooses whether trigger focus should be restored.
   */
  readonly onRequestClose: (restoreFocus: boolean) => void;
}

/**
 * Renders the single package-internal menu pattern used by Dropdown and future composites.
 *
 * @param props - Native menu attributes and package-owned lifecycle controls.
 * @param props.active - Whether the menu owns keyboard focus.
 * @param props.triggerRef - Reference to the owning menu button.
 * @param props.onRequestClose - Closure request with focus-restoration intent.
 * @param props.className - Optional project class merged with the internal menu class.
 * @param props.children - Menu item, label, and divider content.
 * @param props.onClick - Optional native click observer.
 * @param props.onKeyDown - Optional native keyboard observer.
 * @returns A WAI-ARIA menu with roving focus and Portal-safe Tab behavior.
 */
export function MiaixzMenu({
  active,
  triggerRef,
  onRequestClose,
  className,
  children,
  onClick,
  onKeyDown,
  ...props
}: MiaixzMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;
    queueMicrotask(() => {
      const items = getMiaixzMenuItems(menuRef.current);
      for (const item of items) item.tabIndex = -1;
      items[0]?.focus({ preventScroll: true });
    });
  }, [active]);

  return (
    <div
      {...props}
      ref={menuRef}
      role="menu"
      className={classNames("miaixz-menu", className)}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented && getMiaixzMenuItemFromEvent(event) !== null) {
          onRequestClose(true);
        }
      }}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        if (!event.defaultPrevented) {
          handleMiaixzMenuKeyDown(event, triggerRef.current, onRequestClose);
        }
      }}
    >
      {children}
    </div>
  );
}

/**
 * Applies the frozen menu keyboard table to one key event.
 *
 * @param event - Keyboard event dispatched by the menu.
 * @param trigger - Owning menu button used for restoration and Tab order.
 * @param onRequestClose - Closure request with focus-restoration intent.
 */
function handleMiaixzMenuKeyDown(
  event: KeyboardEvent<HTMLDivElement>,
  trigger: HTMLButtonElement | null,
  onRequestClose: (restoreFocus: boolean) => void,
): void {
  const items = getMiaixzMenuItems(event.currentTarget);
  const currentIndex = items.indexOf(
    event.currentTarget.ownerDocument.activeElement as HTMLElement,
  );
  let nextIndex: number | undefined;

  if (items.length > 0) {
    if (event.key === "ArrowDown") nextIndex = (currentIndex + 1) % items.length;
    if (event.key === "ArrowUp") nextIndex = (currentIndex - 1 + items.length) % items.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = items.length - 1;
  }

  const nextItem = nextIndex === undefined ? undefined : items[nextIndex];
  if (nextItem !== undefined) {
    event.preventDefault();
    nextItem.focus({ preventScroll: true });
    return;
  }

  if (event.key === "Escape") {
    event.preventDefault();
    onRequestClose(true);
    return;
  }

  if (event.key === "Tab") {
    event.preventDefault();
    const tabTarget = getAdjacentMiaixzTabStop(trigger, event.shiftKey);
    onRequestClose(false);
    queueMicrotask(() => tabTarget?.focus({ preventScroll: true }));
  }
}

/**
 * Reads connected and enabled menu items in current DOM order.
 *
 * @param menu - Menu root whose items should be queried.
 * @returns Enabled menu items in roving-focus order.
 */
function getMiaixzMenuItems(menu: HTMLDivElement | null): HTMLElement[] {
  if (menu === null) return [];
  return Array.from(menu.querySelectorAll<HTMLElement>(miaixzMenuItemSelector)).filter(
    (item) =>
      item.isConnected &&
      !item.hasAttribute("disabled") &&
      item.getAttribute("aria-disabled") !== "true" &&
      item.closest("[hidden], [inert], [aria-hidden='true']") === null,
  );
}

/**
 * Resolves an enabled menu item from a bubbling click event.
 *
 * @param event - Menu click event whose target should be inspected.
 * @returns The selected enabled item, or null when the click is not a selection.
 */
function getMiaixzMenuItemFromEvent(event: MouseEvent<HTMLDivElement>): HTMLElement | null {
  const target = event.target;
  if (!(target instanceof Element)) return null;
  const item = target.closest<HTMLElement>(miaixzMenuItemSelector);
  if (
    item === null ||
    !event.currentTarget.contains(item) ||
    item.hasAttribute("disabled") ||
    item.getAttribute("aria-disabled") === "true"
  ) {
    return null;
  }
  return item;
}

/**
 * Finds the document-order Tab stop adjacent to a Portal menu trigger.
 *
 * @param trigger - Owning menu button.
 * @param reverse - Whether Shift+Tab requests the previous stop.
 * @returns Adjacent connected focus target, or null at a document boundary.
 */
function getAdjacentMiaixzTabStop(
  trigger: HTMLButtonElement | null,
  reverse: boolean,
): HTMLElement | null {
  if (trigger === null) return null;
  const stops = Array.from(
    trigger.ownerDocument.querySelectorAll<HTMLElement>(miaixzDocumentTabStopSelector),
  ).filter(
    (element) =>
      element.isConnected &&
      element.closest("[hidden], [inert], [aria-hidden='true'], [role='menu']") === null,
  );
  const triggerIndex = stops.indexOf(trigger);
  if (triggerIndex < 0) return null;
  return stops[triggerIndex + (reverse ? -1 : 1)] ?? null;
}

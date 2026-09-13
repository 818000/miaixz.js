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

/* eslint-disable react-hooks/refs -- Menu lifecycle uses Popover-owned DOM refs.
 */
/* eslint-disable jsdoc/require-jsdoc -- Closed internal menu render records are self-describing.
 */
import {
  cloneElement,
  forwardRef,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { MiaixzUiError } from "../../errors/ui-error.js";
import { classNames } from "../../shared/class-names.js";
import { validateMiaixzCollectionItems } from "../../shared/collection/controller.js";
import { Icon } from "../icon/icon.js";
import { Popover } from "../popover/popover.js";
import { useMiaixzPopoverContext } from "../popover/context.js";
import type {
  DropdownEntry,
  DropdownPresentation,
  DropdownProps,
  DropdownSubmenuEntry,
  DropdownSubmenuItem,
} from "./dropdown.types.js";
import { withMiaixzThemeComponent } from "../../theme/themed-component.js";

/**
 * Renders one stable data-driven menu with a single permitted submenu depth.
 */
export const Dropdown = withMiaixzThemeComponent(
  "Dropdown",
  forwardRef<HTMLButtonElement, DropdownProps>(function Dropdown(
    { label, items, trigger, surface = "framed", density = "standard", slotProps, ...props },
    ref,
  ) {
    validateDropdownEntries(items);
    const initialFocusRef = useRef<"first" | "last">("first");
    const originalKeyDown = trigger.props.onKeyDown;
    const originalClick = trigger.props.onClick;
    const preparedTrigger = cloneElement(trigger, {
      onClick: (event: MouseEvent<HTMLButtonElement>) => {
        originalClick?.(event);
        if (!event.defaultPrevented) initialFocusRef.current = "first";
      },
      onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => {
        originalKeyDown?.(event);
        if (event.defaultPrevented) return;
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          initialFocusRef.current = event.key === "ArrowUp" ? "last" : "first";
          event.currentTarget.click();
        }
      },
    });
    const contentSlot = slotProps?.content;
    return (
      <Popover
        {...props}
        ref={ref}
        trigger={preparedTrigger}
        popupRole="menu"
        slotProps={{
          ...slotProps,
          content: (ownerState) => {
            const supplied =
              typeof contentSlot === "function" ? contentSlot(ownerState) : contentSlot;
            return {
              ...supplied,
              className: classNames(
                "miaixz-dropdown-content",
                `miaixz-dropdown-surface-${surface}`,
                `miaixz-dropdown-density-${density}`,
                supplied?.className,
              ),
              ...(label === undefined ? {} : { "aria-label": label }),
            };
          },
        }}
      >
        <DropdownMenuBehavior initialFocusRef={initialFocusRef}>
          {items.map((entry) => (
            <DropdownEntryView key={entry.id} entry={entry} />
          ))}
        </DropdownMenuBehavior>
      </Popover>
    );
  }),
);

interface DropdownMenuBehaviorProps {
  readonly initialFocusRef: RefObject<"first" | "last">;
  readonly children: ReactNode;
}

function DropdownMenuBehavior({ initialFocusRef, children }: DropdownMenuBehaviorProps) {
  const popover = useMiaixzPopoverContext();
  const typeaheadRef = useRef({ value: "", time: 0 });
  useEffect(() => {
    if (popover === undefined || !popover.open) return undefined;
    const menu = popover.contentRef.current;
    if (menu === null) return undefined;
    queueMicrotask(() => {
      const items = getMenuItems(menu);
      items.forEach((item) => {
        item.tabIndex = -1;
      });
      const target = initialFocusRef.current === "last" ? items.at(-1) : items[0];
      target?.focus({ preventScroll: true });
    });
    const handleKeyDown = (event: globalThis.KeyboardEvent): void => {
      if (event.target instanceof Element && event.target.closest('[role="menu"]') !== menu) return;
      handleMenuKeyDown(event, menu, typeaheadRef, (reason) => popover.requestClose(reason));
    };
    menu.addEventListener("keydown", handleKeyDown);
    return () => menu.removeEventListener("keydown", handleKeyDown);
  }, [initialFocusRef, popover]);
  return <>{children}</>;
}

function DropdownEntryView({ entry }: { readonly entry: DropdownEntry }) {
  const popover = useMiaixzPopoverContext();
  const close = (): void => popover?.requestClose("selection");
  if (entry.kind === "label") {
    return (
      <div id={entry.id} className="miaixz-dropdown-label">
        {entry.label}
      </div>
    );
  }
  if (entry.kind === "divider") return <hr id={entry.id} className="miaixz-dropdown-divider" />;
  if (entry.kind === "radioGroup") {
    return (
      <div
        id={entry.id}
        role="group"
        aria-label={typeof entry.label === "string" ? entry.label : undefined}
      >
        <div className="miaixz-dropdown-label">{entry.label}</div>
        {entry.options.map((option) => (
          <button
            key={option.id}
            id={option.id}
            role="menuitemradio"
            aria-checked={option.value === entry.value}
            className="miaixz-dropdown-item"
            disabled={option.disabled}
            data-text-value={option.textValue}
            onClick={(event) => {
              entry.onValueChange(option.value, event);
              if (!event.defaultPrevented) close();
            }}
            type="button"
          >
            <span className="miaixz-dropdown-item-copy">
              <span className="miaixz-dropdown-item-label">{option.label}</span>
            </span>
            {option.value === entry.value ? (
              <Icon
                aria-hidden="true"
                name="Check"
                size="control"
                className="miaixz-dropdown-item-check"
              />
            ) : null}
          </button>
        ))}
      </div>
    );
  }
  if (entry.kind === "submenu") return <DropdownSubmenu entry={entry} />;
  const content = <DropdownEntryContent entry={entry} />;
  const itemClassName = classNames(
    "miaixz-dropdown-item",
    entry.tone === "danger" && "miaixz-dropdown-item-danger",
  );
  if (entry.kind === "link") {
    const originalClick = entry.anchorProps?.onClick;
    return (
      <a
        {...entry.anchorProps}
        id={entry.id}
        role="menuitem"
        className={itemClassName}
        data-text-value={entry.textValue}
        href={entry.href}
        onClick={(event) => {
          originalClick?.(event);
          if (!event.defaultPrevented) close();
        }}
      >
        {content}
      </a>
    );
  }
  if (entry.kind === "checkbox") {
    return (
      <button
        {...entry.buttonProps}
        id={entry.id}
        role="menuitemcheckbox"
        aria-checked={entry.checked}
        className={itemClassName}
        disabled={entry.disabled}
        data-text-value={entry.textValue}
        onClick={(event) => {
          entry.onCheckedChange(!entry.checked, event);
          if (!event.defaultPrevented) close();
        }}
        type="button"
      >
        {content}
        {entry.checked ? (
          <Icon
            aria-hidden="true"
            name="Check"
            size="control"
            className="miaixz-dropdown-item-check"
          />
        ) : null}
      </button>
    );
  }
  return (
    <button
      {...entry.buttonProps}
      id={entry.id}
      role="menuitem"
      className={itemClassName}
      disabled={entry.disabled}
      data-text-value={entry.textValue}
      onClick={(event) => {
        entry.onAction(event);
        if (!event.defaultPrevented) close();
      }}
      type="button"
    >
      {content}
    </button>
  );
}

function DropdownEntryContent({ entry }: { readonly entry: DropdownPresentation }) {
  return (
    <>
      {entry.icon === undefined ? null : (
        <span className="miaixz-dropdown-item-icon">{entry.icon}</span>
      )}
      <span className="miaixz-dropdown-item-copy">
        <span className="miaixz-dropdown-item-label">{entry.label}</span>
        {entry.description === undefined ? null : (
          <span className="miaixz-dropdown-item-description">{entry.description}</span>
        )}
      </span>
    </>
  );
}

function DropdownSubmenu({ entry }: { readonly entry: DropdownSubmenuEntry }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const typeaheadRef = useRef({ value: "", time: 0 });
  useEffect(() => {
    if (open) {
      queueMicrotask(() => getMenuItems(menuRef.current)[0]?.focus({ preventScroll: true }));
    }
  }, [open]);
  return (
    <div className="miaixz-dropdown-submenu">
      <button
        ref={triggerRef}
        id={entry.id}
        role="menuitem"
        aria-expanded={open}
        aria-haspopup="menu"
        className="miaixz-dropdown-item"
        disabled={entry.disabled}
        data-text-value={entry.textValue}
        data-submenu-trigger="true"
        onClick={(event) => {
          event.preventDefault();
          setOpen((value) => !value);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") {
            event.preventDefault();
            setOpen(true);
          }
        }}
        type="button"
      >
        <DropdownEntryContent entry={entry} />
        <Icon aria-hidden="true" name="ChevronRight" size="control" />
      </button>
      {open ? (
        <div
          ref={menuRef}
          role="menu"
          className="miaixz-dropdown-submenu-content"
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft" || event.key === "Escape") {
              event.preventDefault();
              event.stopPropagation();
              setOpen(false);
              queueMicrotask(() => triggerRef.current?.focus());
              return;
            }
            handleMenuKeyDown(
              event.nativeEvent,
              event.currentTarget,
              typeaheadRef,
              () => undefined,
            );
          }}
        >
          {entry.items.map((item) => (
            <DropdownEntryView key={item.id} entry={item} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function handleMenuKeyDown(
  event: globalThis.KeyboardEvent,
  menu: HTMLElement,
  typeaheadRef: RefObject<{ value: string; time: number }>,
  close: (reason: "escape" | "outsidePress") => void,
): void {
  const items = getMenuItems(menu);
  const current = items.indexOf(menu.ownerDocument.activeElement as HTMLElement);
  let next: number | undefined;
  if (items.length > 0) {
    if (event.key === "ArrowDown") next = (current + 1) % items.length;
    if (event.key === "ArrowUp") next = (current - 1 + items.length) % items.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = items.length - 1;
  }
  if (next !== undefined && items[next] !== undefined) {
    event.preventDefault();
    items[next]?.focus({ preventScroll: true });
    return;
  }
  if (event.key === "Escape") {
    event.preventDefault();
    close("escape");
    return;
  }
  if (event.key === "Tab") {
    close("outsidePress");
    return;
  }
  if (event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey) {
    const now = Date.now();
    const state = typeaheadRef.current;
    state.value = `${now - state.time <= 500 ? state.value : ""}${event.key.toLocaleLowerCase()}`;
    state.time = now;
    const start = Math.max(0, current + 1);
    const ordered = [...items.slice(start), ...items.slice(0, start)];
    const match = ordered.find((item) =>
      item.dataset.textValue?.trim().toLocaleLowerCase().startsWith(state.value),
    );
    if (match !== undefined) {
      event.preventDefault();
      match.focus({ preventScroll: true });
    }
  }
}

function getMenuItems(menu: HTMLElement | null): HTMLElement[] {
  if (menu === null) return [];
  return Array.from(
    menu.querySelectorAll<HTMLElement>(
      '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]',
    ),
  ).filter(
    (item) =>
      item.closest('[role="menu"]') === menu &&
      !item.hasAttribute("disabled") &&
      item.getAttribute("aria-disabled") !== "true",
  );
}

function validateDropdownEntries(entries: readonly DropdownEntry[]): void {
  validateMiaixzCollectionItems(
    entries.map((entry) => ({
      id: entry.id,
      textValue: "textValue" in entry ? entry.textValue : "",
      disabled:
        entry.kind === "label" || entry.kind === "divider" || entry.kind === "radioGroup"
          ? true
          : entry.disabled,
    })),
  );
  for (const entry of entries) {
    if (entry.kind === "submenu") validateDropdownSubmenuItems(entry.items);
    if (entry.kind === "radioGroup") {
      validateMiaixzCollectionItems(
        entry.options.map((option) => ({
          id: option.id,
          value: option.value,
          textValue: option.textValue,
          disabled: option.disabled,
        })),
      );
      if (!entry.options.some((option) => option.value === entry.value)) {
        throw new MiaixzUiError({
          code: "UI_CONTROLLED_VALUE_INVALID",
        });
      }
    }
  }
}

function validateDropdownSubmenuItems(entries: readonly DropdownSubmenuItem[]): void {
  validateDropdownEntries(entries);
}

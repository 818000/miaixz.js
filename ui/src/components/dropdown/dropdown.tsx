import { forwardRef } from "react";
import type { ButtonHTMLAttributes, MouseEvent as ReactMouseEvent, ReactNode } from "react";

import { useMiaixzLocale } from "../../i18n/index.js";
import { classNames } from "../../internal/class-names.js";
import { MiaixzMenu } from "../../internal/menu/index.js";
import { Icon } from "../icon/index.js";
import { Popover } from "../popover/index.js";
import { useMiaixzPopoverContext } from "../popover/context.js";
import type { DropdownEntry, DropdownProps } from "./dropdown.types.js";

/**
 * Renders a localized Portal menu with package-owned keyboard behavior. @public
 */
export const Dropdown = forwardRef<HTMLDivElement, DropdownProps>(function Dropdown(
  { label, items, children, triggerProps, ...props },
  ref,
) {
  const { t } = useMiaixzLocale();
  return (
    <Popover
      {...props}
      ref={ref}
      triggerProps={{ ...triggerProps, "aria-haspopup": "menu" }}
      contentClassName="miaixz-dropdown-content"
    >
      <DropdownMenu label={label ?? t("ui.menu.label")}>
        {items?.map((entry, index) => <DropdownEntryView key={index} entry={entry} />) ?? children}
      </DropdownMenu>
    </Popover>
  );
});

interface DropdownMenuProps {
  /**
   * Provides the menu's accessible name.
   */
  readonly label: string;
  /**
   * Supplies menu rows.
   */
  readonly children: ReactNode;
}

interface DropdownEntryViewProps {
  /**
   * Supplies the declarative row.
   */
  readonly entry: DropdownEntry;
}

/**
 * Connects menu behavior to the owning popover.
 *
 * @param properties - Internal menu properties.
 * @returns The connected menu when popover context is available.
 * @internal
 */
function DropdownMenu(properties: DropdownMenuProps) {
  const { label, children } = properties;
  const popover = useMiaixzPopoverContext();
  if (popover === undefined) return null;
  return (
    <MiaixzMenu
      active={popover.open}
      triggerRef={popover.triggerRef}
      onRequestClose={popover.requestClose}
      aria-label={label}
      className="miaixz-dropdown-menu"
    >
      {children}
    </MiaixzMenu>
  );
}

/**
 * Renders one declarative dropdown row.
 *
 * @param properties - Internal row properties.
 * @param properties.entry - Declarative dropdown row.
 * @returns The rendered menu row.
 * @internal
 */
function DropdownEntryView(properties: DropdownEntryViewProps) {
  const { entry } = properties;
  if (entry.kind === "label") {
    return <div className="miaixz-dropdown-label">{entry.label}</div>;
  }
  if (entry.kind === "divider") return <hr className="miaixz-dropdown-divider" />;

  const { icon, description, danger = false, selected = false, className, label, ...props } = entry;
  const originalOnClick = props.onClick as
    ((event: ReactMouseEvent<HTMLAnchorElement | HTMLButtonElement>) => void) | undefined;
  const content = (
    <>
      {icon !== undefined && <span className="miaixz-dropdown-item-icon">{icon}</span>}
      <span className="miaixz-dropdown-item-copy">
        <span className="miaixz-dropdown-item-label">{label}</span>
        {description !== undefined && (
          <span className="miaixz-dropdown-item-description">{description}</span>
        )}
      </span>
      {selected && <Icon name="Check" size="control" className="miaixz-dropdown-item-check" />}
    </>
  );
  const commonProps = {
    role: "menuitem" as const,
    className: classNames(
      "miaixz-dropdown-item",
      danger && "miaixz-dropdown-item-danger",
      selected && "miaixz-dropdown-item-selected",
      className,
    ),
    onClick: (event: ReactMouseEvent<HTMLAnchorElement | HTMLButtonElement>) =>
      originalOnClick?.(event),
  };

  if ("href" in props && props.href !== undefined) {
    const { href, ...anchorProps } = props;
    return (
      <a {...anchorProps} {...commonProps} href={href}>
        {content}
      </a>
    );
  }

  const buttonProps = props as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button {...buttonProps} {...commonProps} type={buttonProps.type ?? "button"}>
      {content}
    </button>
  );
}

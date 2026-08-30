import { forwardRef } from "react";
import type {
  ButtonHTMLAttributes,
  ForwardedRef,
  MouseEvent as ReactMouseEvent,
  ReactNode,
} from "react";

import { classNames } from "../../internal/class-names.js";
import { MiaixzMenu } from "../../internal/menu/index.js";
import { useMiaixzLocale } from "../../i18n/index.js";
import { Icon } from "../icon/index.js";
import { Popover } from "../popover/index.js";
import { useMiaixzPopoverContext } from "../popover/popover-context.js";
import type {
  DropdownDividerProps,
  DropdownItemProps,
  DropdownLabelProps,
  DropdownProps,
} from "./dropdown.types.js";

/**
 * Renders a localized Portal menu with package-owned WAI-ARIA keyboard behavior.
 *
 * @public
 */
export const Dropdown = forwardRef<HTMLDivElement, DropdownProps>(function Dropdown(
  { label, children, triggerProps, ...props },
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
      <DropdownMenu label={label ?? t("ui.menu.label")}>{children}</DropdownMenu>
    </Popover>
  );
});

/**
 * Configures the composed package-internal menu rendered inside Dropdown content.
 */
interface DropdownMenuProps {
  /**
   * Supplies the accessible menu name.
   */
  readonly label: string;

  /**
   * Supplies public Dropdown item, label, and divider content.
   */
  readonly children: ReactNode;
}

/**
 * Connects the package-internal Menu behavior to its owning Popover lifecycle.
 *
 * @param props - Composed Dropdown menu content.
 * @param props.label - Accessible menu name.
 * @param props.children - Public Dropdown menu content.
 * @returns The internal menu surface.
 */
function DropdownMenu({ label, children }: DropdownMenuProps) {
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
 * Renders a menu item as a link or button with optional icon and danger tone.
 *
 * @public
 */
export const DropdownItem = forwardRef<HTMLAnchorElement | HTMLButtonElement, DropdownItemProps>(
  function DropdownItem(
    { icon, description, danger = false, selected = false, className, children, ...props },
    ref,
  ) {
    const originalOnClick = props.onClick as
      ((event: ReactMouseEvent<HTMLAnchorElement | HTMLButtonElement>) => void) | undefined;
    const content = (
      <>
        {icon !== undefined && <span className="miaixz-dropdown-item-icon">{icon}</span>}
        <span className="miaixz-dropdown-item-copy">
          <span className="miaixz-dropdown-item-label">{children}</span>
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
      onClick: (event: ReactMouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
        originalOnClick?.(event);
      },
    };

    if ("href" in props && props.href !== undefined) {
      const { href, ...anchorProps } = props;
      return (
        <a
          {...anchorProps}
          {...commonProps}
          ref={ref as ForwardedRef<HTMLAnchorElement>}
          href={href}
        >
          {content}
        </a>
      );
    }

    const buttonProps = props as ButtonHTMLAttributes<HTMLButtonElement>;
    return (
      <button
        {...buttonProps}
        {...commonProps}
        ref={ref as ForwardedRef<HTMLButtonElement>}
        type={buttonProps.type ?? "button"}
      >
        {content}
      </button>
    );
  },
);

/**
 * Renders a non-interactive label inside a dropdown menu.
 *
 * @public
 */
export const DropdownLabel = forwardRef<HTMLDivElement, DropdownLabelProps>(function DropdownLabel(
  { className, ...props },
  ref,
) {
  return <div {...props} ref={ref} className={classNames("miaixz-dropdown-label", className)} />;
});

/**
 * Separates logical groups of dropdown items.
 *
 * @public
 */
export const DropdownDivider = forwardRef<HTMLHRElement, DropdownDividerProps>(
  function DropdownDivider({ className, ...props }, ref) {
    return <hr {...props} ref={ref} className={classNames("miaixz-dropdown-divider", className)} />;
  },
);

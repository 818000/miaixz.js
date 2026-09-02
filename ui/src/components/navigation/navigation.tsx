import { forwardRef } from "react";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

import { classNames } from "../../internal/class-names.js";
import type { NavigationEntry, NavigationProps } from "./navigation.types.js";

/**
 * Renders a labeled navigation container for application links and actions.
 *
 * @public
 */
export const Navigation = forwardRef<HTMLElement, NavigationProps>(function Navigation(
  { items, variant = "default", orientation = "vertical", label, className, children, ...props },
  ref,
) {
  return (
    <nav
      {...props}
      ref={ref}
      aria-label={label}
      data-variant={variant}
      className={classNames(
        "miaixz-navigation",
        `miaixz-navigation-${orientation}`,
        variant === "rail" && "miaixz-navigation-rail",
        className,
      )}
    >
      {items?.map((item, index) => (
        <NavigationEntryView key={`${item.href ?? "action"}-${index}`} {...item} />
      )) ?? children}
    </nav>
  );
});

/**
 * Renders an active-aware navigation link or button.
 *
 * @param entry - Declarative navigation entry.
 * @returns The rendered navigation link or button.
 * @internal
 */
function NavigationEntryView(entry: NavigationEntry) {
  const { href, active = false, disabled = false, icon, label, meta, className, ...props } = entry;
  const content = (
    <>
      {icon && <span className="miaixz-navigation-icon">{icon}</span>}
      <span className="miaixz-navigation-label">{label}</span>
      {meta !== undefined && <span className="miaixz-navigation-meta">{meta}</span>}
    </>
  );
  const sharedProps = {
    "aria-current": active ? ("page" as const) : undefined,
    "aria-disabled": disabled || undefined,
    className: classNames("miaixz-navigation-item", className),
  };

  if (href !== undefined) {
    return (
      <a
        {...(props as AnchorHTMLAttributes<HTMLAnchorElement>)}
        {...sharedProps}
        href={disabled ? undefined : href}
        tabIndex={disabled ? -1 : props.tabIndex}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}
      {...sharedProps}
      type={(props as ButtonHTMLAttributes<HTMLButtonElement>).type ?? "button"}
      disabled={disabled}
    >
      {content}
    </button>
  );
}

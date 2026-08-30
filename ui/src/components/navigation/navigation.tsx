import { forwardRef } from "react";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";

import { classNames } from "../../internal/class-names.js";
import type { NavigationItemProps, NavigationProps } from "./navigation.types.js";

/**
 * Renders a labeled navigation container for application links and actions.
 *
 * @public
 */
export const Navigation = forwardRef<HTMLElement, NavigationProps>(function Navigation(
  { orientation = "vertical", label, className, children, ...props },
  ref,
) {
  return (
    <nav
      {...props}
      ref={ref}
      aria-label={label}
      className={classNames("miaixz-navigation", `miaixz-navigation-${orientation}`, className)}
    >
      {children}
    </nav>
  );
});

/**
 * Renders an active-aware navigation link or button.
 *
 * @public
 */
export const NavigationItem = forwardRef<
  HTMLAnchorElement | HTMLButtonElement,
  NavigationItemProps
>(function NavigationItem(
  { href, active = false, disabled = false, icon, label, meta, className, ...props },
  ref,
) {
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
        ref={ref as React.ForwardedRef<HTMLAnchorElement>}
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
      ref={ref as React.ForwardedRef<HTMLButtonElement>}
      type={(props as ButtonHTMLAttributes<HTMLButtonElement>).type ?? "button"}
      disabled={disabled}
    >
      {content}
    </button>
  );
});

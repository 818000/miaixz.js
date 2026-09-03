import { forwardRef } from "react";

import { classNames } from "../../internal/class-names.js";
import { useMiaixzLocale } from "../../i18n/index.js";
import { Icon } from "../icon/index.js";
import type { ButtonProps } from "./button.types.js";

/**
 * Renders an accessible action button with shared variants, sizes, and loading state.
 *
 * @public
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "secondary",
    size = "medium",
    block = false,
    loading = false,
    loadingLabel,
    iconOnly = false,
    startIcon,
    endIcon,
    className,
    disabled,
    type = "button",
    children,
    ...props
  },
  ref,
) {
  const { t } = useMiaixzLocale();
  const resolvedLoadingLabel = loadingLabel ?? t("ui.loading");
  return (
    <button
      {...props}
      ref={ref}
      type={type}
      title={props.title ?? (iconOnly ? props["aria-label"] : undefined)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      data-loading={loading || undefined}
      data-variant={variant}
      data-size={size}
      className={classNames(
        "miaixz-control",
        "miaixz-button",
        `miaixz-control-${size}`,
        `miaixz-button-${variant}`,
        block && "miaixz-control-block",
        iconOnly && "miaixz-button-icon-only",
        iconOnly && "miaixz-link-no-underline",
        className,
      )}
    >
      {loading ? (
        variant === "refresh" ? (
          <>
            <span className="miaixz-button-label">{resolvedLoadingLabel}</span>
            <span className="miaixz-button-icon">
              <Icon name="LoaderCircle" size="control" className="miaixz-button-spinner" />
            </span>
          </>
        ) : (
          <>
            <Icon name="LoaderCircle" size="control" className="miaixz-button-spinner" />
            <span className={iconOnly ? "miaixz-hidden" : undefined}>{resolvedLoadingLabel}</span>
          </>
        )
      ) : (
        <>
          {startIcon && <span className="miaixz-button-icon">{startIcon}</span>}
          {!iconOnly && <span className="miaixz-button-label">{children}</span>}
          {iconOnly && <span className="miaixz-button-icon">{children}</span>}
          {endIcon && <span className="miaixz-button-icon">{endIcon}</span>}
        </>
      )}
    </button>
  );
});

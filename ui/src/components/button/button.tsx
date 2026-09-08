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

import { forwardRef } from "react";

import { classNames } from "../../shared/class-names.js";
import { useMiaixzLocale } from "../../i18n/index.js";
import { Icon } from "../icon/index.js";
import type { ButtonProps, ButtonStyleOptions, ButtonVariant } from "./button.types.js";

const directContentVariants = new Set<ButtonVariant>([
  "action",
  "action-primary",
  "favorite",
  "choice",
  "plain",
  "plain-primary",
  "text",
  "text-danger",
  "navigation",
]);

/**
 * Returns the complete shared visual recipe without imposing a framework or element.
 *
 * @param root0 - Framework-independent button style options.
 * @param root0.variant - Visual and semantic treatment.
 * @param root0.size - Control size for framed recipes.
 * @param root0.block - Whether the recipe fills its container.
 * @param root0.iconOnly - Whether the recipe presents icon-only content.
 * @param root0.className - Optional consumer class appended to the recipe.
 * @returns A complete class name suitable for a button or semantic link.
 * @public
 */
export function getButtonClassName({
  variant = "secondary",
  size = "medium",
  block = false,
  iconOnly = false,
  className,
}: ButtonStyleOptions = {}): string {
  if (directContentVariants.has(variant)) {
    return classNames(`miaixz-button-${variant}`, block && "miaixz-control-block", className);
  }
  return classNames(
    "miaixz-control",
    "miaixz-button",
    `miaixz-control-${size}`,
    `miaixz-button-${variant}`,
    block && "miaixz-control-block",
    iconOnly && "miaixz-button-icon-only",
    iconOnly && "miaixz-link-no-underline",
    className,
  );
}

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
      className={getButtonClassName({
        variant,
        size,
        block,
        iconOnly,
        ...(className !== undefined ? { className } : {}),
      })}
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
          {!iconOnly &&
            (directContentVariants.has(variant) ? (
              children
            ) : (
              <span className="miaixz-button-label">{children}</span>
            ))}
          {iconOnly && <span className="miaixz-button-icon">{children}</span>}
          {endIcon && <span className="miaixz-button-icon">{endIcon}</span>}
        </>
      )}
    </button>
  );
});

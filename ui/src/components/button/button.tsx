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

import { useMiaixzLocale } from "../../i18n/index.js";
import { classNames } from "../../shared/class-names.js";
import { Icon } from "../icon/index.js";
import type { ButtonLinkProps, ButtonProps } from "./button.types.js";

/**
 * Renders the fixed label and optional framework-owned icons.
 *
 * @param properties - Label and icon content.
 * @returns The shared framed action content.
 */
function ButtonContent(properties: Pick<ButtonProps, "children" | "startIcon" | "endIcon">) {
  const { children, startIcon, endIcon } = properties;
  return (
    <>
      {startIcon !== undefined && (
        <span className="miaixz-button-icon">
          <Icon name={startIcon} size="control" />
        </span>
      )}
      <span className="miaixz-button-label">{children}</span>
      {endIcon !== undefined && (
        <span className="miaixz-button-icon">
          <Icon name={endIcon} size="control" />
        </span>
      )}
    </>
  );
}

/**
 * Renders one of the three permitted labeled command buttons. @public
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "secondary",
    size = "medium",
    block = false,
    loading = false,
    loadingLabel,
    startIcon,
    endIcon,
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
      disabled={disabled === true || loading}
      aria-busy={loading || undefined}
      data-loading={loading || undefined}
      data-miaixz-ripple="true"
      data-variant={variant}
      data-size={size}
      className={classNames(
        "miaixz-interactive",
        "miaixz-control",
        "miaixz-button",
        `miaixz-control-${size}`,
        `miaixz-button-${variant}`,
        block && "miaixz-control-block",
      )}
    >
      {loading ? (
        <>
          <Icon name="LoaderCircle" size="control" className="miaixz-button-spinner" />
          <span className="miaixz-button-label">{resolvedLoadingLabel}</span>
        </>
      ) : (
        <ButtonContent
          {...(startIcon === undefined ? {} : { startIcon })}
          {...(endIcon === undefined ? {} : { endIcon })}
        >
          {children}
        </ButtonContent>
      )}
    </button>
  );
});

/**
 * Renders a real navigation target with one of the three framed treatments. @public
 */
export const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(function ButtonLink(
  {
    variant = "secondary",
    size = "medium",
    block = false,
    startIcon,
    endIcon,
    href,
    children,
    ...props
  },
  ref,
) {
  return (
    <a
      {...props}
      ref={ref}
      className={classNames(
        "miaixz-interactive",
        "miaixz-control",
        "miaixz-button",
        `miaixz-control-${size}`,
        `miaixz-button-${variant}`,
        block && "miaixz-control-block",
      )}
      data-size={size}
      data-miaixz-ripple="true"
      data-variant={variant}
      href={href}
    >
      <ButtonContent
        {...(startIcon === undefined ? {} : { startIcon })}
        {...(endIcon === undefined ? {} : { endIcon })}
      >
        {children}
      </ButtonContent>
    </a>
  );
});

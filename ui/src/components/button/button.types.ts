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

import type { ButtonHTMLAttributes, ReactNode } from "react";

/**
 * Defines the visual and semantic treatment of a button.
 *
 * @public
 */
export type ButtonVariant =
  | "action"
  | "action-primary"
  | "favorite"
  | "framed-icon"
  | "choice"
  | "navigation"
  | "plain"
  | "plain-primary"
  | "text"
  | "text-danger"
  | "danger"
  | "danger-link"
  | "ghost"
  | "link"
  | "outline"
  | "primary"
  | "refresh"
  | "secondary";

/**
 * Defines the supported button control sizes.
 *
 * @public
 */
export type ButtonSize = "small" | "medium" | "large";

/**
 * Configures framework-independent styling shared by buttons and semantic links.
 *
 * @public
 */
export interface ButtonStyleOptions {
  /**
   * Selects the visual and semantic treatment.
   *
   * @defaultValue `"secondary"`
   */
  variant?: ButtonVariant;
  /**
   * Selects the control size for framed recipes.
   *
   * @defaultValue `"medium"`
   */
  size?: ButtonSize;
  /**
   * Expands the recipe to the width of its container.
   *
   * @defaultValue `false`
   */
  block?: boolean;
  /**
   * Applies icon-only structure without changing the selected variant.
   *
   * @defaultValue `false`
   */
  iconOnly?: boolean;
  /**
   * Appends a consumer-owned class without replacing the public recipe.
   */
  className?: string;
}

/**
 * Defines properties shared by all Miaixz button variants.
 *
 * @public
 */
export interface MiaixzButtonBaseProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> {
  /**
   * Selects the visual and semantic treatment.
   *
   * @defaultValue `"secondary"`
   */
  variant?: ButtonVariant;
  /**
   * Selects the button control size.
   *
   * @defaultValue `"medium"`
   */
  size?: ButtonSize;
  /**
   * Expands the button to the width of its container.
   *
   * @defaultValue `false`
   */
  block?: boolean;
  /**
   * Disables interaction and displays progress feedback.
   *
   * @defaultValue `false`
   */
  loading?: boolean;
  /**
   * Overrides the localized loading announcement.
   */
  loadingLabel?: string;
  /**
   * Displays content before the button label.
   */
  startIcon?: ReactNode;
  /**
   * Displays content after the button label.
   */
  endIcon?: ReactNode;
}

/**
 * Configures a labeled Miaixz button.
 *
 * @public
 */
export interface MiaixzButtonWithContentProps extends MiaixzButtonBaseProps {
  /**
   * Keeps the visible label presentation enabled.
   *
   * @defaultValue `false`
   */
  iconOnly?: false;
  /**
   * Supplies the visible button label.
   */
  children: ReactNode;
}

/**
 * Configures an accessible icon-only Miaixz button.
 *
 * @public
 */
export interface MiaixzIconOnlyButtonProps extends MiaixzButtonBaseProps {
  /**
   * Enables an icon-only action while the selected variant controls whether the
   * action is framed. Keeps the control hit area and keyboard-only focus treatment;
   * the accessible name is also used as the title unless a title is supplied.
   */
  iconOnly: true;
  /**
   * Provides the required accessible name for an icon-only button.
   */
  "aria-label": string;
  /**
   * Supplies the icon-only button content.
   */
  children: ReactNode;
}

/**
 * Configures either a labeled or an icon-only action button.
 *
 * @public
 */
export type ButtonProps = MiaixzButtonWithContentProps | MiaixzIconOnlyButtonProps;

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

import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

import type { MiaixzIconName } from "../../icons/index.js";

/**
 * Defines the three permitted visual button treatments. @public
 */
export type ButtonVariant = "primary" | "secondary" | "danger";

/**
 * Defines the supported framed-control sizes. @public
 */
export type ButtonSize = "small" | "medium" | "large";

/**
 * Configures a labeled command button. @public
 */
export interface ButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "className" | "style"
> {
  /**
   * Supplies the visible button label.
   */
  readonly children: ReactNode;
  /**
   * Selects one of the three framed treatments. @defaultValue `"secondary"`
   */
  readonly variant?: ButtonVariant;
  /**
   * Selects the shared control height. @defaultValue `"medium"`
   */
  readonly size?: ButtonSize;
  /**
   * Expands the button to the width of its container. @defaultValue `false`
   */
  readonly block?: boolean;
  /**
   * Disables interaction and displays progress feedback. @defaultValue `false`
   */
  readonly loading?: boolean;
  /**
   * Overrides the localized loading announcement.
   */
  readonly loadingLabel?: string;
  /**
   * Displays one framework-owned leading icon.
   */
  readonly startIcon?: MiaixzIconName;
  /**
   * Displays one framework-owned trailing icon.
   */
  readonly endIcon?: MiaixzIconName;
}

/**
 * Configures a real navigation link with framed button presentation. @public
 */
export interface ButtonLinkProps extends Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  "children" | "className" | "style" | "href"
> {
  /**
   * Supplies the real navigation destination.
   */
  readonly href: string;
  /**
   * Supplies the visible link label.
   */
  readonly children: ReactNode;
  /**
   * Selects one of the three framed treatments. @defaultValue `"secondary"`
   */
  readonly variant?: ButtonVariant;
  /**
   * Selects the shared control height. @defaultValue `"medium"`
   */
  readonly size?: ButtonSize;
  /**
   * Expands the link to the width of its container. @defaultValue `false`
   */
  readonly block?: boolean;
  /**
   * Displays one framework-owned leading icon.
   */
  readonly startIcon?: MiaixzIconName;
  /**
   * Displays one framework-owned trailing icon.
   */
  readonly endIcon?: MiaixzIconName;
}

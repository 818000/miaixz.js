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

import type { DialogHTMLAttributes, HTMLAttributes, ReactNode } from "react";

/**
 * Defines the supported drawer widths.
 *
 * @public
 */
export type DrawerSize = "small" | "medium" | "large" | "xlarge" | "wide";

/**
 * Defines the supported drawer content densities.
 *
 * @public
 */
export type DrawerDensity = "default" | "compact" | "content";

/**
 * Defines logical insets inside the selected overlay boundary.
 *
 * @public
 */
export interface DrawerInset {
  /**
   * Applies the same nonnegative inset to the block start and end edges.
   */
  readonly block?: number;
  /**
   * Applies the same nonnegative inset to the inline start and end edges.
   */
  readonly inline?: number;
}

/**
 * Defines the viewport edge from which a drawer opens.
 *
 * @public
 */
export type DrawerPlacement = "left" | "right" | "bottom";

/**
 * Configures a controlled native modal drawer.
 *
 * @public
 */
export interface DrawerProps extends Omit<
  DialogHTMLAttributes<HTMLDialogElement>,
  "open" | "title"
> {
  /**
   * Sets an explicit positive finite width in CSS pixels, overriding size.
   * Choose from DRAWER_WIDTHS or supply a custom width. The rendered width is
   * clamped to the viewport or boundary without changing density or typography.
   * Bottom drawers remain full width.
   */
  width?: number;
  /**
   * Uses an element as the overlay boundary; `undefined` uses the viewport and `null` waits.
   */
  boundary?: HTMLElement | null;
  /**
   * Applies nonnegative finite insets in CSS pixels.
   *
   * @defaultValue `0`
   */
  inset?: number | DrawerInset;
  /**
   * Adds the existing border and panel radius for inset content drawers.
   *
   * @defaultValue `false`
   */
  floating?: boolean;
  /**
   * Extends the body element without exposing overlay positioning.
   */
  bodyProps?: HTMLAttributes<HTMLDivElement>;
  /**
   * Controls whether the drawer is open.
   */
  open: boolean;
  /**
   * Receives requested open-state changes.
   */
  onOpenChange: (open: boolean) => void;
  /**
   * Supplies the drawer heading.
   */
  title: ReactNode;
  /**
   * Supplies supporting drawer description content.
   */
  description?: ReactNode;
  /**
   * Supplies the drawer action footer.
   */
  footer?: ReactNode;
  /**
   * Selects the drawer width.
   *
   * @defaultValue `"medium"`
   */
  size?: DrawerSize;
  /**
   * Selects standard or compact drawer chrome and content padding.
   *
   * @defaultValue `"default"`
   */
  density?: DrawerDensity;
  /**
   * Selects the viewport edge used by the drawer.
   *
   * @defaultValue `"right"`
   */
  placement?: DrawerPlacement;
  /**
   * Overrides the localized close-button label.
   */
  closeLabel?: string;
  /**
   * Controls whether the close button is rendered.
   *
   * @defaultValue `true`
   */
  showClose?: boolean;
  /**
   * Allows a backdrop click to request closure.
   *
   * @defaultValue `true`
   */
  closeOnBackdrop?: boolean;
}

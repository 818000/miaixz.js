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

import type { MiaixzThemeColorToken } from "./colors.js";

/**
 * Defines one semantic surface through color-token references.
 *
 * @public
 */
export interface MiaixzThemeSurface {
  /**
   * Surface background token.
   */
  readonly background?: MiaixzThemeColorToken;
  /**
   * Surface foreground token.
   */
  readonly foreground?: MiaixzThemeColorToken;
  /**
   * Surface border token.
   */
  readonly border?: MiaixzThemeColorToken;
}

/**
 * Defines the seven semantic surface roles.
 *
 * @public
 */
export interface MiaixzThemeSurfaces {
  /**
   * Page surface.
   */
  readonly page?: MiaixzThemeSurface;
  /**
   * Header surface.
   */
  readonly header?: MiaixzThemeSurface;
  /**
   * Sidebar surface.
   */
  readonly sidebar?: MiaixzThemeSurface;
  /**
   * Panel surface.
   */
  readonly panel?: MiaixzThemeSurface;
  /**
   * Control surface.
   */
  readonly control?: MiaixzThemeSurface;
  /**
   * Overlay surface.
   */
  readonly overlay?: MiaixzThemeSurface;
  /**
   * Selected surface.
   */
  readonly selected?: MiaixzThemeSurface;
}

/**
 * Freezes semantic surface role order.
 *
 * @public
 */
export const miaixzThemeSurfaceRoles = [
  "page",
  "header",
  "sidebar",
  "panel",
  "control",
  "overlay",
  "selected",
] as const;

/**
 * Freezes the field order within every semantic surface.
 *
 * @public
 */
export const miaixzThemeSurfaceFields = ["background", "foreground", "border"] as const;

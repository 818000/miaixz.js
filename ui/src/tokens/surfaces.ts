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

import type { LucideIcon, LucideProps } from "lucide-react";

import type { MiaixzIconName } from "../../icons/icon-names.js";

/**
 * Defines semantic icon sizes managed by the design system.
 *
 * @public
 */
export type IconSize = "indicator" | "inline" | "control" | "navigation" | "feature" | "display";

/**
 * Defines the supported semantic icon stroke weights.
 *
 * @public
 */
export type IconStroke = "regular" | "strong";

/**
 * Configures a registered Lucide icon.
 *
 * @public
 */
export interface IconProps extends Omit<LucideProps, "children" | "name" | "ref" | "size"> {
  /**
   * Selects an icon from the Miaixz icon registry.
   */
  readonly name: MiaixzIconName;
  /**
   * Selects a semantic size or supplies a native Lucide size.
   *
   * @defaultValue `"inline"`
   */
  readonly size?: IconSize | number | string;
  /**
   * Selects the semantic stroke weight.
   *
   * @defaultValue `"regular"`
   */
  readonly stroke?: IconStroke;
  /**
   * Provides an accessible name for a meaningful icon.
   */
  readonly label?: string;
}

/**
 * Configures an explicitly supplied project icon without modifying the Miaixz registry.
 *
 * @public
 */
export interface CustomIconProps extends Omit<LucideProps, "children" | "name" | "ref" | "size"> {
  /**
   * Supplies the statically imported Lucide component to render.
   */
  readonly icon: LucideIcon;
  /**
   * Selects a semantic size or supplies a native Lucide size.
   *
   * @defaultValue `"inline"`
   */
  readonly size?: IconSize | number | string;
  /**
   * Selects the semantic stroke weight.
   *
   * @defaultValue `"regular"`
   */
  readonly stroke?: IconStroke;
  /**
   * Provides an accessible, localized name for a meaningful icon.
   */
  readonly label?: string;
}

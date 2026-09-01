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

interface MiaixzIconBaseProps extends Omit<LucideProps, "children" | "name" | "ref" | "size"> {
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
 * Configures a registered or explicitly supplied Lucide icon. @public
 */
export type IconProps = MiaixzIconBaseProps &
  (
    | {
        /**
         * Selects an icon registered by the design system.
         */
        readonly name: MiaixzIconName;
        /**
         * Prevents combining a registered name with a custom icon.
         */
        readonly icon?: never;
      }
    | {
        /**
         * Supplies a custom Lucide icon component.
         */
        readonly icon: LucideIcon;
        /**
         * Prevents combining a custom icon with a registered name.
         */
        readonly name?: never;
      }
  );

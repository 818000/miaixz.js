import type { HTMLAttributes } from "react";

/**
 * Defines properties owned by the Miaixz Divider contract.
 *
 * @public
 */
export interface MiaixzDividerOwnProps {
  /**
   * Selects the separator axis.
   *
   * @defaultValue `"horizontal"`
   */
  readonly orientation?: "horizontal" | "vertical";
}

/**
 * Configures a semantic horizontal or vertical separator.
 *
 * @public
 */
export interface DividerProps
  extends
    Omit<HTMLAttributes<HTMLDivElement>, keyof MiaixzDividerOwnProps>,
    MiaixzDividerOwnProps {}

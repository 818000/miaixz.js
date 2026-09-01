import type { HTMLAttributes, ReactNode } from "react";

/**
 * Defines properties owned by the Miaixz Overlay contract.
 *
 * @public
 */
export interface MiaixzOverlayOwnProps {
  /**
   * Controls whether the loading surface is present.
   */
  readonly active: boolean;

  /**
   * Supplies the required localized accessible loading label.
   */
  readonly label: string;

  /**
   * Supplies content that remains mounted while loading.
   */
  readonly children: ReactNode;
}

/**
 * Configures a loading surface that preserves its child content.
 *
 * @public
 */
export interface OverlayProps
  extends
    Omit<HTMLAttributes<HTMLDivElement>, keyof MiaixzOverlayOwnProps>,
    MiaixzOverlayOwnProps {}

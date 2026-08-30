import type { HTMLAttributes, ReactNode } from "react";

/**
 * Defines properties owned by the Miaixz LoadingOverlay contract.
 *
 * @public
 */
export interface MiaixzLoadingOverlayOwnProps {
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
export interface LoadingOverlayProps
  extends
    Omit<HTMLAttributes<HTMLDivElement>, keyof MiaixzLoadingOverlayOwnProps>,
    MiaixzLoadingOverlayOwnProps {}

import type { DialogHTMLAttributes, ReactNode } from "react";

/**
 * Defines the supported drawer widths.
 *
 * @public
 */
export type DrawerSize = "small" | "medium" | "large";

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

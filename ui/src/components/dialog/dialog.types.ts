import type { DialogHTMLAttributes, ReactNode } from "react";

/**
 * Defines the supported modal dialog widths.
 *
 * @public
 */
export type DialogSize = "small" | "medium" | "large";

/**
 * Configures a controlled native modal dialog.
 *
 * @public
 */
export interface DialogProps extends Omit<
  DialogHTMLAttributes<HTMLDialogElement>,
  "open" | "title"
> {
  /**
   * Controls whether the dialog is open.
   */
  open: boolean;
  /**
   * Receives requested open-state changes.
   */
  onOpenChange: (open: boolean) => void;
  /**
   * Supplies the dialog heading.
   */
  title: ReactNode;
  /**
   * Supplies supporting dialog description content.
   */
  description?: ReactNode;
  /**
   * Supplies the dialog action footer.
   */
  footer?: ReactNode;
  /**
   * Selects the dialog width.
   *
   * @defaultValue `"medium"`
   */
  size?: DialogSize;
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

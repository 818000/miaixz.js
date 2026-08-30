import type { ReactNode } from "react";

/**
 * Defines the semantic treatment of a confirmation action.
 *
 * @public
 */
export type ConfirmDialogTone = "normal" | "danger";

/**
 * Configures a controlled confirmation dialog without exposing native dialog attributes.
 *
 * @public
 */
export interface ConfirmDialogProps {
  /**
   * Controls whether the confirmation dialog is open.
   */
  open: boolean;
  /**
   * Receives accepted open-state changes.
   */
  onOpenChange: (open: boolean) => void;
  /**
   * Supplies the confirmation heading.
   */
  title: ReactNode;
  /**
   * Supplies the confirmation description.
   */
  description: ReactNode;
  /**
   * Supplies the visible confirmation action label.
   */
  confirmLabel: string;
  /**
   * Supplies the visible cancellation action label.
   */
  cancelLabel: string;
  /**
   * Selects the normal or destructive confirmation treatment.
   *
   * @defaultValue `"normal"`
   */
  tone?: ConfirmDialogTone;
  /**
   * Requires an exact internally managed text entry before confirmation.
   */
  confirmationText?: string;
  /**
   * Disables dismissal and actions while an externally managed operation is pending.
   *
   * @defaultValue `false`
   */
  pending?: boolean;
  /**
   * Supplies an already localized failure message.
   */
  error?: ReactNode;
  /**
   * Runs the confirmation action synchronously or asynchronously.
   */
  onConfirm: () => void | Promise<void>;
}

import type { HTMLAttributes, ReactNode } from "react";

/**
 * Defines the semantic treatment and live-region priority of a toast. @public
 */
export type ToastTone = "neutral" | "success" | "warning" | "danger" | "info";

/**
 * Configures a rendered toast notification. @public
 */
export interface ToastProps extends Omit<HTMLAttributes<HTMLDivElement>, "id" | "title"> {
  /**
   * Uniquely identifies the toast.
   */
  id: string;
  /**
   * Supplies the notification title.
   */
  title: ReactNode;
  /**
   * Supplies supporting notification content.
   */
  message?: ReactNode;
  /**
   * Displays an optional action.
   */
  action?: ReactNode;
  /**
   * Selects the semantic visual treatment.
   */
  tone?: ToastTone;
  /**
   * Provides the dismiss button's accessible label.
   */
  dismissLabel?: string;
  /**
   * Runs when the toast is dismissed.
   */
  onDismiss?: (id: string) => void;
}

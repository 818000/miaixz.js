import type { HTMLAttributes, ReactNode } from "react";

/**
 * Defines the semantic treatment and live-region priority of a toast.
 *
 * @public
 */
export type ToastTone = "neutral" | "success" | "warning" | "danger" | "info";

/**
 * Configures a notification submitted to the toast provider.
 *
 * @public
 */
export interface ToastOptions {
  /**
   * Supplies a stable identifier for replacing or dismissing the toast.
   */
  id?: string;
  /**
   * Supplies the required notification title.
   */
  title: ReactNode;
  /**
   * Supplies optional notification detail content.
   */
  message?: ReactNode;
  /**
   * Displays an optional notification action.
   */
  action?: ReactNode;
  /**
   * Selects the semantic notification treatment.
   *
   * @defaultValue `"neutral"`
   */
  tone?: ToastTone;
  /**
   * Sets the auto-dismiss delay in milliseconds, or disables it with zero.
   */
  duration?: number;
  /**
   * Overrides the localized dismissal label.
   */
  dismissLabel?: string;
}

/**
 * Represents a toast with its required provider-assigned identifier.
 *
 * @public
 */
export interface ToastRecord extends ToastOptions {
  /**
   * Identifies the toast within the provider queue.
   */
  id: string;
}

/**
 * Configures a rendered toast notification.
 *
 * @public
 */
export interface ToastProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "id" | "title">, ToastRecord {
  /**
   * Receives a request to dismiss the identified toast.
   */
  onDismiss?: (id: string) => void;
}

/**
 * Configures the application toast queue provider.
 *
 * @public
 */
export interface ToastProviderProps {
  /**
   * Supplies the application subtree that can submit notifications.
   */
  children: ReactNode;
  /**
   * Sets the fallback auto-dismiss delay in milliseconds.
   *
   * @defaultValue `5000`
   */
  defaultDuration?: number;
}

/**
 * Exposes imperative operations for the nearest toast queue.
 *
 * @public
 */
export interface ToastContextValue {
  /**
   * Adds or replaces a toast and returns its identifier.
   */
  notify: (options: ToastOptions) => string;
  /**
   * Dismisses one toast by identifier.
   */
  dismiss: (id: string) => void;
  /**
   * Dismisses every toast in the queue.
   */
  dismissAll: () => void;
}

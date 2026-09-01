import type { ReactNode } from "react";
import type { ToastTone } from "../toast/index.js";

/**
 * Configures a notification submitted to the toaster. @public
 */
export interface ToastOptions {
  /**
   * Reuses a stable identifier or allows one to be generated.
   */
  id?: string;
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
   * Sets the automatic dismissal delay in milliseconds.
   */
  duration?: number;
  /**
   * Provides the dismiss button's accessible label.
   */
  dismissLabel?: string;
}

/**
 * Represents a toast with its assigned identifier. @public
 */
export interface ToastRecord extends ToastOptions {
  /**
   * Stores the assigned toast identifier.
   */
  id: string;
}

/**
 * Configures the application toast queue. @public
 */
export interface ToasterProps {
  /**
   * Supplies the application subtree that can access the queue.
   */
  children: ReactNode;
  /**
   * Sets the default automatic dismissal delay in milliseconds.
   */
  defaultDuration?: number;
}

/**
 * Exposes imperative operations for the nearest toast queue. @public
 */
export interface ToastContextValue {
  /**
   * Adds or replaces a notification and returns its identifier.
   */
  notify: (options: ToastOptions) => string;
  /**
   * Removes one notification by identifier.
   */
  dismiss: (id: string) => void;
  /**
   * Removes all queued notifications.
   */
  dismissAll: () => void;
}

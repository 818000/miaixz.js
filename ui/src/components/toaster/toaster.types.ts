/*
 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
 ~                                                                           ~
 ~ Copyright (c) 2015-2026 miaixz.org and other contributors.                ~
 ~                                                                           ~
 ~ Licensed under the Apache License, Version 2.0 (the "License");           ~
 ~ you may not use this file except in compliance with the License.          ~
 ~ You may obtain a copy of the License at                                   ~
 ~                                                                           ~
 ~      https://www.apache.org/licenses/LICENSE-2.0                          ~
 ~                                                                           ~
 ~ Unless required by applicable law or agreed to in writing, software       ~
 ~ distributed under the License is distributed on an "AS IS" BASIS,         ~
 ~ WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  ~
 ~ See the License for the specific language governing permissions and       ~
 ~ limitations under the License.                                            ~
 ~                                                                           ~
 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
*/

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

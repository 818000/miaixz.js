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

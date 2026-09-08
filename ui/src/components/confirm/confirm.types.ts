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

/**
 * Defines the semantic treatment of a confirmation action.
 *
 * @public
 */
export type ConfirmTone = "normal" | "danger";

/**
 * Configures a controlled confirmation dialog without exposing native dialog attributes.
 *
 * @public
 */
export interface ConfirmProps {
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
  tone?: ConfirmTone;
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

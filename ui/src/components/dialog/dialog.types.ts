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

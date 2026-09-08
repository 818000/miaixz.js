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

import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

/**
 * Configures a Portal-backed fixed popover.
 *
 * @public
 */
export interface PopoverProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Selects a compact picker surface without changing default overlays.
   *
   * @defaultValue `"default"`
   */
  surface?: "default" | "picker";
  /**
   * Supplies the visible disclosure trigger.
   */
  trigger: ReactNode;
  /**
   * Controls the open state when supplied.
   */
  open?: boolean;
  /**
   * Sets the initial uncontrolled open state.
   *
   * @defaultValue `false`
   */
  defaultOpen?: boolean;
  /**
   * Receives requested open-state changes.
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * Selects the popover placement relative to its trigger.
   *
   * @defaultValue `"bottom-start"`
   */
  placement?: "bottom-start" | "bottom-end" | "top-start" | "top-end";
  /**
   * Supplies a finite non-negative distance from the trigger.
   *
   * @defaultValue `8`
   */
  offset?: number;
  /**
   * Adds a class to the popover content surface.
   */
  contentClassName?: string;
  /**
   * Supplies native attributes for the button trigger.
   */
  triggerProps?: ButtonHTMLAttributes<HTMLButtonElement>;
  /**
   * Selects a formal visual treatment for the disclosure trigger.
   *
   * @defaultValue `"default"`
   */
  triggerVariant?: "default" | "avatar" | "plain" | "text" | "action";
  /**
   * Prevents disclosure interaction.
   *
   * @defaultValue `false`
   */
  disabled?: boolean;
}

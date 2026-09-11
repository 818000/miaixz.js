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

import type { HTMLAttributes, ReactElement, ReactNode } from "react";

/**
 * Defines the native semantics Popover merges into its standard trigger.
 */
export interface PopoverTriggerProps {
  /**
   * Associates the trigger with the rendered surface.
   */
  readonly "aria-controls"?: string;
  /**
   * Reports whether a non-button trigger is unavailable.
   */
  readonly "aria-disabled"?: boolean | "false" | "true";
  /**
   * Reports whether the rendered surface is open.
   */
  readonly "aria-expanded"?: boolean | "false" | "true";
  /**
   * Describes the kind of popup controlled by the trigger.
   */
  readonly "aria-haspopup"?: boolean | "dialog" | "grid" | "listbox" | "menu" | "tree";
  /**
   * Prevents interaction when the trigger is a native button.
   */
  readonly disabled?: boolean;
  /**
   * Identifies the trigger for accessibility relationships.
   */
  readonly id?: string;
}

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
   * Supplies the visible disclosure trigger. Native buttons and anchors are supported.
   */
  trigger: ReactElement<PopoverTriggerProps>;
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
}

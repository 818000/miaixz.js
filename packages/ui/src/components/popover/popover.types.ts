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

/**
 * Defines the popover public type contracts.
 */

import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  ReactElement,
  ReactNode,
  RefAttributes,
} from "react";
import type { MiaixzSlotProps } from "../../shared/slots.js";

/**
 * Popover change notification reasons permitted by the component contract.
 */
export type PopoverChangeReason = "trigger" | "escape" | "outsidePress";
/**
 * Popover accessible popup roles permitted by the component contract.
 */
export type PopoverPopupRole = "dialog" | "menu" | "listbox" | "tree" | "grid";
/**
 * Popover controlled or uncontrolled open-state alternatives permitted by the component contract.
 */
export type PopoverOpenState =
  | {
      readonly open: boolean;
      readonly defaultOpen?: never;
      readonly onOpenChange: (open: boolean, reason: PopoverChangeReason) => void;
    }
  | {
      readonly open?: never;
      readonly defaultOpen?: boolean;
      readonly onOpenChange?: (open: boolean, reason: PopoverChangeReason) => void;
    };
/**
 * Properties accepted by the Popover Trigger renderer.
 */
export type PopoverTriggerProps = ButtonHTMLAttributes<HTMLButtonElement> &
  RefAttributes<HTMLButtonElement> & {
    readonly "data-dropdown-presentation"?: "default" | "user-menu" | "account" | "action-menu";
  };
/**
 * Named Popover parts available for slot and style customization.
 */
export type PopoverSlot = "trigger" | "content";
/**
 * Resolved Popover state exposed to theme and slot overrides.
 */
export interface PopoverOwnerState {
  readonly open: boolean;
  readonly placement:
    "bottom-start" | "bottom-end" | "top-start" | "top-end" | "right-start" | "left-start";
  readonly popupRole?: PopoverPopupRole;
}
/**
 * Per-slot attributes and state-dependent override callbacks for Popover.
 */
export interface PopoverSlotProps {
  readonly trigger?: MiaixzSlotProps<PopoverOwnerState, PopoverTriggerProps>;
  readonly content?: MiaixzSlotProps<PopoverOwnerState, HTMLAttributes<HTMLDivElement>>;
}
/**
 * Properties accepted by the Popover renderer.
 */
export type PopoverProps = PopoverOpenState & {
  readonly trigger: ReactElement<PopoverTriggerProps>;
  readonly children: ReactNode;
  readonly placement?:
    "bottom-start" | "bottom-end" | "top-start" | "top-end" | "right-start" | "left-start";
  readonly offset?: number;
  readonly popupRole?: PopoverPopupRole;
  readonly slotProps?: PopoverSlotProps;
};

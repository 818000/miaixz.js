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
 * Defines the tooltip public type contracts.
 */

import type { HTMLAttributes, ReactElement, RefAttributes } from "react";
import type { MiaixzSlotProps } from "../../shared/slots.js";

/**
 * Properties accepted by the Tooltip Trigger renderer.
 */
export interface MiaixzTooltipTriggerProps
  extends HTMLAttributes<HTMLElement>, RefAttributes<HTMLElement> {
  readonly disabled?: boolean;
  readonly "aria-describedby"?: string;
}
/**
 * Tooltip controlled or uncontrolled open-state alternatives permitted by the component contract.
 */
export type TooltipOpenState =
  | {
      readonly open: boolean;
      readonly defaultOpen?: never;
      readonly onOpenChange: (open: boolean) => void;
    }
  | {
      readonly open?: never;
      readonly defaultOpen?: boolean;
      readonly onOpenChange?: (open: boolean) => void;
    };
/**
 * Named Tooltip parts available for slot and style customization.
 */
export type TooltipSlot = "trigger" | "content";
/**
 * Resolved Tooltip state exposed to theme and slot overrides.
 */
export interface TooltipOwnerState {
  readonly open: boolean;
  readonly placement: "top" | "right" | "bottom" | "left";
  readonly disabledTrigger: boolean;
}
/**
 * Per-slot attributes and state-dependent override callbacks for Tooltip.
 */
export interface TooltipSlotProps {
  readonly trigger?: MiaixzSlotProps<TooltipOwnerState, MiaixzTooltipTriggerProps>;
  readonly content?: MiaixzSlotProps<TooltipOwnerState, HTMLAttributes<HTMLSpanElement>>;
}
/**
 * Properties accepted by the Tooltip renderer.
 */
export type TooltipProps = TooltipOpenState & {
  readonly content: string | number;
  readonly children: ReactElement<MiaixzTooltipTriggerProps>;
  readonly placement?: "top" | "right" | "bottom" | "left";
  readonly enterDelay?: number;
  readonly leaveDelay?: number;
  readonly enterTouchDelay?: number;
  readonly leaveTouchDelay?: number;
  readonly disableTouch?: boolean;
  readonly slotProps?: TooltipSlotProps;
};

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

/* eslint-disable jsdoc/require-jsdoc -- Closed disclosure unions and slots are self-describing.
 */
import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  ReactElement,
  ReactNode,
  RefAttributes,
} from "react";
import type { MiaixzSlotProps } from "../../shared/slots.js";

export type PopoverChangeReason = "trigger" | "escape" | "outsidePress";
export type PopoverPopupRole = "dialog" | "menu" | "listbox" | "tree" | "grid";
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
export type PopoverTriggerProps = ButtonHTMLAttributes<HTMLButtonElement> &
  RefAttributes<HTMLButtonElement>;
export type PopoverSlot = "trigger" | "content";
export interface PopoverOwnerState {
  readonly open: boolean;
  readonly placement: "bottom-start" | "bottom-end" | "top-start" | "top-end";
  readonly popupRole?: PopoverPopupRole;
}
export interface PopoverSlotProps {
  readonly trigger?: MiaixzSlotProps<PopoverOwnerState, PopoverTriggerProps>;
  readonly content?: MiaixzSlotProps<PopoverOwnerState, HTMLAttributes<HTMLDivElement>>;
}
export type PopoverProps = PopoverOpenState & {
  readonly trigger: ReactElement<PopoverTriggerProps>;
  readonly children: ReactNode;
  readonly placement?: "bottom-start" | "bottom-end" | "top-start" | "top-end";
  readonly offset?: number;
  readonly popupRole?: PopoverPopupRole;
  readonly slotProps?: PopoverSlotProps;
};

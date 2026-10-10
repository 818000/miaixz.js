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
 * Defines the button group public type contracts.
 */

import type { HTMLAttributes, ReactNode, RefAttributes } from "react";

import type { MiaixzSlotProps } from "../../shared/slots.js";
import type { ButtonSize, ButtonTone, ButtonVariant } from "./button.types.js";

/**
 * Resolved Button Group state exposed to theme and slot overrides.
 */
export interface ButtonGroupOwnerState {
  readonly orientation: "horizontal" | "vertical";
  readonly fullWidth: boolean;
  readonly size: ButtonSize;
  readonly tone: ButtonTone;
  readonly variant: ButtonVariant;
  readonly disabled: boolean;
}

/**
 * Attributes accepted by the Button Group Root slot.
 */
export interface ButtonGroupRootAttributes
  extends HTMLAttributes<HTMLDivElement>, RefAttributes<HTMLDivElement> {
  readonly "data-ui"?: "button-group";
  readonly "data-orientation"?: "horizontal" | "vertical";
  readonly "data-full-width"?: boolean;
}

/**
 * Per-slot attributes and state-dependent override callbacks for Button Group.
 */
export interface ButtonGroupSlotProps {
  readonly root?: MiaixzSlotProps<ButtonGroupOwnerState, ButtonGroupRootAttributes>;
}

/**
 * Button Group accessible naming alternatives permitted by the component contract.
 */
type ButtonGroupLabel =
  | { readonly "aria-label": string; readonly "aria-labelledby"?: never }
  | { readonly "aria-label"?: never; readonly "aria-labelledby": string };

/**
 * Properties accepted by the Button Group renderer.
 */
export type ButtonGroupProps = Omit<HTMLAttributes<HTMLDivElement>, "aria-label"> &
  ButtonGroupLabel & {
    readonly children: ReactNode;
    readonly orientation?: "horizontal" | "vertical";
    readonly fullWidth?: boolean;
    readonly size?: ButtonSize;
    readonly tone?: ButtonTone;
    readonly variant?: ButtonVariant;
    readonly disabled?: boolean;
    readonly slotProps?: ButtonGroupSlotProps;
  };

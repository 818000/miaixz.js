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
 * Defines the appearance public type contracts.
 */

import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  LabelHTMLAttributes,
  RefAttributes,
} from "react";

import type { MiaixzSlotProps } from "../shared/slots.js";

/**
 * Appearance settings scopes permitted by the component contract.
 */
export type AppearanceScope =
  | {
      readonly scope: "entry";
      readonly headerBehavior?: never;
      readonly onHeaderBehaviorChange?: never;
    }
  | {
      readonly scope: "authenticated";
      readonly headerBehavior: "fixed" | "scroll";
      readonly onHeaderBehaviorChange?: (value: "fixed" | "scroll") => void;
    };

/**
 * Appearance position choices permitted by the component contract.
 */
export type AppearancePosition =
  | {
      readonly positionBlockPx: number;
      readonly onPositionBlockPxChange?: (value: number) => void;
    }
  | {
      readonly positionBlockPx?: never;
      readonly onPositionBlockPxChange?: (value: number) => void;
    };

/**
 * Named Appearance parts available for slot and style customization.
 */
export type AppearanceSlot = "root" | "trigger" | "drawer" | "section" | "option";

/**
 * Resolved Appearance state exposed to theme and slot overrides.
 */
export interface AppearanceOwnerState {
  readonly scope: "entry" | "authenticated";
  readonly open: boolean;
  readonly draggable: boolean;
  readonly readOnlyPosition: boolean;
}

/**
 * Attributes accepted by the Appearance Root slot.
 */
export interface AppearanceRootAttributes
  extends HTMLAttributes<HTMLDivElement>, RefAttributes<HTMLDivElement> {
  readonly "data-dragging"?: boolean;
}

/**
 * Per-slot attributes and state-dependent override callbacks for Appearance.
 */
export interface AppearanceSlotProps {
  readonly root?: MiaixzSlotProps<AppearanceOwnerState, AppearanceRootAttributes>;
  readonly trigger?: MiaixzSlotProps<AppearanceOwnerState, ButtonHTMLAttributes<HTMLButtonElement>>;
  readonly drawer?: MiaixzSlotProps<AppearanceOwnerState, HTMLAttributes<HTMLDialogElement>>;
  readonly section?: MiaixzSlotProps<AppearanceOwnerState, HTMLAttributes<HTMLFieldSetElement>>;
  readonly option?: MiaixzSlotProps<AppearanceOwnerState, LabelHTMLAttributes<HTMLLabelElement>>;
}

/**
 * Component-specific Appearance properties composed with the permitted native attributes.
 */
export interface AppearanceBaseProps {
  readonly draggable?: boolean;
  readonly slotProps?: AppearanceSlotProps;
}

/**
 * Properties accepted by the Appearance renderer.
 */
export type AppearanceProps = AppearanceBaseProps & AppearanceScope & AppearancePosition;

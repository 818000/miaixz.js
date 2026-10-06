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
 * Defines the segmented public type contracts.
 */

import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode, RefAttributes } from "react";

import type { IconName } from "@miaixz/icons";
import type { MiaixzSlotProps } from "../../shared/slots.js";

/**
 * Labeled value and disabled state for one segmented-control option.
 */
export interface SegmentedItem<Value extends string = string> {
  readonly value: Value;
  readonly label: ReactNode;
  readonly textValue: string;
  readonly icon?: IconName;
  readonly disabled?: boolean;
}

/**
 * Resolved Segmented state exposed to theme and slot overrides.
 */
export interface SegmentedOwnerState {
  readonly orientation: "horizontal" | "vertical";
  readonly disabled: boolean;
}

/**
 * Attributes accepted by the Segmented Root slot.
 */
export interface SegmentedRootAttributes
  extends HTMLAttributes<HTMLDivElement>, RefAttributes<HTMLDivElement> {
  readonly "data-ui"?: "segmented";
  readonly "data-orientation"?: "horizontal" | "vertical";
}

/**
 * Per-slot attributes and state-dependent override callbacks for Segmented.
 */
export interface SegmentedSlotProps {
  readonly root?: MiaixzSlotProps<SegmentedOwnerState, SegmentedRootAttributes>;
  readonly item?: MiaixzSlotProps<SegmentedOwnerState, ButtonHTMLAttributes<HTMLButtonElement>>;
  readonly icon?: MiaixzSlotProps<SegmentedOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly label?: MiaixzSlotProps<SegmentedOwnerState, HTMLAttributes<HTMLSpanElement>>;
}

/**
 * Accessible naming alternatives required by a segmented control.
 */
type SegmentedLabel =
  | { readonly "aria-label": string; readonly "aria-labelledby"?: never }
  | { readonly "aria-label"?: never; readonly "aria-labelledby": string };

/**
 * Properties accepted by the Segmented renderer.
 */
export type SegmentedProps<Value extends string = string> = SegmentedLabel & {
  readonly items: readonly SegmentedItem<Value>[];
  readonly value?: Value;
  readonly defaultValue?: Value;
  readonly onValueChange?: (value: Value) => void;
  readonly orientation?: "horizontal" | "vertical";
  readonly disabled?: boolean;
  readonly slotProps?: SegmentedSlotProps;
} & Omit<
    HTMLAttributes<HTMLDivElement>,
    "aria-label" | "aria-labelledby" | "children" | "defaultValue" | "onChange"
  >;

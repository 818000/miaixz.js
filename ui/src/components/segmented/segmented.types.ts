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

import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode, RefAttributes } from "react";

import type { MiaixzIconName } from "../../icons/icon-name.generated.js";
import type { MiaixzSlotProps } from "../../shared/slots.js";

export interface SegmentedItem<Value extends string = string> {
  readonly value: Value;
  readonly label: ReactNode;
  readonly textValue: string;
  readonly icon?: MiaixzIconName;
  readonly disabled?: boolean;
}

export interface SegmentedOwnerState {
  readonly orientation: "horizontal" | "vertical";
  readonly disabled: boolean;
}

export interface SegmentedRootAttributes
  extends HTMLAttributes<HTMLDivElement>, RefAttributes<HTMLDivElement> {
  readonly "data-ui"?: "segmented";
  readonly "data-orientation"?: "horizontal" | "vertical";
}

export interface SegmentedSlotProps {
  readonly root?: MiaixzSlotProps<SegmentedOwnerState, SegmentedRootAttributes>;
  readonly item?: MiaixzSlotProps<SegmentedOwnerState, ButtonHTMLAttributes<HTMLButtonElement>>;
  readonly icon?: MiaixzSlotProps<SegmentedOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly label?: MiaixzSlotProps<SegmentedOwnerState, HTMLAttributes<HTMLSpanElement>>;
}

type SegmentedLabel =
  | { readonly "aria-label": string; readonly "aria-labelledby"?: never }
  | { readonly "aria-label"?: never; readonly "aria-labelledby": string };

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

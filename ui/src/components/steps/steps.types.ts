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

/* eslint-disable jsdoc/require-jsdoc -- Closed workflow models and slots are self-describing.
 */
import type { HTMLAttributes, ReactNode, RefAttributes } from "react";
import type { MiaixzSlotProps } from "../../shared/slots.js";

export interface StepsItem {
  readonly id: string;
  readonly label: ReactNode;
  readonly description?: ReactNode;
  readonly marker?: ReactNode;
  readonly status?: "pending" | "current" | "complete" | "error" | "disabled";
}
export type StepsOrientation = "horizontal" | "vertical";
export type StepsSurface = "plain" | "cards";
export type StepsDensity = "compact" | "standard" | "comfortable";
export type StepsSlot = "root" | "item" | "connector" | "icon" | "label" | "description";
export interface StepsOwnerState {
  readonly orientation: StepsOrientation;
  readonly surface: StepsSurface;
  readonly density: StepsDensity;
  readonly connector: boolean;
  readonly status: NonNullable<StepsItem["status"]> | undefined;
  readonly interactive: boolean;
}
export type StepsRootAttributes = HTMLAttributes<HTMLOListElement> &
  RefAttributes<HTMLOListElement> & {
    readonly "data-orientation"?: StepsOrientation;
    readonly "data-surface"?: StepsSurface;
    readonly "data-density"?: StepsDensity;
    readonly "data-connector"?: boolean;
  };
export type StepsItemAttributes = HTMLAttributes<HTMLLIElement> & {
  readonly "data-status"?: NonNullable<StepsItem["status"]>;
};
export interface StepsSlotProps {
  readonly root?: MiaixzSlotProps<StepsOwnerState, StepsRootAttributes>;
  readonly item?: MiaixzSlotProps<StepsOwnerState, StepsItemAttributes>;
  readonly connector?: MiaixzSlotProps<StepsOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly icon?: MiaixzSlotProps<StepsOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly label?: MiaixzSlotProps<StepsOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly description?: MiaixzSlotProps<StepsOwnerState, HTMLAttributes<HTMLDivElement>>;
}
export interface MiaixzStepsOwnProps {
  readonly label: string;
  readonly items: readonly StepsItem[];
  readonly onStepChange?: (item: StepsItem, index: number) => void;
  readonly orientation?: StepsOrientation;
  readonly surface?: StepsSurface;
  readonly density?: StepsDensity;
  readonly connector?: boolean;
  readonly slotProps?: StepsSlotProps;
}
/*
 * Configures a labeled workflow. @public
 */
export type StepsProps = MiaixzStepsOwnProps &
  Omit<HTMLAttributes<HTMLOListElement>, keyof MiaixzStepsOwnProps | "children">;

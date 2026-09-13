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

/* eslint-disable jsdoc/require-jsdoc -- Closed descriptions data and slots are self-describing.
 */
import type { HTMLAttributes, ReactNode, RefAttributes } from "react";
import type { MiaixzSlotProps } from "../../shared/slots.js";

export interface DescriptionsItem {
  readonly id: string;
  readonly label: ReactNode;
  readonly value: ReactNode;
}
export type DescriptionsLayout = "grid" | "stacked";
export type DescriptionsDensity = "compact" | "standard" | "comfortable";
export type DescriptionsSlot = "root" | "item" | "term" | "definition";
export interface DescriptionsOwnerState {
  readonly layout: DescriptionsLayout;
  readonly columns: 1 | 2 | 3;
  readonly density: DescriptionsDensity;
  readonly itemId: string | undefined;
}
export type DescriptionsRootAttributes = HTMLAttributes<HTMLDListElement> &
  RefAttributes<HTMLDListElement> & {
    readonly "data-layout"?: DescriptionsLayout;
    readonly "data-columns"?: 1 | 2 | 3;
    readonly "data-density"?: DescriptionsDensity;
  };
export interface DescriptionsSlotProps {
  readonly root?: MiaixzSlotProps<DescriptionsOwnerState, DescriptionsRootAttributes>;
  readonly item?: MiaixzSlotProps<DescriptionsOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly term?: MiaixzSlotProps<DescriptionsOwnerState, HTMLAttributes<HTMLElement>>;
  readonly definition?: MiaixzSlotProps<DescriptionsOwnerState, HTMLAttributes<HTMLElement>>;
}
export interface MiaixzDescriptionsOwnProps {
  readonly items: readonly DescriptionsItem[];
  readonly layout?: DescriptionsLayout;
  readonly columns?: 1 | 2 | 3;
  readonly density?: DescriptionsDensity;
  readonly slotProps?: DescriptionsSlotProps;
}
/*
 * Configures semantic facts from one required declarative item source. @public
 */
export type DescriptionsProps = MiaixzDescriptionsOwnProps &
  Omit<HTMLAttributes<HTMLDListElement>, keyof MiaixzDescriptionsOwnProps | "children">;

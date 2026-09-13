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

/* eslint-disable jsdoc/require-jsdoc -- Closed adaptive rail models and slots are self-describing.
 */
import type { HTMLAttributes, ReactNode, RefAttributes } from "react";
import type { MiaixzSlotProps } from "../../shared/slots.js";
import type { NavigationEntry } from "./navigation.types.js";

export type NavigationRailVariant = "default" | "brand";
export type NavigationRailDensity = "compact" | "standard" | "comfortable";
export type NavigationRailItem = NavigationEntry & {
  readonly overflow?: "auto" | "never";
  readonly priority?: number;
};
export interface NavigationRailGroupModel {
  readonly id: string;
  readonly label: ReactNode;
  readonly items: readonly NavigationRailItem[];
  readonly placement?: "start" | "end";
}
export type NavigationRailSlot =
  "root" | "header" | "toggle" | "brand" | "body" | "groups" | "utility" | "overflow";
export interface NavigationRailOwnerState {
  readonly expanded: boolean;
  readonly variant: NavigationRailVariant;
  readonly density: NavigationRailDensity;
  readonly measured: boolean;
}
export type NavigationRailRootAttributes = HTMLAttributes<HTMLDivElement> &
  RefAttributes<HTMLDivElement> & {
    readonly "data-expanded"?: boolean;
    readonly "data-variant"?: NavigationRailVariant;
    readonly "data-density"?: NavigationRailDensity;
    readonly "data-measured"?: boolean;
  };
export type NavigationRailOverflowAttributes = HTMLAttributes<HTMLDivElement> & {
  readonly "data-measuring"?: boolean;
};
export interface NavigationRailSlotProps {
  readonly root?: MiaixzSlotProps<NavigationRailOwnerState, NavigationRailRootAttributes>;
  readonly header?: MiaixzSlotProps<NavigationRailOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly toggle?: MiaixzSlotProps<NavigationRailOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly brand?: MiaixzSlotProps<NavigationRailOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly body?: MiaixzSlotProps<NavigationRailOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly groups?: MiaixzSlotProps<NavigationRailOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly utility?: MiaixzSlotProps<NavigationRailOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly overflow?: MiaixzSlotProps<NavigationRailOwnerState, NavigationRailOverflowAttributes>;
}
export interface MiaixzNavigationRailOwnProps {
  readonly brand: ReactNode;
  readonly toggle: ReactNode;
  readonly groups: readonly NavigationRailGroupModel[];
  readonly overflowLabel?: string;
  readonly expanded?: boolean;
  readonly variant?: NavigationRailVariant;
  readonly density?: NavigationRailDensity;
  readonly utility?: ReactNode;
  readonly slotProps?: NavigationRailSlotProps;
}
/*
 * Configures one adaptive application navigation rail. @public
 */
export type NavigationRailProps = MiaixzNavigationRailOwnProps &
  Omit<HTMLAttributes<HTMLDivElement>, keyof MiaixzNavigationRailOwnProps | "children">;

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

/* eslint-disable jsdoc/require-jsdoc -- Closed rail-group slots are self-describing.
 */
import type { HTMLAttributes, ReactNode, RefAttributes } from "react";
import type { MiaixzSlotProps } from "../../shared/slots.js";

export type NavigationRailGroupSlot = "root" | "marker" | "line" | "label";
export interface NavigationRailGroupOwnerState {
  readonly separated: boolean;
}
export type NavigationRailGroupRootAttributes = HTMLAttributes<HTMLElement> &
  RefAttributes<HTMLElement> & {
    readonly "data-separated"?: boolean;
  };
export interface NavigationRailGroupSlotProps {
  readonly root?: MiaixzSlotProps<NavigationRailGroupOwnerState, NavigationRailGroupRootAttributes>;
  readonly marker?: MiaixzSlotProps<NavigationRailGroupOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly line?: MiaixzSlotProps<NavigationRailGroupOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly label?: MiaixzSlotProps<NavigationRailGroupOwnerState, HTMLAttributes<HTMLSpanElement>>;
}
export interface MiaixzNavigationRailGroupOwnProps {
  readonly label: ReactNode;
  readonly separated?: boolean;
  readonly slotProps?: NavigationRailGroupSlotProps;
}
/*
 * Configures one named group inside an application navigation rail. @public
 */
export type NavigationRailGroupProps = MiaixzNavigationRailGroupOwnProps &
  Omit<HTMLAttributes<HTMLElement>, keyof MiaixzNavigationRailGroupOwnProps>;

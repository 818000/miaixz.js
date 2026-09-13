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

/* eslint-disable jsdoc/require-jsdoc -- Closed navigation entries and slots are self-describing.
 */
import type {
  AnchorHTMLAttributes,
  AriaAttributes,
  HTMLAttributes,
  ReactNode,
  RefAttributes,
} from "react";
import type { MiaixzIconName } from "../../icons/icon-name.generated.js";
import type { MiaixzSlotComponent, MiaixzSlotProps } from "../../shared/slots.js";
import type { IconProps } from "../icon/icon.types.js";

export type NavigationOrientation = "horizontal" | "vertical";
export type NavigationDensity = "compact" | "standard" | "comfortable";
export type NavigationSurface = "plain" | "filled";
export interface NavigationEntry {
  readonly id: string;
  readonly label: ReactNode;
  readonly textValue: string;
  readonly href: string;
  readonly current?: AriaAttributes["aria-current"];
  readonly icon?: MiaixzIconName;
  readonly meta?: ReactNode;
  readonly anchorProps?: Omit<
    AnchorHTMLAttributes<HTMLAnchorElement>,
    "aria-current" | "children" | "href"
  >;
}
export interface NavigationOwnerState {
  readonly orientation: NavigationOrientation;
  readonly density: NavigationDensity;
  readonly surface: NavigationSurface;
  readonly current: AriaAttributes["aria-current"] | undefined;
  readonly itemId: string | undefined;
}
export type NavigationSlot = "root" | "item" | "icon" | "label" | "meta";
export type NavigationRootAttributes = HTMLAttributes<HTMLElement> &
  RefAttributes<HTMLElement> & {
    readonly "data-orientation"?: NavigationOrientation;
    readonly "data-density"?: NavigationDensity;
    readonly "data-surface"?: NavigationSurface;
  };
export type NavigationIconAttributes = Omit<IconProps, "label"> & {
  readonly "aria-hidden": true;
};
export interface NavigationSlots {
  readonly icon?: MiaixzSlotComponent<NavigationIconAttributes>;
}
export interface NavigationSlotProps {
  readonly root?: MiaixzSlotProps<NavigationOwnerState, NavigationRootAttributes>;
  readonly item?: MiaixzSlotProps<
    NavigationOwnerState,
    AnchorHTMLAttributes<HTMLAnchorElement> & RefAttributes<HTMLAnchorElement>
  >;
  readonly icon?: MiaixzSlotProps<NavigationOwnerState, NavigationIconAttributes>;
  readonly label?: MiaixzSlotProps<NavigationOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly meta?: MiaixzSlotProps<NavigationOwnerState, HTMLAttributes<HTMLSpanElement>>;
}
export interface MiaixzNavigationOwnProps {
  readonly items: readonly NavigationEntry[];
  readonly orientation?: NavigationOrientation;
  readonly density?: NavigationDensity;
  readonly surface?: NavigationSurface;
  readonly label: string;
  readonly slots?: NavigationSlots;
  readonly slotProps?: NavigationSlotProps;
}
/*
 * Configures a labeled, link-only navigation region. @public
 */
export type NavigationProps = MiaixzNavigationOwnProps &
  Omit<HTMLAttributes<HTMLElement>, keyof MiaixzNavigationOwnProps | "children">;

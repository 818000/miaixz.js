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
 * Defines the navigation public type contracts.
 */

import type {
  AnchorHTMLAttributes,
  AriaAttributes,
  HTMLAttributes,
  ReactNode,
  RefAttributes,
} from "react";
import type { IconName, IconProps } from "@miaixz/icons";
import type { MiaixzSlotComponent, MiaixzSlotProps } from "../../shared/slots.js";

/**
 * Navigation layout orientations permitted by the component contract.
 */
export type NavigationOrientation = "horizontal" | "vertical";
/**
 * Navigation spacing densities permitted by the component contract.
 */
export type NavigationDensity = "compact" | "standard" | "comfortable";
/**
 * Navigation surface treatments permitted by the component contract.
 */
export type NavigationSurface = "plain" | "filled";
/**
 * Navigation link with stable identity, visible label, and plain-text overflow/search label.
 */
export interface NavigationEntry {
  readonly id: string;
  readonly label: ReactNode;
  readonly textValue: string;
  readonly href: string;
  readonly current?: AriaAttributes["aria-current"];
  readonly icon?: IconName;
  readonly meta?: ReactNode;
  readonly anchorProps?: Omit<
    AnchorHTMLAttributes<HTMLAnchorElement>,
    "aria-current" | "children" | "href"
  >;
}
/**
 * Resolved Navigation state exposed to theme and slot overrides.
 */
export interface NavigationOwnerState {
  readonly orientation: NavigationOrientation;
  readonly density: NavigationDensity;
  readonly surface: NavigationSurface;
  readonly current: AriaAttributes["aria-current"] | undefined;
  readonly itemId: string | undefined;
}
/**
 * Named Navigation parts available for slot and style customization.
 */
export type NavigationSlot = "root" | "item" | "icon" | "label" | "meta";
/**
 * Attributes accepted by the Navigation Root slot.
 */
export type NavigationRootAttributes = HTMLAttributes<HTMLElement> &
  RefAttributes<HTMLElement> & {
    readonly "data-orientation"?: NavigationOrientation;
    readonly "data-density"?: NavigationDensity;
    readonly "data-surface"?: NavigationSurface;
  };
/**
 * Attributes accepted by the Navigation Icon slot.
 */
export type NavigationIconAttributes = Omit<IconProps, "label"> & {
  readonly "aria-hidden": true;
};
/**
 * Replaceable slot components accepted by Navigation.
 */
export interface NavigationSlots {
  readonly icon?: MiaixzSlotComponent<NavigationIconAttributes>;
}
/**
 * Per-slot attributes and state-dependent override callbacks for Navigation.
 */
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
/**
 * Component-specific Navigation properties composed with the permitted native attributes.
 */
export interface MiaixzNavigationOwnProps {
  readonly items: readonly NavigationEntry[];
  readonly orientation?: NavigationOrientation;
  readonly density?: NavigationDensity;
  readonly surface?: NavigationSurface;
  readonly label: string;
  readonly slots?: NavigationSlots;
  readonly slotProps?: NavigationSlotProps;
}
/**
 * Configures a labeled, link-only navigation region. @public
 */
export type NavigationProps = MiaixzNavigationOwnProps &
  Omit<HTMLAttributes<HTMLElement>, keyof MiaixzNavigationOwnProps | "children">;

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
 * Defines the breadcrumb public type contracts.
 */

import type { AnchorHTMLAttributes, HTMLAttributes, ReactNode, RefAttributes } from "react";
import type { MiaixzSlotProps } from "../../shared/slots.js";

/**
 * Visible breadcrumb content shared by static and navigation entries.
 */
interface BreadcrumbPresentation {
  readonly id: string;
  readonly label: ReactNode;
  readonly icon?: ReactNode;
}
/**
 * Discriminated breadcrumb entry enforcing the permitted current-item and navigation shapes.
 */
export type BreadcrumbEntry =
  | (BreadcrumbPresentation & {
      readonly current: true;
      readonly href?: never;
      readonly spanProps?: Omit<HTMLAttributes<HTMLSpanElement>, "aria-current" | "children">;
      readonly anchorProps?: never;
    })
  | (BreadcrumbPresentation & {
      readonly current?: false;
      readonly href: string;
      readonly anchorProps?: Omit<
        AnchorHTMLAttributes<HTMLAnchorElement>,
        "aria-current" | "children" | "href"
      >;
      readonly spanProps?: never;
    });
/**
 * Named Breadcrumb parts available for slot and style customization.
 */
export type BreadcrumbSlot = "root" | "list" | "item" | "icon" | "label";
/**
 * Resolved Breadcrumb state exposed to theme and slot overrides.
 */
export type BreadcrumbOwnerState = Record<never, never>;
/**
 * Attributes accepted by the Breadcrumb Root slot.
 */
export type BreadcrumbRootAttributes = HTMLAttributes<HTMLElement> & RefAttributes<HTMLElement>;
/**
 * Per-slot attributes and state-dependent override callbacks for Breadcrumb.
 */
export interface BreadcrumbSlotProps {
  readonly root?: MiaixzSlotProps<BreadcrumbOwnerState, BreadcrumbRootAttributes>;
  readonly list?: MiaixzSlotProps<BreadcrumbOwnerState, HTMLAttributes<HTMLOListElement>>;
  readonly item?: MiaixzSlotProps<BreadcrumbOwnerState, HTMLAttributes<HTMLLIElement>>;
  readonly icon?: MiaixzSlotProps<BreadcrumbOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly label?: MiaixzSlotProps<BreadcrumbOwnerState, HTMLAttributes<HTMLSpanElement>>;
}
/**
 * Component-specific Breadcrumb properties composed with the permitted native attributes.
 */
export interface MiaixzBreadcrumbOwnProps {
  readonly label?: string;
  readonly items: readonly BreadcrumbEntry[];
  readonly slotProps?: BreadcrumbSlotProps;
}
/**
 * Configures a breadcrumb navigation landmark. @public
 */
export type BreadcrumbProps = MiaixzBreadcrumbOwnProps &
  Omit<HTMLAttributes<HTMLElement>, keyof MiaixzBreadcrumbOwnProps | "children">;

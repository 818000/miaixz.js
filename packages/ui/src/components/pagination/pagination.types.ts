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
 * Defines the pagination public type contracts.
 */

import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode, RefAttributes } from "react";
import type { MiaixzSlotProps } from "../../shared/slots.js";

/**
 * Pagination visual variants permitted by the component contract.
 */
export type PaginationVariant = "default" | "plain";
/**
 * Named Pagination parts available for slot and style customization.
 */
export type PaginationSlot = "root" | "summary" | "list" | "item" | "ellipsis";
/**
 * Resolved Pagination state exposed to theme and slot overrides.
 */
export interface PaginationOwnerState {
  readonly variant: PaginationVariant;
  readonly inset: boolean;
  readonly page: number;
  readonly pageCount: number;
}
/**
 * Attributes accepted by the Pagination Root slot.
 */
export type PaginationRootAttributes = HTMLAttributes<HTMLElement> &
  RefAttributes<HTMLElement> & {
    readonly "data-variant"?: PaginationVariant;
    readonly "data-inset"?: boolean;
  };
/**
 * Per-slot attributes and state-dependent override callbacks for Pagination.
 */
export interface PaginationSlotProps {
  readonly root?: MiaixzSlotProps<PaginationOwnerState, PaginationRootAttributes>;
  readonly summary?: MiaixzSlotProps<PaginationOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly list?: MiaixzSlotProps<PaginationOwnerState, HTMLAttributes<HTMLUListElement>>;
  readonly item?: MiaixzSlotProps<PaginationOwnerState, ButtonHTMLAttributes<HTMLButtonElement>>;
  readonly ellipsis?: MiaixzSlotProps<PaginationOwnerState, HTMLAttributes<HTMLSpanElement>>;
}
/**
 * Component-specific Pagination properties composed with the permitted native attributes.
 */
export interface MiaixzPaginationOwnProps {
  readonly variant?: PaginationVariant;
  readonly inset?: boolean;
  readonly page: number;
  readonly pageCount: number;
  readonly onPageChange: (page: number) => void;
  readonly siblingCount?: number;
  readonly showPrevious?: boolean;
  readonly showNext?: boolean;
  readonly label?: string;
  readonly previousLabel?: string;
  readonly nextLabel?: string;
  readonly summary?: ReactNode;
  readonly slotProps?: PaginationSlotProps;
}
/**
 * Configures controlled page-number navigation. @public
 */
export type PaginationProps = MiaixzPaginationOwnProps &
  Omit<HTMLAttributes<HTMLElement>, keyof MiaixzPaginationOwnProps | "children" | "onChange">;

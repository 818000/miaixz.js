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
 * Defines the public exception presentation contract.
 */

import type { HTMLAttributes, ReactNode, RefAttributes } from "react";
import type { MiaixzSlotProps } from "../../shared/slots.js";

/**
 * Supported presentation presets, independent of routing and exception handling.
 */
export type ExceptionStatus = "404" | "403" | "500" | "unavailable";
/**
 * Background recipes owned by the shared theme.
 */
export type ExceptionBackground = "none" | "surface" | "subtle";
/**
 * Stable presentation slots available to theme overrides.
 */
export type ExceptionSlot =
  "root" | "background" | "content" | "illustration" | "code" | "title" | "description" | "actions";
/**
 * State exposed to component recipes and slot callbacks.
 */
export interface ExceptionOwnerState {
  readonly status: ExceptionStatus;
  readonly background: ExceptionBackground;
  readonly headingLevel: 1 | 2 | 3 | 4 | 5 | 6;
  readonly showCode: boolean;
}
/**
 * Native attributes accepted by the labelled section.
 */
export type ExceptionRootAttributes = HTMLAttributes<HTMLElement> &
  RefAttributes<HTMLElement> & {
    readonly "data-status"?: ExceptionStatus;
    readonly "data-background"?: ExceptionBackground;
  };
/**
 * Attributes and state-aware overrides for each component slot.
 */
export interface ExceptionSlotProps {
  readonly root?: MiaixzSlotProps<ExceptionOwnerState, ExceptionRootAttributes>;
  readonly background?: MiaixzSlotProps<ExceptionOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly content?: MiaixzSlotProps<ExceptionOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly illustration?: MiaixzSlotProps<ExceptionOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly code?: MiaixzSlotProps<ExceptionOwnerState, HTMLAttributes<HTMLParagraphElement>>;
  readonly title?: MiaixzSlotProps<ExceptionOwnerState, HTMLAttributes<HTMLHeadingElement>>;
  readonly description?: MiaixzSlotProps<ExceptionOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly actions?: MiaixzSlotProps<ExceptionOwnerState, HTMLAttributes<HTMLDivElement>>;
}
/**
 * Theme-aware exception content without implicit requests, navigation or branding.
 */
export interface ExceptionOwnProps {
  readonly status: ExceptionStatus;
  readonly title?: ReactNode;
  readonly description?: ReactNode;
  readonly illustration?: ReactNode;
  readonly actions?: ReactNode;
  readonly background?: ExceptionBackground;
  readonly headingLevel?: ExceptionOwnerState["headingLevel"];
  readonly showCode?: boolean;
  readonly slotProps?: ExceptionSlotProps;
}
/**
 * Properties accepted by Exception; native section title is replaced by heading content.
 */
export type ExceptionProps = ExceptionOwnProps &
  Omit<HTMLAttributes<HTMLElement>, keyof ExceptionOwnProps | "children">;

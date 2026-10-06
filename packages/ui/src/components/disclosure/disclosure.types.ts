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
 * Defines the disclosure public type contracts.
 */

import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode, RefAttributes } from "react";

import type { MiaixzSlotProps } from "../../shared/slots.js";

/**
 * Resolved Disclosure state exposed to theme and slot overrides.
 */
export interface DisclosureOwnerState {
  readonly expanded: boolean;
  readonly disabled: boolean;
  readonly headingLevel: 2 | 3 | 4 | 5 | 6;
}

/**
 * Attributes accepted by the Disclosure Root slot.
 */
export interface DisclosureRootAttributes
  extends HTMLAttributes<HTMLDivElement>, RefAttributes<HTMLDivElement> {
  readonly "data-ui"?: "disclosure";
  readonly "data-expanded"?: boolean;
}

/**
 * Per-slot attributes and state-dependent override callbacks for Disclosure.
 */
export interface DisclosureSlotProps {
  readonly root?: MiaixzSlotProps<DisclosureOwnerState, DisclosureRootAttributes>;
  readonly heading?: MiaixzSlotProps<DisclosureOwnerState, HTMLAttributes<HTMLHeadingElement>>;
  readonly trigger?: MiaixzSlotProps<DisclosureOwnerState, ButtonHTMLAttributes<HTMLButtonElement>>;
  readonly icon?: MiaixzSlotProps<DisclosureOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly region?: MiaixzSlotProps<DisclosureOwnerState, HTMLAttributes<HTMLDivElement>>;
}

/**
 * Properties accepted by the Disclosure renderer.
 */
export interface DisclosureProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  readonly summary: ReactNode;
  readonly children: ReactNode;
  readonly headingLevel?: 2 | 3 | 4 | 5 | 6;
  readonly expanded?: boolean;
  readonly defaultExpanded?: boolean;
  readonly onExpandedChange?: (expanded: boolean) => void;
  readonly disabled?: boolean;
  readonly unmountOnExit?: boolean;
  readonly slotProps?: DisclosureSlotProps;
}

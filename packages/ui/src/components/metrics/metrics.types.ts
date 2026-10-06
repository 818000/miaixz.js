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
 * Defines the metrics public type contracts.
 */

import type { HTMLAttributes, ReactNode } from "react";
import type { MiaixzSlotProps } from "../../shared/slots.js";

/**
 * Resolved Metrics state exposed to theme and slot overrides.
 */
export interface MetricsOwnerState {
  readonly layout: "strip" | "grid";
  readonly columns: 3 | 4 | 5;
  readonly responsive: "default" | "mobile" | "none";
  readonly surface: "filled" | "plain";
  readonly density: "compact" | "standard" | "comfortable";
  readonly presentation: "default" | "summary-strip";
}

/**
 * Attributes accepted by the Metrics Scroll slot.
 */
export type MetricsScrollAttributes = Omit<
  HTMLAttributes<HTMLDivElement>,
  "aria-label" | "aria-labelledby" | "children" | "role" | "tabIndex"
>;
/**
 * Per-slot attributes and state-dependent override callbacks for Metrics.
 */
export type MetricsSlotProps = {
  readonly scroll?: MiaixzSlotProps<MetricsOwnerState, MetricsScrollAttributes>;
};

/**
 * Accessible naming alternatives for a group of metrics.
 */
type MetricsName =
  | { readonly "aria-label"?: string; readonly "aria-labelledby"?: never }
  | { readonly "aria-label"?: never; readonly "aria-labelledby"?: string };
/**
 * Properties accepted by the Metrics renderer.
 */
export type MetricsProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "aria-label" | "aria-labelledby" | "children"
> &
  MetricsName & {
    readonly children: ReactNode;
    readonly layout?: "strip" | "grid";
    readonly columns?: 3 | 4 | 5;
    readonly responsive?: "default" | "mobile" | "none";
    readonly surface?: "filled" | "plain";
    readonly density?: "compact" | "standard" | "comfortable";
    readonly presentation?: "default" | "summary-strip";
    readonly spacingAfter?: "none" | "compact";
    readonly slotProps?: MetricsSlotProps;
  };

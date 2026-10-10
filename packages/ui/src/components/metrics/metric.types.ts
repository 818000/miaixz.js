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
 * Defines the metric public type contracts.
 */

import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  HTMLAttributes,
  MouseEvent,
  ReactNode,
} from "react";

import type { MiaixzSlotProps } from "../../shared/slots.js";
import type { MiaixzVisualTone } from "../shared.types.js";

/**
 * Metric visual variants permitted by the component contract.
 */
export type MetricVariant = "standard" | "summary" | "strip" | "card";
/**
 * Metric spacing densities permitted by the component contract.
 */
export type MetricDensity = "compact" | "standard" | "comfortable";
/**
 * Resolved Metric state exposed to theme and slot overrides.
 */
export interface MetricOwnerState {
  readonly variant: MetricVariant;
  readonly density: MetricDensity;
  readonly tone: MiaixzVisualTone;
  readonly emphasized: boolean;
  readonly interactive: boolean;
}
/**
 * Per-slot attributes and state-dependent override callbacks for Metric.
 */
export interface MetricSlotProps {
  readonly icon?: MiaixzSlotProps<MetricOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly label?: MiaixzSlotProps<MetricOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly value?: MiaixzSlotProps<MetricOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly hint?: MiaixzSlotProps<MetricOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly status?: MiaixzSlotProps<MetricOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly trend?: MiaixzSlotProps<MetricOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly visual?: MiaixzSlotProps<MetricOwnerState, HTMLAttributes<HTMLSpanElement>>;
}
/**
 * Shared metric title, value, and supplementary content before interaction is selected.
 */
interface MetricContentProps {
  readonly variant?: MetricVariant;
  readonly density?: MetricDensity;
  readonly tone?: MiaixzVisualTone;
  readonly emphasized?: boolean;
  readonly label: ReactNode;
  readonly icon?: ReactNode;
  readonly value: ReactNode;
  readonly hint?: ReactNode;
  readonly status?: ReactNode;
  readonly trend?: ReactNode;
  readonly visual?: ReactNode;
  readonly slotProps?: MetricSlotProps;
}
/**
 * Non-interactive metric variant with native static-root attributes.
 */
export type MetricStaticProps = MetricContentProps &
  Omit<HTMLAttributes<HTMLElement>, keyof MetricContentProps | "children"> & {
    readonly href?: never;
    readonly onAction?: never;
  };
/**
 * Navigable metric variant rendered through an anchor.
 */
export type MetricLinkProps = MetricContentProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof MetricContentProps | "children" | "href"> & {
    readonly href: string;
    readonly onAction?: never;
  };
/**
 * Command metric variant rendered through a button.
 */
export type MetricActionProps = MetricContentProps &
  Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    keyof MetricContentProps | "children" | "onClick" | "type"
  > & {
    readonly href?: never;
    readonly onAction: (event: MouseEvent<HTMLButtonElement>) => void;
  };
/**
 * Configures one static, link, or action metric. @public
 */
export type MetricProps = MetricStaticProps | MetricLinkProps | MetricActionProps;

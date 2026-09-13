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

/* eslint-disable jsdoc/require-jsdoc -- Closed metrics item modes and slots are self-describing.
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

export type MetricVariant = "standard" | "summary" | "strip" | "card";
export type MetricDensity = "compact" | "standard" | "comfortable";
export interface MetricOwnerState {
  readonly variant: MetricVariant;
  readonly density: MetricDensity;
  readonly tone: MiaixzVisualTone;
  readonly emphasized: boolean;
  readonly interactive: boolean;
}
export interface MetricSlotProps {
  readonly label?: MiaixzSlotProps<MetricOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly value?: MiaixzSlotProps<MetricOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly hint?: MiaixzSlotProps<MetricOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly status?: MiaixzSlotProps<MetricOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly trend?: MiaixzSlotProps<MetricOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly visual?: MiaixzSlotProps<MetricOwnerState, HTMLAttributes<HTMLSpanElement>>;
}
interface MetricContentProps {
  readonly variant?: MetricVariant;
  readonly density?: MetricDensity;
  readonly tone?: MiaixzVisualTone;
  readonly emphasized?: boolean;
  readonly label: ReactNode;
  readonly value: ReactNode;
  readonly hint?: ReactNode;
  readonly status?: ReactNode;
  readonly trend?: ReactNode;
  readonly visual?: ReactNode;
  readonly slotProps?: MetricSlotProps;
}
export type MetricStaticProps = MetricContentProps &
  Omit<HTMLAttributes<HTMLElement>, keyof MetricContentProps | "children"> & {
    readonly href?: never;
    readonly onAction?: never;
  };
export type MetricLinkProps = MetricContentProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof MetricContentProps | "children" | "href"> & {
    readonly href: string;
    readonly onAction?: never;
  };
export type MetricActionProps = MetricContentProps &
  Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    keyof MetricContentProps | "children" | "onClick" | "type"
  > & {
    readonly href?: never;
    readonly onAction: (event: MouseEvent<HTMLButtonElement>) => void;
  };
/*
 * Configures one static, link, or action metric. @public
 */
export type MetricProps = MetricStaticProps | MetricLinkProps | MetricActionProps;

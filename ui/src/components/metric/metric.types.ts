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

import type { HTMLAttributes, ReactNode } from "react";

import type { MiaixzVisualTone } from "../shared.types.js";

/**
 * Identifies native metric text recipes without an imposed chart or business layout.
 *
 * @public
 */
export type MetricPart = "reading" | "total" | "pair" | "pair-muted" | "progress";

/**
 * Defines content shared by static and interactive metric presentations.
 */
interface MetricBaseProps extends Omit<
  HTMLAttributes<HTMLElement>,
  "children" | "color" | "onClick"
> {
  /**
   * Selects the standard or compact summary-card composition.
   * Strip entries require an outer framed group: they own internal dividers only,
   * inline above 720px and stacked at 720px and below.
   */
  readonly variant?:
    "default" | "summary" | "strip" | "compact" | "card" | "tile" | "stat" | "entity";
  /**
   * Emphasizes a primary metric without changing its semantic tone.
   */
  readonly emphasized?: boolean;
  /**
   * Supplies the metric label.
   */
  readonly label: ReactNode;
  /**
   * Supplies the primary metric value.
   */
  readonly value: ReactNode;
  /**
   * Supplies optional supporting information.
   */
  readonly hint?: ReactNode;
  /**
   * Supplies an optional leading icon.
   * Strip icons appear in a circular holder with theme tone fill on hover or keyboard focus.
   * Supplying an icon does not make a static metric interactive.
   */
  readonly icon?: ReactNode;
  /**
   * Supplies optional status content.
   */
  readonly status?: ReactNode;
  /**
   * Supplies optional trend content.
   */
  readonly trend?: ReactNode;
  /**
   * Supplies an optional compact visualization.
   */
  readonly visual?: ReactNode;
  /**
   * Selects a theme-resolved semantic or categorical visual tone.
   *
   * @defaultValue `"neutral"`
   */
  readonly tone?: MiaixzVisualTone;
}

/**
 * Configures a metric that navigates to another location.
 */
interface MetricLinkProps extends MetricBaseProps {
  /**
   * Navigates to the supplied location when the metric is activated.
   */
  readonly href: string;
  /**
   * Prevents action semantics from being combined with navigation.
   */
  readonly onAction?: never;
}

/**
 * Configures a metric that runs an application action.
 */
interface MetricActionProps extends MetricBaseProps {
  /**
   * Prevents navigation semantics from being combined with an action.
   */
  readonly href?: never;
  /**
   * Runs the supplied action when the metric is activated.
   */
  readonly onAction: () => void;
}

/**
 * Configures a metric that only presents information.
 */
interface MetricStaticProps extends MetricBaseProps {
  /**
   * Prevents static metrics from receiving navigation semantics.
   */
  readonly href?: never;
  /**
   * Prevents static metrics from receiving action semantics.
   */
  readonly onAction?: never;
}

/**
 * Configures a reusable metric as a link, an action, or static content.
 *
 * @public
 */
export type MetricProps = MetricLinkProps | MetricActionProps | MetricStaticProps;

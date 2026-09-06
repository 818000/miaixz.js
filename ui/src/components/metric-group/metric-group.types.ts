import type { HTMLAttributes, ReactElement } from "react";

import type { MetricProps } from "../metric/index.js";

/**
 * Configures a framed group of strip metrics. @public
 */
export interface MetricGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /**
   * Supplies the metrics rendered inside the group.
   */
  readonly children: ReactElement<MetricProps> | readonly ReactElement<MetricProps>[];
  /**
   * Selects the desktop column count. The group responds with four, two, and one
   * columns across the public desktop, compact desktop/tablet, and mobile ranges.
   */
  readonly columns: 4;
  /**
   * Selects a filled or transparent group surface.
   */
  readonly surface?: "default" | "transparent";
  /**
   * Selects the standard or dense information-strip geometry.
   */
  readonly density?: "default" | "compact";
  /**
   * Adds token-backed separation after the metric strip.
   */
  readonly spacingAfter?: "none" | "compact";
}

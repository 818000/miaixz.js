import type { HTMLAttributes } from "react";

import type { MiaixzVisualTone } from "../shared.types.js";

/**
 * Defines one named column-chart series.
 *
 * @public
 */
export interface ColumnsSeries {
  /**
   * Supplies the accessible series name.
   */
  readonly label: string;
  /**
   * Supplies one value for every chart label.
   */
  readonly values: readonly number[];
}

/**
 * Configures a compact one- or two-series column chart.
 *
 * @public
 */
export interface ColumnsProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "color"> {
  /**
   * Selects a reusable chart geometry without exposing internal slots.
   */
  readonly variant?: "cost" | "dataset" | "default" | "paired" | "resource" | "timeline";
  /**
   * Supplies ordered category labels.
   */
  readonly labels: readonly string[];
  /**
   * Supplies one or two named data series.
   */
  readonly series: readonly ColumnsSeries[];
  /**
   * Supplies an optional positive chart-domain maximum.
   */
  readonly maximum?: number;
  /**
   * Selects the shared theme-resolved visual tone.
   */
  readonly tone: MiaixzVisualTone;
  /**
   * Supplies the required accessible chart name.
   */
  readonly "aria-label": string;
}

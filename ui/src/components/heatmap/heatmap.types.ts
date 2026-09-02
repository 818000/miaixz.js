import type { HTMLAttributes } from "react";

import type { MiaixzVisualTone } from "../shared.types.js";

/**
 * Defines the fixed activity levels supported by Heatmap.
 *
 * @public
 */
export type HeatmapLevel = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * Configures an accessible labeled heatmap.
 *
 * @public
 */
export interface HeatmapProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "color"> {
  /** Selects the default or dense dashboard geometry. */
  readonly density?: "default" | "compact";
  /**
   * Supplies one visible label for every data row.
   */
  readonly rowLabels: readonly string[];
  /**
   * Supplies one visible label for every data column.
   */
  readonly columnLabels: readonly string[];
  /**
   * Supplies a rectangular matrix of fixed zero-to-five activity levels.
   */
  readonly levels: readonly (readonly HeatmapLevel[])[];
  /**
   * Selects the theme-resolved visual tone mixed at each activity level.
   */
  readonly tone: MiaixzVisualTone;
  /**
   * Supplies the required accessible heatmap name.
   */
  readonly "aria-label": string;
}

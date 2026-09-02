import type { SVGAttributes } from "react";

import type { MiaixzVisualTone } from "../shared.types.js";

/**
 * Configures a compact, theme-aware line visualization.
 *
 * @public
 */
export interface SparklineProps extends Omit<
  SVGAttributes<SVGSVGElement>,
  "children" | "color" | "values"
> {
  /**
   * Supplies ordered numeric samples. Non-finite samples produce visible gaps.
   */
  readonly values: readonly number[];
  /**
   * Selects a theme-resolved semantic or categorical visual tone.
   *
   * @defaultValue `"brand"`
   */
  readonly tone?: MiaixzVisualTone;
  /**
   * Supplies the required accessible visualization name.
   */
  readonly "aria-label": string;
}

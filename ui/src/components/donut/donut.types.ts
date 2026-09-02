import type { HTMLAttributes, ReactNode } from "react";

import type { MiaixzVisualTone } from "../shared.types.js";

/**
 * Defines one labeled donut segment.
 *
 * @public
 */
export interface DonutSegment {
  /**
   * Supplies the segment label.
   */
  readonly label: string;
  /**
   * Supplies the finite non-negative source value.
   */
  readonly value: number;
  /**
   * Selects the segment's theme-resolved visual tone.
   */
  readonly tone: MiaixzVisualTone;
}

/**
 * Configures an accessible normalized donut visualization.
 *
 * @public
 */
export interface DonutProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "color"> {
  /** Selects the semantic visualization diameter. */
  readonly size?: "small" | "medium" | "large";
  /** Selects whether the shared legend is rendered. */
  readonly legend?: "hidden" | "inline";
  /**
   * Supplies source segments without requiring pre-normalization.
   */
  readonly segments: readonly DonutSegment[];
  /**
   * Supplies optional content displayed in the ring center.
   */
  readonly center?: ReactNode;
  /**
   * Supplies the required accessible visualization description.
   */
  readonly "aria-label": string;
}

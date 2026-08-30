import type { HTMLAttributes } from "react";

/**
 * Defines the supported skeleton placeholder shapes.
 *
 * @public
 */
export type SkeletonVariant = "text" | "heading" | "avatar" | "button" | "row" | "custom";

/**
 * Configures a non-interactive loading placeholder.
 *
 * @public
 */
export interface SkeletonProps extends HTMLAttributes<HTMLSpanElement> {
  /**
   * Selects the semantic placeholder shape.
   *
   * @defaultValue `"text"`
   */
  variant?: SkeletonVariant;
  /**
   * Overrides the placeholder width.
   */
  width?: number | string;
  /**
   * Overrides the placeholder height.
   */
  height?: number | string;
}

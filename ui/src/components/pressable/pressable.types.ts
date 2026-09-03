import type { ButtonHTMLAttributes } from "react";

/**
 * Configures a semantic button with only shared interaction behavior.
 *
 * Use this for custom list rows, navigation labels and other composite
 * surfaces whose visual layout belongs to the consuming product.
 *
 * @public
 */
export interface PressableProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Selects a reusable interaction surface; business content remains a child.
   * The link variant shares anchor colors and underlines while retaining button semantics.
   */
  variant?: "default" | "row" | "pill" | "card" | "link";
  /**
   * Selects a shared row density.
   */
  density?: "compact" | "standard" | "comfortable";
  /**
   * Selects a row separator without business-owned control CSS.
   */
  separator?: "solid" | "dashed" | "none";
}

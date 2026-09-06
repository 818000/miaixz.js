import type { HTMLAttributes } from "react";

/**
 * Configures a vertical stack layout. @public
 */
export interface StackProps extends HTMLAttributes<HTMLDivElement> {
  /** Selects a token-backed vertical gap without requiring consumer CSS. */
  gap?: "default" | "compact" | "tight" | "none";
}

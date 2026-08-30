import type { HTMLAttributes, ReactElement, ReactNode } from "react";

/**
 * Describes the event and ARIA properties injected into a tooltip child.
 *
 * @public
 */
export interface MiaixzTooltipChildProps {
  /**
   * References the tooltip together with any existing descriptions.
   */
  "aria-describedby"?: string;
}

/**
 * Configures concise contextual help associated with one child.
 *
 * @public
 */
export interface TooltipProps extends Omit<HTMLAttributes<HTMLSpanElement>, "content"> {
  /**
   * Supplies the contextual help content.
   */
  content: ReactNode;
  /**
   * Supplies the single element described by the tooltip.
   */
  children: ReactElement<MiaixzTooltipChildProps>;
  /**
   * Selects the tooltip placement relative to its child.
   *
   * @defaultValue `"top"`
   */
  placement?: "top" | "right" | "bottom" | "left";
}

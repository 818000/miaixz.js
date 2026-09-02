import type { HTMLAttributes, ReactNode } from "react";

/**
 * Configures a full-viewport application entry layout. @public
 */
export interface EntryProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /**
   * Overrides the entry composition registered by the active theme.
   */
  variant?: "split" | "centered";
  /**
   * Supplies optional supporting content for the desktop split layout.
   */
  aside?: ReactNode;
  /**
   * Supplies the primary entry content.
   */
  children: ReactNode;
}

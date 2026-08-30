import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

/**
 * Configures a Portal-backed fixed popover.
 *
 * @public
 */
export interface PopoverProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Supplies the visible disclosure trigger.
   */
  trigger: ReactNode;
  /**
   * Controls the open state when supplied.
   */
  open?: boolean;
  /**
   * Sets the initial uncontrolled open state.
   *
   * @defaultValue `false`
   */
  defaultOpen?: boolean;
  /**
   * Receives requested open-state changes.
   */
  onOpenChange?: (open: boolean) => void;
  /**
   * Selects the popover placement relative to its trigger.
   *
   * @defaultValue `"bottom-start"`
   */
  placement?: "bottom-start" | "bottom-end" | "top-start" | "top-end";
  /**
   * Adds a class to the popover content surface.
   */
  contentClassName?: string;
  /**
   * Supplies native attributes for the button trigger.
   */
  triggerProps?: ButtonHTMLAttributes<HTMLButtonElement>;
  /**
   * Prevents disclosure interaction.
   *
   * @defaultValue `false`
   */
  disabled?: boolean;
}

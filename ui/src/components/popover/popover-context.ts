import { createContext, useContext, type RefObject } from "react";

/**
 * Exposes package-internal Popover lifecycle controls to composed surfaces such as Dropdown.
 */
export interface MiaixzPopoverContextValue {
  /**
   * Reports whether the owning Popover surface is open.
   */
  readonly open: boolean;

  /**
   * References the native button that owns the surface.
   */
  readonly triggerRef: RefObject<HTMLButtonElement | null>;

  /**
   * Requests closure and optionally restores trigger focus after the controlled state commits.
   */
  readonly requestClose: (restoreFocus: boolean) => void;
}

/**
 * Carries one Popover lifecycle through its Portal without becoming public API.
 */
export const MiaixzPopoverContext = createContext<MiaixzPopoverContextValue | undefined>(undefined);

/**
 * Reads the nearest package-internal Popover lifecycle when composition provides one.
 *
 * @returns The nearest Popover lifecycle, or undefined outside Popover content.
 */
export function useMiaixzPopoverContext(): MiaixzPopoverContextValue | undefined {
  return useContext(MiaixzPopoverContext);
}

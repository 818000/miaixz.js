import { createContext } from "react";

/**
 * Connects a composite field's native editor to its owning Field wrapper.
 */
interface MiaixzFieldContextValue {
  /**
   * Identifies the focusable editor rather than its composite root.
   */
  readonly controlId: string;
  /**
   * Identifies the wrapper's visible label.
   */
  readonly labelId: string;
  /**
   * References the wrapper's helper and error descriptions.
   */
  readonly describedBy: string | undefined;
  /**
   * Preserves the wrapper's required-field semantics.
   */
  readonly required: boolean;
}

/**
 * Shares label ownership without changing standalone composite controls.
 */
export const MiaixzFieldContext = createContext<MiaixzFieldContextValue | null>(null);

import type { ChangeEventHandler, ReactNode } from "react";

import type { InputProps } from "../input/index.js";

/**
 * Configures a controlled or uncontrolled localized search field.
 *
 * @public
 */
export interface SearchProps extends Omit<
  InputProps,
  "type" | "startAdornment" | "endAdornment" | "value" | "defaultValue" | "onChange"
> {
  /**
   * Selects the standard field or header-only presentation.
   *
   * @defaultValue `"default"`
   */
  variant?: "default" | "header";
  /**
   * Displays a keyboard shortcut after the editable input area.
   */
  shortcut?: ReactNode;
  /**
   * Controls the current search value.
   */
  value?: string;
  /**
   * Sets the initial uncontrolled search value.
   *
   * @defaultValue An empty string.
   */
  defaultValue?: string;
  /**
   * Receives native input change events.
   */
  onChange?: ChangeEventHandler<HTMLInputElement>;
  /**
   * Receives the normalized current search value.
   */
  onValueChange?: (value: string) => void;
  /**
   * Displays a clear action while the field contains text.
   *
   * @defaultValue `true`
   */
  clearable?: boolean;
  /**
   * Overrides the localized clear-action label.
   */
  clearLabel?: string;
}

import type { HTMLAttributes } from "react";

import type { MiaixzFormPreviewProps } from "../shared.types.js";

/**
 * Describes one selectable option shared by Combobox and Picker.
 *
 * @typeParam Value - Stable string value type used by the owning product.
 * @public
 */
export interface MiaixzOption<Value extends string = string> {
  /**
   * Supplies the stable option value.
   */
  readonly value: Value;

  /**
   * Supplies the visible option label.
   */
  readonly label: string;

  /**
   * Supplies optional supporting copy.
   */
  readonly description?: string;

  /**
   * Prevents the option from being selected.
   */
  readonly disabled?: boolean;
}

/**
 * Loads options for the current query and supports immediate cancellation.
 *
 * @typeParam Value - Stable string value type returned by the loader.
 * @param query - Current user-entered query, including an empty query.
 * @param signal - Abort signal cancelled when the query or component lifecycle changes.
 * @returns The complete ordered option result for the query.
 * @public
 */
export type MiaixzOptionLoader<Value extends string = string> = (
  query: string,
  signal: AbortSignal,
) => Promise<readonly MiaixzOption<Value>[]>;

/**
 * Defines Miaixz-owned Combobox properties before native div attributes are merged.
 *
 * @typeParam Value - Stable string value type selected by the control.
 * @public
 */
export interface MiaixzComboboxOwnProps<
  Value extends string = string,
> extends MiaixzFormPreviewProps {
  /**
   * Supplies the complete static option collection.
   */
  options?: readonly MiaixzOption<Value>[];

  /**
   * Supplies the asynchronous option source used instead of static options.
   */
  loadOptions?: MiaixzOptionLoader<Value>;

  /**
   * Controls the selected value when supplied with `onValueChange`.
   */
  value?: Value | null;

  /**
   * Sets the initial uncontrolled selected value.
   */
  defaultValue?: Value | null;

  /**
   * Receives requested selected-value changes.
   */
  onValueChange?: (value: Value | null) => void;

  /**
   * Controls the search input when supplied with `onInputValueChange`.
   */
  inputValue?: string;

  /**
   * Sets the initial uncontrolled search input.
   */
  defaultInputValue?: string;

  /**
   * Receives requested search changes.
   */
  onInputValueChange?: (value: string) => void;

  /**
   * Supplies the visible and accessible field label.
   */
  label: string;

  /**
   * Supplies placeholder copy for an empty search input.
   */
  placeholder?: string;

  /**
   * Replaces the empty-result message.
   */
  emptyMessage?: string;

  /**
   * Replaces the loading-state message.
   */
  loadingMessage?: string;

  /**
   * Replaces the asynchronous loader failure message.
   */
  errorMessage?: string;

  /**
   * Disables the complete composite control.
   */
  disabled?: boolean;

  /**
   * Prevents search and selection changes while preserving focus and content.
   */
  readOnly?: boolean;

  /**
   * Applies the invalid visual and accessibility state.
   */
  invalid?: boolean;
}

/**
 * Configures a searchable single-value WAI-ARIA combobox.
 *
 * @typeParam Value - Stable string value type selected by the control.
 * @public
 */
export interface ComboboxProps<Value extends string = string>
  extends
    Omit<HTMLAttributes<HTMLDivElement>, keyof MiaixzComboboxOwnProps<Value>>,
    MiaixzComboboxOwnProps<Value> {}

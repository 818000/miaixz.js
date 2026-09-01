import type { HTMLAttributes } from "react";

import type { ComboboxProps } from "../combobox/index.js";

/**
 * Defines Miaixz-owned Picker properties before native div attributes are merged.
 *
 * @typeParam Value - Stable string value type selected by the control.
 * @public
 */
export interface MiaixzPickerOwnProps<Value extends string = string> extends Omit<
  ComboboxProps<Value>,
  "value" | "defaultValue" | "onValueChange"
> {
  /**
   * Controls the ordered selected-value collection.
   */
  value?: readonly Value[];

  /**
   * Sets the initial uncontrolled selected-value collection.
   */
  defaultValue?: readonly Value[];

  /**
   * Receives requested selected-value changes.
   */
  onValueChange?: (value: readonly Value[]) => void;

  /**
   * Limits the number of simultaneously selected values.
   */
  selectionLimit?: number;
}

/**
 * Configures a searchable multiple-value WAI-ARIA combobox.
 *
 * @typeParam Value - Stable string value type selected by the control.
 * @public
 */
export interface PickerProps<Value extends string = string>
  extends
    Omit<HTMLAttributes<HTMLDivElement>, keyof MiaixzPickerOwnProps<Value>>,
    MiaixzPickerOwnProps<Value> {}

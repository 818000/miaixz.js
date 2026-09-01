import {
  forwardRef,
  useCallback,
  useMemo,
  useState,
  type ForwardedRef,
  type ReactElement,
  type RefAttributes,
} from "react";

import { createMiaixzUiError } from "../../errors/index.js";
import { useMiaixzLocale } from "../../i18n/index.js";
import {
  MiaixzOptionPicker,
  useStableMiaixzComboboxControlModes,
  validateMiaixzComboboxInputControl,
  validateMiaixzComboboxValueControl,
} from "../combobox/combobox.js";
import type { MiaixzOption } from "../combobox/index.js";
import type { PickerProps } from "./picker.types.js";

/**
 * Renders the public multiple-value Picker adapter.
 *
 * @typeParam Value - Stable string value selected by the control.
 * @param props - Public multiple-value combobox configuration.
 * @param forwardedRef - Forwarded root div reference.
 * @returns A searchable multiple-value WAI-ARIA combobox.
 */
function PickerImplementation<Value extends string = string>(
  props: PickerProps<Value>,
  forwardedRef: ForwardedRef<HTMLDivElement>,
) {
  const {
    options,
    loadOptions,
    value,
    defaultValue,
    onValueChange,
    inputValue,
    defaultInputValue,
    onInputValueChange,
    label,
    placeholder,
    emptyMessage,
    loadingMessage,
    errorMessage,
    disabled = false,
    readOnly = false,
    invalid = false,
    previewState,
    "aria-invalid": ariaInvalid,
    selectionLimit,
    ...rootProps
  } = props;
  const isInvalid = invalid || ariaInvalid === true || ariaInvalid === "true";
  const { t } = useMiaixzLocale();
  const valueControlled = value !== undefined;
  const inputControlled = inputValue !== undefined;
  validateMiaixzComboboxValueControl(
    t,
    valueControlled,
    defaultValue !== undefined,
    onValueChange !== undefined,
  );
  validateMiaixzComboboxInputControl(
    t,
    inputControlled,
    defaultInputValue !== undefined,
    onInputValueChange !== undefined,
  );
  validateMiaixzSelectionLimit(t, selectionLimit);
  useStableMiaixzComboboxControlModes(t, valueControlled, inputControlled);

  const [internalValue, setInternalValue] = useState<readonly Value[]>(defaultValue ?? []);
  const [internalInputValue, setInternalInputValue] = useState(defaultInputValue ?? "");
  const selectedValues = valueControlled ? value : internalValue;
  const currentInputValue = inputControlled ? inputValue : internalInputValue;
  const selectedValueSet = useMemo(() => new Set(selectedValues), [selectedValues]);

  const updateInputValue = useCallback(
    (nextValue: string) => {
      if (!inputControlled) setInternalInputValue(nextValue);
      onInputValueChange?.(nextValue);
    },
    [inputControlled, onInputValueChange],
  );
  const updateSelectedValues = useCallback(
    (nextValues: readonly Value[]) => {
      if (!valueControlled) setInternalValue(nextValues);
      onValueChange?.(nextValues);
    },
    [onValueChange, valueControlled],
  );
  const selectOption = useCallback(
    (option: MiaixzOption<Value>) => {
      const selected = selectedValueSet.has(option.value);
      const nextValues = selected
        ? selectedValues.filter((selectedValue) => selectedValue !== option.value)
        : [...selectedValues, option.value];
      updateSelectedValues(nextValues);
      updateInputValue("");
    },
    [selectedValueSet, selectedValues, updateInputValue, updateSelectedValues],
  );
  const removeOption = useCallback(
    (optionValue: Value) => {
      updateSelectedValues(selectedValues.filter((selectedValue) => selectedValue !== optionValue));
    },
    [selectedValues, updateSelectedValues],
  );
  const isOptionSelectionDisabled = useCallback(
    (optionValue: Value) =>
      selectionLimit !== undefined &&
      selectedValues.length >= selectionLimit &&
      !selectedValueSet.has(optionValue),
    [selectedValueSet, selectedValues.length, selectionLimit],
  );

  return (
    <MiaixzOptionPicker
      component="picker"
      rootProps={rootProps}
      forwardedRef={forwardedRef}
      options={options}
      loadOptions={loadOptions}
      selectedValues={selectedValues}
      onOptionSelect={selectOption}
      onOptionRemove={removeOption}
      isOptionSelected={(optionValue) => selectedValueSet.has(optionValue)}
      isOptionSelectionDisabled={isOptionSelectionDisabled}
      inputValue={currentInputValue}
      onInputValueChange={updateInputValue}
      label={label}
      placeholder={placeholder}
      emptyMessage={emptyMessage}
      loadingMessage={loadingMessage}
      errorMessage={errorMessage}
      disabled={disabled}
      readOnly={readOnly}
      invalid={isInvalid}
      previewState={previewState}
    />
  );
}

/**
 * Renders a searchable multiple-value WAI-ARIA combobox.
 *
 * @public
 */
export const Picker = forwardRef(PickerImplementation) as <Value extends string = string>(
  props: PickerProps<Value> & RefAttributes<HTMLDivElement>,
) => ReactElement;

/**
 * Validates the optional multiple-selection limit.
 *
 * @param translate - Active localized message resolver.
 * @param selectionLimit - Optional maximum simultaneous selection count.
 */
function validateMiaixzSelectionLimit(
  translate: ReturnType<typeof useMiaixzLocale>["t"],
  selectionLimit: number | undefined,
): void {
  if (selectionLimit !== undefined && (!Number.isInteger(selectionLimit) || selectionLimit <= 0)) {
    throw createMiaixzUiError(translate, {
      code: "UI_SELECTION_LIMIT_INVALID",
      messageKey: "ui.error.selection.limitInvalid",
    });
  }
}

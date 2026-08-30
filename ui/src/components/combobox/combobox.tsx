import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ForwardedRef,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactElement,
  type RefAttributes,
} from "react";
import { createPortal } from "react-dom";

import { createMiaixzUiError } from "../../errors/index.js";
import { useMiaixzLocale, type MiaixzTranslator } from "../../i18n/index.js";
import { classNames } from "../../internal/class-names.js";
import {
  useMiaixzDismissibleLayer,
  useMiaixzFloatingPosition,
  useMiaixzManualPopover,
  useMiaixzPortalTarget,
} from "../../internal/overlay/index.js";
import { useMergedRef } from "../../internal/use-merged-ref.js";
import { Icon } from "../icon/index.js";
import type { ComboboxProps, MiaixzOption, MiaixzOptionLoader } from "./combobox.types.js";

/**
 * Defines the frozen asynchronous query debounce interval in milliseconds.
 */
const miaixzComboboxDebounceMilliseconds = 200;

/**
 * Tracks the controlled mode selected during the first render.
 */
interface MiaixzComboboxControlModes {
  /**
   * Identifies whether selection is controlled.
   */
  readonly value: boolean;

  /**
   * Identifies whether search input is controlled.
   */
  readonly input: boolean;
}

/**
 * Configures the private option-picker implementation shared by both public controls.
 *
 * @typeParam Value - Stable string value selected by the control.
 */
export interface MiaixzOptionPickerProps<Value extends string> {
  /**
   * Selects the public component identity and class namespace.
   */
  readonly component: "combobox" | "multi-select";

  /**
   * Supplies native root div attributes.
   */
  readonly rootProps: HTMLAttributes<HTMLDivElement>;

  /**
   * Receives the public root reference.
   */
  readonly forwardedRef: ForwardedRef<HTMLDivElement>;

  /**
   * Supplies the static option source.
   */
  readonly options: readonly MiaixzOption<Value>[] | undefined;

  /**
   * Supplies the asynchronous option source.
   */
  readonly loadOptions: MiaixzOptionLoader<Value> | undefined;

  /**
   * Supplies the current ordered selected values.
   */
  readonly selectedValues: readonly Value[];

  /**
   * Receives an option activation request.
   */
  readonly onOptionSelect: (option: MiaixzOption<Value>) => void;

  /**
   * Receives a selected-value removal request.
   */
  readonly onOptionRemove: ((value: Value) => void) | undefined;

  /**
   * Reports whether the value is selected.
   */
  readonly isOptionSelected: (value: Value) => boolean;

  /**
   * Reports whether the current selection state disables an otherwise enabled option.
   */
  readonly isOptionSelectionDisabled: (value: Value) => boolean;

  /**
   * Supplies the current search input.
   */
  readonly inputValue: string;

  /**
   * Receives requested search-input changes.
   */
  readonly onInputValueChange: (value: string) => void;

  /**
   * Supplies the visible and accessible field label.
   */
  readonly label: string;

  /**
   * Supplies optional input placeholder copy.
   */
  readonly placeholder: string | undefined;

  /**
   * Supplies optional empty-result copy.
   */
  readonly emptyMessage: string | undefined;

  /**
   * Supplies optional asynchronous loading copy.
   */
  readonly loadingMessage: string | undefined;

  /**
   * Supplies optional asynchronous failure copy.
   */
  readonly errorMessage: string | undefined;

  /**
   * Disables the complete composite control.
   */
  readonly disabled: boolean;
}

/**
 * Renders the public single-value Combobox adapter.
 *
 * @typeParam Value - Stable string value selected by the control.
 * @param props - Public single-value combobox configuration.
 * @param forwardedRef - Forwarded root div reference.
 * @returns A searchable single-value WAI-ARIA combobox.
 */
function ComboboxImplementation<Value extends string = string>(
  props: ComboboxProps<Value>,
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
    ...rootProps
  } = props;
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
  useStableMiaixzComboboxControlModes(t, valueControlled, inputControlled);

  const [internalValue, setInternalValue] = useState<Value | null>(defaultValue ?? null);
  const [internalInputValue, setInternalInputValue] = useState(defaultInputValue ?? "");
  const selectedValue = valueControlled ? value : internalValue;
  const currentInputValue = inputControlled ? inputValue : internalInputValue;
  const selectedValues = useMemo(
    () => (selectedValue === null ? [] : [selectedValue]),
    [selectedValue],
  );

  const updateInputValue = useCallback(
    (nextValue: string) => {
      if (!inputControlled) setInternalInputValue(nextValue);
      onInputValueChange?.(nextValue);
    },
    [inputControlled, onInputValueChange],
  );
  const selectOption = useCallback(
    (option: MiaixzOption<Value>) => {
      if (!valueControlled) setInternalValue(option.value);
      onValueChange?.(option.value);
      updateInputValue(option.label);
    },
    [onValueChange, updateInputValue, valueControlled],
  );

  return (
    <MiaixzOptionPicker
      component="combobox"
      rootProps={rootProps}
      forwardedRef={forwardedRef}
      options={options}
      loadOptions={loadOptions}
      selectedValues={selectedValues}
      onOptionSelect={selectOption}
      onOptionRemove={undefined}
      isOptionSelected={(optionValue) => optionValue === selectedValue}
      isOptionSelectionDisabled={() => false}
      inputValue={currentInputValue}
      onInputValueChange={updateInputValue}
      label={label}
      placeholder={placeholder}
      emptyMessage={emptyMessage}
      loadingMessage={loadingMessage}
      errorMessage={errorMessage}
      disabled={disabled}
    />
  );
}

/**
 * Renders a searchable single-value WAI-ARIA combobox.
 *
 * @public
 */
export const Combobox = forwardRef(ComboboxImplementation) as <Value extends string = string>(
  props: ComboboxProps<Value> & RefAttributes<HTMLDivElement>,
) => ReactElement;

/**
 * Renders the shared searchable option-picker surface.
 *
 * @typeParam Value - Stable string value selected by the control.
 * @param props - Private option-picker configuration.
 * @returns A Portal-backed WAI-ARIA combobox and listbox.
 */
export function MiaixzOptionPicker<Value extends string>(props: MiaixzOptionPickerProps<Value>) {
  const {
    component,
    rootProps,
    forwardedRef,
    options,
    loadOptions,
    selectedValues,
    onOptionSelect,
    onOptionRemove,
    isOptionSelected,
    isOptionSelectionDisabled,
    inputValue,
    onInputValueChange,
    label,
    placeholder,
    emptyMessage,
    loadingMessage,
    errorMessage,
    disabled,
  } = props;
  const { t } = useMiaixzLocale();
  validateMiaixzComboboxOptionSource(t, options, loadOptions);

  const { className, ...nativeRootProps } = rootProps;
  const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null);
  const rootRef = useMergedRef(forwardedRef, setRootElement);
  const controlRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loadedOptions, setLoadedOptions] = useState<readonly MiaixzOption<Value>[]>([]);
  const [knownOptions, setKnownOptions] = useState<ReadonlyMap<Value, MiaixzOption<Value>>>(
    () => new Map(),
  );
  const [loading, setLoading] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const requestSequenceRef = useRef(0);
  const listboxId = useId();
  const labelId = useId();
  const optionIdPrefix = useId();
  const portalTarget = useMiaixzPortalTarget(rootElement);
  const asynchronous = loadOptions !== undefined;
  const visibleOptions = useMemo(
    () => (asynchronous ? loadedOptions : filterMiaixzComboboxOptions(options ?? [], inputValue)),
    [asynchronous, inputValue, loadedOptions, options],
  );
  const selectedOptionMap = useMemo(
    () => createMiaixzSelectedOptionMap(options, knownOptions, selectedValues),
    [knownOptions, options, selectedValues],
  );

  const close = useCallback((restoreFocus: boolean) => {
    setOpen(false);
    setActiveIndex(-1);
    setLoading(false);
    if (restoreFocus) queueMicrotask(() => inputRef.current?.focus({ preventScroll: true }));
  }, []);
  const prepareAsynchronousQuery = useCallback(() => {
    if (!asynchronous) return;
    setLoading(true);
    setLoadFailed(false);
    setLoadedOptions([]);
  }, [asynchronous]);
  const openListbox = useCallback(() => {
    if (disabled) return;
    if (!open) prepareAsynchronousQuery();
    setOpen(true);
  }, [disabled, open, prepareAsynchronousQuery]);

  useMiaixzManualPopover(surfaceRef, open, portalTarget);
  useMiaixzFloatingPosition(controlRef, surfaceRef, open, "bottom-start", portalTarget);
  useMiaixzDismissibleLayer({
    active: open,
    triggerRef: controlRef,
    contentRef: surfaceRef,
    portalTarget,
    onDismiss: () => close(true),
  });

  useEffect(() => {
    if (!disabled || !open) return;
    queueMicrotask(() => close(false));
  }, [close, disabled, open]);

  useEffect(() => {
    if (!open || loadOptions === undefined) return undefined;
    const controller = new AbortController();
    const sequence = requestSequenceRef.current + 1;
    requestSequenceRef.current = sequence;
    const timer = window.setTimeout(() => {
      void loadOptions(inputValue, controller.signal)
        .then((result) => {
          if (controller.signal.aborted || requestSequenceRef.current !== sequence) return;
          setLoadedOptions(result);
          setKnownOptions((currentOptions) => mergeMiaixzKnownOptions(currentOptions, result));
          setLoadFailed(false);
          setLoading(false);
        })
        .catch(() => {
          if (controller.signal.aborted || requestSequenceRef.current !== sequence) return;
          setLoadedOptions([]);
          setLoadFailed(true);
          setLoading(false);
        });
    }, miaixzComboboxDebounceMilliseconds);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [inputValue, loadOptions, open]);

  const resolvedActiveIndex =
    open &&
    !loading &&
    !loadFailed &&
    isMiaixzComboboxOptionEnabled(visibleOptions[activeIndex], isOptionSelectionDisabled)
      ? activeIndex
      : open && !loading && !loadFailed
        ? findMiaixzComboboxEnabledOption(visibleOptions, isOptionSelectionDisabled, 0, 1)
        : -1;

  const activateOption = useCallback(
    (option: MiaixzOption<Value>) => {
      if (!isMiaixzComboboxOptionEnabled(option, isOptionSelectionDisabled)) return;
      onOptionSelect(option);
      if (component === "combobox") close(false);
    },
    [close, component, isOptionSelectionDisabled, onOptionSelect],
  );
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        if (!open) {
          openListbox();
          return;
        }
        const direction = event.key === "ArrowDown" ? 1 : -1;
        setActiveIndex((currentIndex) =>
          findMiaixzComboboxEnabledOption(
            visibleOptions,
            isOptionSelectionDisabled,
            (currentIndex < 0 ? resolvedActiveIndex : currentIndex) + direction,
            direction,
          ),
        );
        return;
      }
      if (event.key === "Home" && open) {
        event.preventDefault();
        setActiveIndex(
          findMiaixzComboboxEnabledOption(visibleOptions, isOptionSelectionDisabled, 0, 1),
        );
        return;
      }
      if (event.key === "End" && open) {
        event.preventDefault();
        setActiveIndex(
          findMiaixzComboboxEnabledOption(
            visibleOptions,
            isOptionSelectionDisabled,
            visibleOptions.length - 1,
            -1,
          ),
        );
        return;
      }
      if (event.key === "Enter" && open) {
        const option = visibleOptions[resolvedActiveIndex];
        if (option !== undefined) {
          event.preventDefault();
          activateOption(option);
        }
        return;
      }
      if (event.key === "Escape" && open) {
        event.preventDefault();
        close(true);
      }
      if (event.key === "Tab" && open) close(false);
    },
    [
      activateOption,
      close,
      isOptionSelectionDisabled,
      open,
      openListbox,
      resolvedActiveIndex,
      visibleOptions,
    ],
  );

  const activeOptionId =
    open && resolvedActiveIndex >= 0
      ? `${optionIdPrefix}-option-${resolvedActiveIndex}`
      : undefined;
  const status = loadFailed ? "error" : loading ? "loading" : "ready";
  const state = disabled ? "disabled" : open ? "open" : "closed";

  return (
    <div
      {...nativeRootProps}
      ref={rootRef}
      className={classNames(`miaixz-${component}`, className)}
      data-state={state}
      data-disabled={disabled || undefined}
    >
      <label id={labelId} className={`miaixz-${component}-label`}>
        {label}
      </label>
      <div
        ref={controlRef}
        className={classNames("miaixz-control", `miaixz-${component}-control`)}
        data-state={state}
        data-disabled={disabled || undefined}
      >
        {component === "multi-select" && selectedValues.length > 0 && (
          <div className="miaixz-multi-select-tags">
            {selectedValues.map((selectedValue) => {
              const selectedOption = selectedOptionMap.get(selectedValue);
              return (
                <span key={selectedValue} className="miaixz-multi-select-tag">
                  <span className="miaixz-multi-select-tag-label">
                    {selectedOption?.label ?? selectedValue}
                  </span>
                  <button
                    type="button"
                    className="miaixz-multi-select-tag-remove"
                    aria-label={`${t("ui.action.remove")} ${selectedOption?.label ?? selectedValue}`}
                    disabled={disabled}
                    onClick={() => onOptionRemove?.(selectedValue)}
                  >
                    <Icon name="X" size="indicator" />
                  </button>
                </span>
              );
            })}
          </div>
        )}
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          className={`miaixz-${component}-input`}
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={open}
          aria-labelledby={labelId}
          aria-activedescendant={activeOptionId}
          autoComplete="off"
          value={inputValue}
          placeholder={placeholder}
          disabled={disabled}
          onFocus={openListbox}
          onClick={openListbox}
          onChange={(event) => {
            prepareAsynchronousQuery();
            onInputValueChange(event.currentTarget.value);
            openListbox();
          }}
          onKeyDown={handleKeyDown}
        />
        {component === "multi-select" && (
          <output className="miaixz-multi-select-count" aria-live="polite">
            {selectedValues.length}
          </output>
        )}
        <button
          type="button"
          className={`miaixz-${component}-toggle`}
          aria-label={label}
          aria-controls={listboxId}
          aria-expanded={open}
          disabled={disabled}
          tabIndex={-1}
          onClick={() => {
            if (open) close(false);
            else openListbox();
            inputRef.current?.focus({ preventScroll: true });
          }}
        >
          <Icon name="ChevronDown" size="control" />
        </button>
      </div>
      {open &&
        portalTarget !== null &&
        createPortal(
          <div
            ref={surfaceRef}
            popover="manual"
            role="region"
            aria-labelledby={labelId}
            className={`miaixz-${component}-surface`}
            data-state={status}
          >
            {loading ? (
              <div id={listboxId} className={`miaixz-${component}-message`} role="status">
                <Icon name="LoaderCircle" size="control" className="miaixz-icon-spin" />
                {loadingMessage ?? t("ui.loading")}
              </div>
            ) : loadFailed ? (
              <div id={listboxId} className={`miaixz-${component}-message`} role="alert">
                {errorMessage ?? t("ui.combobox.loadError")}
              </div>
            ) : visibleOptions.length === 0 ? (
              <div id={listboxId} className={`miaixz-${component}-message`} role="status">
                {emptyMessage ?? "—"}
              </div>
            ) : (
              <div
                id={listboxId}
                role="listbox"
                aria-labelledby={labelId}
                aria-multiselectable={component === "multi-select" || undefined}
                className={`miaixz-${component}-listbox`}
              >
                {visibleOptions.map((option, index) => {
                  const selected = isOptionSelected(option.value);
                  const optionDisabled =
                    option.disabled === true || isOptionSelectionDisabled(option.value);
                  return (
                    <div
                      key={option.value}
                      id={`${optionIdPrefix}-option-${index}`}
                      role="option"
                      aria-label={option.label}
                      aria-selected={selected}
                      aria-disabled={optionDisabled || undefined}
                      className={`miaixz-${component}-option`}
                      data-state={index === resolvedActiveIndex ? "active" : "idle"}
                      data-disabled={optionDisabled || undefined}
                      onPointerMove={() => {
                        if (!optionDisabled) setActiveIndex(index);
                      }}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => activateOption(option)}
                    >
                      <span className={`miaixz-${component}-option-copy`}>
                        <span className={`miaixz-${component}-option-label`}>{option.label}</span>
                        {option.description !== undefined && (
                          <span className={`miaixz-${component}-option-description`}>
                            {option.description}
                          </span>
                        )}
                      </span>
                      {selected && <Icon name="Check" size="control" />}
                    </div>
                  );
                })}
              </div>
            )}
          </div>,
          portalTarget,
        )}
    </div>
  );
}

/**
 * Validates the mutually exclusive static and asynchronous option sources.
 *
 * @typeParam Value - Stable string value returned by the source.
 * @param translate - Active localized message resolver.
 * @param options - Optional static option source.
 * @param loadOptions - Optional asynchronous option source.
 */
function validateMiaixzComboboxOptionSource<Value extends string>(
  translate: MiaixzTranslator,
  options: readonly MiaixzOption<Value>[] | undefined,
  loadOptions: MiaixzOptionLoader<Value> | undefined,
): void {
  if ((options === undefined) === (loadOptions === undefined)) {
    throw createMiaixzUiError(translate, {
      code: "UI_OPTIONS_SOURCE_INVALID",
      messageKey: "ui.error.options.sourceInvalid",
    });
  }
}

/**
 * Validates the selected-value controlled and uncontrolled contract.
 *
 * @param translate - Active localized message resolver.
 * @param controlled - Whether a controlled value was supplied.
 * @param hasDefault - Whether an uncontrolled default was supplied.
 * @param hasChangeHandler - Whether requested changes can be observed.
 */
export function validateMiaixzComboboxValueControl(
  translate: MiaixzTranslator,
  controlled: boolean,
  hasDefault: boolean,
  hasChangeHandler: boolean,
): void {
  if (controlled && (!hasChangeHandler || hasDefault)) {
    throw createMiaixzUiError(translate, {
      code: "UI_CONTROLLED_VALUE_INVALID",
      messageKey: "ui.error.controlled.valueInvalid",
    });
  }
}

/**
 * Validates the search-input controlled and uncontrolled contract.
 *
 * @param translate - Active localized message resolver.
 * @param controlled - Whether a controlled input value was supplied.
 * @param hasDefault - Whether an uncontrolled input default was supplied.
 * @param hasChangeHandler - Whether requested changes can be observed.
 */
export function validateMiaixzComboboxInputControl(
  translate: MiaixzTranslator,
  controlled: boolean,
  hasDefault: boolean,
  hasChangeHandler: boolean,
): void {
  if (controlled && (!hasChangeHandler || hasDefault)) {
    throw createMiaixzUiError(translate, {
      code: "UI_CONTROLLED_INPUT_INVALID",
      messageKey: "ui.error.controlled.inputInvalid",
    });
  }
}

/**
 * Freezes selection and input control modes for the mounted component lifetime.
 *
 * @param translate - Active localized message resolver.
 * @param valueControlled - Current selected-value control mode.
 * @param inputControlled - Current search-input control mode.
 */
export function useStableMiaixzComboboxControlModes(
  translate: MiaixzTranslator,
  valueControlled: boolean,
  inputControlled: boolean,
): void {
  const [initialModes] = useState<MiaixzComboboxControlModes>({
    value: valueControlled,
    input: inputControlled,
  });
  if (initialModes.value !== valueControlled || initialModes.input !== inputControlled) {
    throw createMiaixzUiError(translate, {
      code: "UI_CONTROL_MODE_CHANGED",
      messageKey: "ui.error.controlled.modeChanged",
    });
  }
}

/**
 * Filters static options by Unicode-lowercased label while preserving source order.
 *
 * @typeParam Value - Stable string value carried by each option.
 * @param options - Ordered static option source.
 * @param query - Current search input.
 * @returns Options whose labels contain the normalized query.
 */
function filterMiaixzComboboxOptions<Value extends string>(
  options: readonly MiaixzOption<Value>[],
  query: string,
): readonly MiaixzOption<Value>[] {
  const normalizedQuery = query.toLocaleLowerCase();
  if (normalizedQuery.length === 0) return options;
  return options.filter((option) => option.label.toLocaleLowerCase().includes(normalizedQuery));
}

/**
 * Finds the next enabled option without wrapping past the collection boundary.
 *
 * @typeParam Value - Stable string value carried by each option.
 * @param options - Current ordered visible options.
 * @param isSelectionDisabled - Selection-limit predicate.
 * @param startIndex - First candidate index.
 * @param direction - Search direction expressed as one or negative one.
 * @returns Enabled option index, or negative one when no candidate remains.
 */
function findMiaixzComboboxEnabledOption<Value extends string>(
  options: readonly MiaixzOption<Value>[],
  isSelectionDisabled: (value: Value) => boolean,
  startIndex: number,
  direction: 1 | -1,
): number {
  for (
    let index = Math.min(Math.max(startIndex, 0), Math.max(options.length - 1, 0));
    index >= 0 && index < options.length;
    index += direction
  ) {
    if (isMiaixzComboboxOptionEnabled(options[index], isSelectionDisabled)) return index;
  }
  return -1;
}

/**
 * Reports whether an option accepts pointer or keyboard activation.
 *
 * @typeParam Value - Stable string value carried by the option.
 * @param option - Optional candidate at the requested index.
 * @param isSelectionDisabled - Selection-limit predicate.
 * @returns Whether the option exists and remains selectable.
 */
function isMiaixzComboboxOptionEnabled<Value extends string>(
  option: MiaixzOption<Value> | undefined,
  isSelectionDisabled: (value: Value) => boolean,
): option is MiaixzOption<Value> {
  return option !== undefined && option.disabled !== true && !isSelectionDisabled(option.value);
}

/**
 * Retains labels for selected values across static and asynchronous result changes.
 *
 * @typeParam Value - Stable string value carried by each option.
 * @param staticOptions - Optional static option collection.
 * @param knownOptions - Persisted metadata from successful asynchronous results.
 * @param selectedValues - Current selected values.
 * @returns Map containing available selected-option metadata.
 */
function createMiaixzSelectedOptionMap<Value extends string>(
  staticOptions: readonly MiaixzOption<Value>[] | undefined,
  knownOptions: ReadonlyMap<Value, MiaixzOption<Value>>,
  selectedValues: readonly Value[],
): ReadonlyMap<Value, MiaixzOption<Value>> {
  const selected = new Set(selectedValues);
  const result = new Map<Value, MiaixzOption<Value>>();
  for (const option of [...(staticOptions ?? []), ...knownOptions.values()]) {
    if (selected.has(option.value)) result.set(option.value, option);
  }
  return result;
}

/**
 * Merges a successful asynchronous result into persistent option metadata.
 *
 * @typeParam Value - Stable string value carried by each option.
 * @param currentOptions - Option metadata retained from earlier successful requests.
 * @param loadedOptions - Complete result returned by the latest successful request.
 * @returns A new map retaining every known value and its latest metadata.
 */
function mergeMiaixzKnownOptions<Value extends string>(
  currentOptions: ReadonlyMap<Value, MiaixzOption<Value>>,
  loadedOptions: readonly MiaixzOption<Value>[],
): ReadonlyMap<Value, MiaixzOption<Value>> {
  const nextOptions = new Map(currentOptions);
  for (const option of loadedOptions) nextOptions.set(option.value, option);
  return nextOptions;
}

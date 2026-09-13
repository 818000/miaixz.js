/*
 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
 ~                                                                           ~
 ~ Copyright (c) 2015-2026 miaixz.org and other contributors.                ~
 ~                                                                           ~
 ~ Licensed under the Apache License, Version 2.0 (the "License");           ~
 ~ you may not use this file except in compliance with the License.          ~
 ~ You may obtain a copy of the License at                                   ~
 ~                                                                           ~
 ~      https://www.apache.org/licenses/LICENSE-2.0                          ~
 ~                                                                           ~
 ~ Unless required by applicable law or agreed to in writing, software       ~
 ~ distributed under the License is distributed on an "AS IS" BASIS,         ~
 ~ WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  ~
 ~ See the License for the specific language governing permissions and       ~
 ~ limitations under the License.                                            ~
 ~                                                                           ~
 ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~ ~
*/

import {
  forwardRef,
  useCallback,
  useContext,
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

import { useMiaixzLocale } from "../../i18n/i18n.js";
import { MiaixzUiError } from "../../errors/ui-error.js";
import { MiaixzCollectionController } from "../../shared/collection/controller.js";
import { MiaixzFieldContext, useFieldControl } from "../../shared/field-context.js";
import { useMiaixzOptionSurface } from "../../shared/option-surface.js";
import { useMiaixzDismissibleLayer } from "../../shared/overlay/dismissible-layer.js";
import { useMiaixzPortalTarget } from "../../shared/overlay/portal-target.js";
import { useMiaixzManualPopover } from "../../shared/overlay/top-layer.js";
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
import { useControlled } from "../../shared/use-controlled.js";
import { useFormReset } from "../../shared/use-form-reset.js";
import { ComboboxInput } from "./combobox-input.js";
import { ComboboxListbox } from "./combobox-listbox.js";
import { ComboboxPopup } from "./combobox-popup.js";
import { useComboboxController } from "./combobox-controller.js";
import type {
  ComboboxOwnerState,
  ComboboxProps,
  ComboboxRootAttributes,
  MiaixzOption,
  MiaixzOptionSource,
} from "./combobox.types.js";
import { withMiaixzThemeComponent } from "../../theme/themed-component.js";

/**
 * Renders the public single-value Combobox composition.
 *
 * @typeParam Value - Stable option value type.
 * @param props - Closed option, value, input, and slot configuration.
 * @param forwardedRef - Forwarded root div reference.
 * @returns A searchable single-selection combobox.
 */
function ComboboxImplementation<Value extends string = string>(
  props: ComboboxProps<Value>,
  forwardedRef: ForwardedRef<HTMLDivElement>,
) {
  const {
    label,
    id,
    name,
    form,
    placeholder,
    emptyMessage,
    loadingMessage,
    errorMessage,
    refineMessage,
    disabled,
    readOnly: explicitReadOnly = false,
    invalid,
    required,
    renderOption,
    slotProps,
    className,
    style,
    value,
    defaultValue,
    onValueChange,
    inputValue,
    defaultInputValue,
    onInputValueChange,
    options,
    loadOptions,
    "aria-invalid": ariaInvalid,
    "aria-labelledby": ariaLabelledBy,
    "aria-describedby": ariaDescribedBy,
    ...nativeRootProps
  } = props;
  const fieldContext = useContext(MiaixzFieldContext);
  const fieldProps = useFieldControl({
    ...(id === undefined ? {} : { id }),
    ...(required === undefined ? {} : { required }),
    ...(disabled === undefined ? {} : { disabled }),
    ...(invalid === undefined ? {} : { invalid }),
    ...(ariaInvalid === undefined ? {} : { "aria-invalid": ariaInvalid }),
    ...(ariaLabelledBy === undefined ? {} : { "aria-labelledby": ariaLabelledBy }),
    ...(ariaDescribedBy === undefined ? {} : { "aria-describedby": ariaDescribedBy }),
  });
  const effectiveDisabled = fieldProps.disabled ?? false;
  const effectiveInvalid = fieldProps.invalid ?? false;
  const valueControlled = "value" in props;
  const initialValue = defaultValue ?? null;
  const valueState = useControlled<MiaixzOption<Value> | null>({
    controlled: valueControlled,
    value,
    defaultValue: initialValue,
    hasDefaultValue: valueControlled && "defaultValue" in props,
    ...(onValueChange === undefined ? {} : { onValueChange }),
    readOnly: true,
  });
  const initialInputValue = defaultInputValue ?? initialValue?.textValue ?? value?.textValue ?? "";
  const inputControlled = "inputValue" in props;
  const inputState = useControlled<string>({
    controlled: inputControlled,
    value: inputValue,
    defaultValue: initialInputValue,
    hasDefaultValue: inputControlled && "defaultInputValue" in props,
    ...(onInputValueChange === undefined ? {} : { onValueChange: onInputValueChange }),
  });
  const readOnly = explicitReadOnly || valueState.readOnly;
  if ((options === undefined) === (loadOptions === undefined)) {
    throw new MiaixzUiError({
      code: "UI_OPTIONS_SOURCE_INVALID",
    });
  }
  const source: MiaixzOptionSource<Value> =
    options === undefined ? { loadOptions: loadOptions! } : { options };
  const [open, setOpen] = useState(false);
  const data = useComboboxController({ source, query: inputState.value, open });
  const [activeValue, setActiveValue] = useState<Value | null>(null);
  const collectionItems = useMemo(
    () =>
      data.options.map((option) => ({
        id: option.value,
        value: option.value,
        textValue: option.textValue,
        disabled: option.disabled === true || readOnly,
      })),
    [data.options, readOnly],
  );
  const collection = useMemo(
    () => new MiaixzCollectionController(collectionItems, activeValue),
    [activeValue, collectionItems],
  );
  const resolvedActiveValue = open ? (collection.activeId as Value | null) : null;
  const inputRef = useRef<HTMLInputElement>(null);
  const controlRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [rootElement, setRootElement] = useState<HTMLDivElement | null>(null);
  const listboxId = useId();
  const generatedLabelId = useId();
  const optionIdPrefix = useId();
  const labelId = fieldProps["aria-labelledby"] ?? generatedLabelId;
  const portalTarget = useMiaixzPortalTarget(rootElement);
  const { t } = useMiaixzLocale();
  const ownerState: ComboboxOwnerState = {
    disabled: effectiveDisabled,
    readOnly,
    invalid: effectiveInvalid,
    open,
    filled: valueState.value !== null || inputState.value.length > 0,
    loading: data.state === "loading",
  };

  const close = useCallback(
    (restoreFocus: boolean) => {
      setOpen(false);
      setActiveValue(null);
      if (restoreFocus) queueMicrotask(() => inputRef.current?.focus({ preventScroll: true }));
    },
    [setActiveValue, setOpen],
  );
  const openListbox = useCallback(() => {
    if (effectiveDisabled) return;
    collection.setActiveId(valueState.value?.value ?? null);
    setActiveValue(collection.activeId as Value | null);
    setOpen(true);
  }, [collection, effectiveDisabled, setActiveValue, setOpen, valueState.value?.value]);
  const selectOption = useCallback(
    (option: MiaixzOption<Value>) => {
      if (readOnly || option.disabled === true) return;
      valueState.setValue(option);
      inputState.setValue(option.textValue);
      close(false);
    },
    [close, inputState, readOnly, valueState],
  );
  const updateInput = useCallback(
    (nextInput: string) => {
      inputState.setValue(nextInput);
      if (valueState.value !== null && nextInput !== valueState.value.textValue) {
        valueState.setValue(null);
      }
      setOpen(true);
    },
    [inputState, valueState],
  );
  const clear = useCallback(() => {
    if (readOnly) return;
    valueState.setValue(null);
    inputState.setValue("");
    setOpen(true);
    inputRef.current?.focus({ preventScroll: true });
  }, [inputState, readOnly, valueState]);
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Escape" && open) {
        event.preventDefault();
        close(true);
        return;
      }
      if (event.key === "Tab" && open) {
        close(false);
        return;
      }
      if (!open) {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          openListbox();
        }
        return;
      }
      if (!["ArrowDown", "ArrowUp", "Home", "End", "Enter"].includes(event.key)) return;
      const result = collection.handleKey(event.key, {
        orientation: "vertical",
        direction: "ltr",
        loop: true,
      });
      if (!result.handled) return;
      event.preventDefault();
      setActiveValue(result.activeId as Value | null);
      if (result.activate && result.activeId !== null) {
        const option = data.options.find((candidate) => candidate.value === result.activeId);
        if (option !== undefined) selectOption(option);
      }
    },
    [close, collection, data.options, open, openListbox, selectOption, setActiveValue],
  );
  useFormReset(inputRef, () => {
    valueState.resetValue(initialValue);
    inputState.resetValue(initialInputValue);
    close(false);
  });
  useMiaixzManualPopover(surfaceRef, open, portalTarget);
  const activeOptionId =
    open && resolvedActiveValue !== null ? `${optionIdPrefix}-${resolvedActiveValue}` : undefined;
  useMiaixzOptionSurface(controlRef, surfaceRef, open, portalTarget, activeOptionId);
  useMiaixzDismissibleLayer({
    active: open,
    triggerRef: controlRef,
    contentRef: surfaceRef,
    portalTarget,
    onDismiss: () => close(true),
  });

  /* eslint-disable react-hooks/refs --
   * Canonical slot merging only composes the forwarded and slot refs; it does not inspect them.
   */
  const rootProps = mergeMiaixzSlotProps<
    ComboboxOwnerState,
    ComboboxRootAttributes,
    HTMLDivElement
  >({
    ownerState,
    defaultProps: { className: "miaixz-combobox" },
    componentProps: {
      ...nativeRootProps,
      ...(className === undefined ? {} : { className }),
      ...(style === undefined ? {} : { style }),
    } as HTMLAttributes<HTMLDivElement>,
    slotProps: slotProps?.root,
    internalRef: setRootElement,
    forwardedRef,
    internalProps: {
      "data-state": open ? "open" : "closed",
      ...(effectiveDisabled ? { "data-disabled": true } : {}),
      ...(readOnly ? { "data-readonly": true } : {}),
      ...(effectiveInvalid ? { "data-invalid": true } : {}),
      ...(ownerState.filled ? { "data-filled": true } : {}),
    },
    ownedProps: ["data-state", "data-disabled", "data-readonly", "data-invalid", "data-filled"],
  });
  /* eslint-enable react-hooks/refs --
   * Resume ref access validation after the canonical merge boundary.
   */
  const labelProps = mergeMiaixzSlotProps({
    ownerState,
    defaultProps: { className: "miaixz-combobox-label" },
    slotProps: slotProps?.label,
    internalProps: { id: generatedLabelId, htmlFor: fieldProps.id },
    ownedProps: ["id", "htmlFor"],
  });
  const hiddenProps = mergeMiaixzSlotProps({
    ownerState,
    defaultProps: { className: "miaixz-combobox-native" },
    slotProps: slotProps?.hiddenInput,
    internalProps: {
      type: "hidden",
      value: valueState.value?.value ?? "",
      ...(name === undefined ? {} : { name }),
      ...(form === undefined ? {} : { form }),
      disabled: effectiveDisabled,
    },
    ownedProps: ["type", "value", "name", "form", "disabled"],
  });

  return (
    <div {...rootProps}>
      {fieldContext === null && <label {...labelProps}>{label}</label>}
      <ComboboxInput
        component="combobox"
        inputRef={inputRef}
        controlRef={controlRef}
        id={fieldProps.id}
        form={form}
        required={fieldProps.required === true}
        listboxId={listboxId}
        labelId={labelId}
        describedBy={fieldProps["aria-describedby"]}
        activeOptionId={activeOptionId}
        inputValue={inputState.value}
        placeholder={placeholder}
        ownerState={ownerState}
        inputReadOnly={readOnly}
        clearable={ownerState.filled && !readOnly}
        slotProps={slotProps}
        beforeInput={null}
        afterInput={null}
        clearLabel={t("ui.action.remove")}
        toggleLabel={typeof label === "string" ? label : t("ui.picker.search")}
        onOpen={openListbox}
        onToggle={() => {
          if (open) close(false);
          else openListbox();
          inputRef.current?.focus({ preventScroll: true });
        }}
        onClear={clear}
        onInputValueChange={updateInput}
        onKeyDown={handleKeyDown}
      />
      {name !== undefined && <input {...hiddenProps} />}
      {open &&
        portalTarget !== null &&
        createPortal(
          <ComboboxPopup
            component="combobox"
            surfaceRef={surfaceRef}
            listboxId={listboxId}
            labelId={labelId}
            state={data.state}
            ownerState={ownerState}
            slotProps={slotProps}
            loadingMessage={loadingMessage ?? t("ui.loading")}
            errorMessage={errorMessage ?? t("ui.combobox.loadError")}
            emptyMessage={emptyMessage ?? t("ui.collection.empty")}
            refineMessage={refineMessage ?? t("ui.collection.refineSearch")}
            empty={data.options.length === 0}
            hasNextPage={data.hasNextPage}
            onLoadNextPage={data.loadNextPage}
          >
            <ComboboxListbox
              component="combobox"
              id={listboxId}
              labelId={labelId}
              optionIdPrefix={optionIdPrefix}
              options={data.options}
              activeValue={resolvedActiveValue}
              multiple={false}
              ownerState={ownerState}
              slotProps={slotProps}
              renderOption={renderOption}
              isSelected={(option) => option.value === valueState.value?.value}
              isDisabled={(option) => readOnly || option.disabled === true}
              onActivate={(option) => {
                setActiveValue(option.value);
              }}
              onSelect={selectOption}
              hasNextPage={data.hasNextPage}
              onLoadNextPage={data.loadNextPage}
            />
          </ComboboxPopup>,
          portalTarget,
        )}
    </div>
  );
}

/**
 * Renders a searchable single-value WAI-ARIA combobox.
 *
 * @public
 */
export const Combobox = withMiaixzThemeComponent(
  "Combobox",
  forwardRef(ComboboxImplementation) as <Value extends string = string>(
    props: ComboboxProps<Value> & RefAttributes<HTMLDivElement>,
  ) => ReactElement,
);

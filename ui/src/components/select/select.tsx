import {
  Children,
  forwardRef,
  isValidElement,
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type OptionHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { classNames } from "../../internal/class-names.js";
import { useMiaixzOptionSurface } from "../../internal/option-surface.js";
import {
  useMiaixzDismissibleLayer,
  useMiaixzManualPopover,
  useMiaixzPortalTarget,
} from "../../internal/overlay/index.js";
import { useMergedRef } from "../../internal/use-merged-ref.js";
import { Icon } from "../icon/index.js";
import type { SelectProps } from "./select.types.js";

interface MiaixzSelectOption {
  /**
   * Supplies the stable form value.
   */
  readonly value: string;

  /**
   * Supplies the visible option label.
   */
  readonly label: string;

  /**
   * Reports whether interaction is unavailable.
   */
  readonly disabled: boolean;
}

interface MiaixzSelectOptionGroup {
  /**
   * Supplies nested option elements.
   */
  readonly children?: ReactNode;
}

/**
 * Renders an accessible Miaixz option picker while retaining a native select
 * element for form submission and backwards-compatible change events.
 *
 * @public
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    size = "medium",
    invalid = false,
    className,
    disabled = false,
    readOnly = false,
    previewState,
    children,
    value,
    defaultValue,
    onChange,
    onBlur,
    onFocus,
    "aria-invalid": ariaInvalid,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledby,
    ...nativeProps
  },
  forwardedRef,
) {
  const isInvalid = invalid || ariaInvalid === true || ariaInvalid === "true";
  const nativeRef = useRef<HTMLSelectElement>(null);
  const nativeMergedRef = useMergedRef(forwardedRef, nativeRef);
  const rootRef = useRef<HTMLSpanElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [rootElement, setRootElement] = useState<HTMLSpanElement | null>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [uncontrolledValue, setUncontrolledValue] = useState(() =>
    normalizeSelectValue(defaultValue),
  );
  const options = useMemo(() => collectMiaixzSelectOptions(children), [children]);
  const selectedValue = value === undefined ? uncontrolledValue : normalizeSelectValue(value);
  const selectedIndex = options.findIndex((option) => option.value === selectedValue);
  const selectedOption = options[selectedIndex];
  const listboxId = useId();
  const optionIdPrefix = useId();
  const portalTarget = useMiaixzPortalTarget(rootElement);
  const setRootRef = useCallback((element: HTMLSpanElement | null) => {
    rootRef.current = element;
    setRootElement(element);
  }, []);

  const close = useCallback((restoreFocus: boolean) => {
    setOpen(false);
    setActiveIndex(-1);
    if (restoreFocus) queueMicrotask(() => triggerRef.current?.focus({ preventScroll: true }));
  }, []);

  const openListbox = useCallback(() => {
    if (disabled || readOnly) return;
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : findEnabledOption(options, 0, 1));
    setOpen(true);
  }, [disabled, options, readOnly, selectedIndex]);

  useMiaixzManualPopover(surfaceRef, open, portalTarget);
  const activeOptionId = open && activeIndex >= 0 ? `${optionIdPrefix}-${activeIndex}` : undefined;
  useMiaixzOptionSurface(rootRef, surfaceRef, open, portalTarget, activeOptionId);
  useMiaixzDismissibleLayer({
    active: open,
    triggerRef,
    contentRef: surfaceRef,
    portalTarget,
    onDismiss: () => close(true),
  });

  const selectOption = useCallback(
    (option: MiaixzSelectOption) => {
      if (option.disabled || readOnly) return;
      if (value === undefined) setUncontrolledValue(option.value);
      const element = nativeRef.current;
      if (element !== null) {
        const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")?.set;
        setter?.call(element, option.value);
        element.dispatchEvent(new Event("change", { bubbles: true }));
      }
      close(true);
    },
    [close, readOnly, value],
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Escape" && open) {
      event.preventDefault();
      close(true);
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        openListbox();
        return;
      }
      const direction = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((current) => findEnabledOption(options, current + direction, direction));
      return;
    }
    if (event.key === "Home" && open) {
      event.preventDefault();
      setActiveIndex(findEnabledOption(options, 0, 1));
      return;
    }
    if (event.key === "End" && open) {
      event.preventDefault();
      setActiveIndex(findEnabledOption(options, options.length - 1, -1));
      return;
    }
    if (event.key === "Enter" && open) {
      const option = options[activeIndex];
      if (option !== undefined) {
        event.preventDefault();
        selectOption(option);
      }
    }
  };

  return (
    <span
      ref={setRootRef}
      className={classNames(
        "miaixz-control",
        "miaixz-select",
        `miaixz-control-${size}`,
        isInvalid && "miaixz-select-invalid",
        disabled && "miaixz-select-disabled",
        readOnly && "miaixz-select-readonly",
        className,
      )}
      data-size={size}
      data-state={open ? "open" : "closed"}
      data-invalid={isInvalid || undefined}
      data-disabled={disabled || undefined}
      data-readonly={readOnly || undefined}
      data-filled={selectedValue.length > 0 || undefined}
      data-preview-state={previewState}
    >
      <select
        {...nativeProps}
        ref={nativeMergedRef}
        className="miaixz-select-native"
        value={value}
        defaultValue={defaultValue}
        disabled={disabled}
        tabIndex={-1}
        aria-hidden="true"
        aria-invalid={isInvalid || undefined}
        onChange={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
      >
        {children}
      </select>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        className="miaixz-select-trigger"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        aria-controls={listboxId}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-activedescendant={activeOptionId}
        aria-invalid={isInvalid || undefined}
        aria-readonly={readOnly || undefined}
        disabled={disabled}
        onClick={() => (open ? close(false) : openListbox())}
        onKeyDown={handleKeyDown}
      >
        <span className="miaixz-select-value">{selectedOption?.label ?? "\u00a0"}</span>
        <Icon name="ChevronDown" size="control" className="miaixz-select-indicator" />
      </button>
      {open &&
        portalTarget !== null &&
        createPortal(
          <div
            ref={surfaceRef}
            popover="manual"
            id={listboxId}
            role="listbox"
            className="miaixz-select-surface"
            aria-label={ariaLabel}
          >
            {options.map((option, index) => {
              const selected = option.value === selectedValue;
              return (
                <div
                  key={`${option.value}-${index}`}
                  id={`${optionIdPrefix}-${index}`}
                  role="option"
                  aria-selected={selected}
                  aria-disabled={option.disabled || undefined}
                  className="miaixz-select-option"
                  data-state={index === activeIndex ? "active" : "idle"}
                  data-disabled={option.disabled || undefined}
                  onPointerMove={() => {
                    if (!option.disabled) setActiveIndex(index);
                  }}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectOption(option)}
                >
                  <span className="miaixz-select-option-label">{option.label}</span>
                  {selected && <Icon name="Check" size="control" />}
                </div>
              );
            })}
          </div>,
          portalTarget,
        )}
    </span>
  );
});

/**
 * Normalizes every native select value shape into a single string.
 *
 * @param value - Native controlled or default select value.
 * @returns Normalized single string value.
 */
function normalizeSelectValue(value: SelectProps["value"] | SelectProps["defaultValue"]): string {
  if (Array.isArray(value)) return value.length > 0 ? String(value[0]) : "";
  return value === undefined || value === null ? "" : String(value);
}

/**
 * Extracts a flat option model from native option and optgroup children.
 *
 * @param children - Native select child nodes.
 * @returns Ordered flat options for the Miaixz listbox.
 */
function collectMiaixzSelectOptions(children: ReactNode): MiaixzSelectOption[] {
  const options: MiaixzSelectOption[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if (child.type === "option") {
      const option = child as ReactElement<OptionHTMLAttributes<HTMLOptionElement>>;
      const label = option.props.label ?? getTextContent(option.props.children);
      options.push({
        value: option.props.value === undefined ? label : String(option.props.value),
        label,
        disabled: option.props.disabled === true,
      });
      return;
    }
    if (child.type === "optgroup") {
      const group = child as ReactElement<MiaixzSelectOptionGroup>;
      options.push(...collectMiaixzSelectOptions(group.props.children));
    }
  });
  return options;
}

/**
 * Converts an option's renderable label content to its accessible text.
 *
 * @param node - Renderable option content.
 * @returns Flattened label text.
 */
function getTextContent(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  return Children.toArray(node).map(getTextContent).join("");
}

/**
 * Finds the next enabled option while wrapping through the option set.
 *
 * @param options - Ordered option collection.
 * @param start - Candidate index used for the first lookup.
 * @param direction - Navigation direction.
 * @returns Enabled option index or `-1` when none is available.
 */
function findEnabledOption(
  options: readonly MiaixzSelectOption[],
  start: number,
  direction: 1 | -1,
): number {
  if (options.length === 0) return -1;
  for (let offset = 0; offset < options.length; offset += 1) {
    const index = (start + offset * direction + options.length) % options.length;
    if (options[index]?.disabled === false) return index;
  }
  return -1;
}

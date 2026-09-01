import { forwardRef, useId, useState } from "react";
import type { KeyboardEvent } from "react";

import { classNames } from "../../internal/class-names.js";
import type { TabsProps } from "./tabs.types.js";

/**
 * Normalizes a tab value for DOM identifiers.
 *
 * @param value - Public tab value.
 * @returns A DOM-safe identifier fragment.
 * @internal
 */
function valueId(value: string): string {
  return value.trim().replace(/[^a-zA-Z0-9_-]+/g, "-") || "tab";
}

/**
 * Renders a complete accessible tabs collection from declarative items. @public
 */
export const Tabs = forwardRef<HTMLDivElement, TabsProps>(function Tabs(
  {
    items,
    label,
    value: controlledValue,
    defaultValue,
    onValueChange,
    orientation = "horizontal",
    className,
    ...props
  },
  ref,
) {
  const firstValue = items.find((item) => !item.disabled)?.value;
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue ?? firstValue);
  const selectedValue = controlledValue ?? uncontrolledValue;
  const baseId = `miaixz-tabs-${useId()}`;

  /**
   * Selects a tab and reports the change.
   *
   * @param value - Selected tab value.
   */
  function select(value: string) {
    if (controlledValue === undefined) setUncontrolledValue(value);
    onValueChange?.(value);
  }

  /**
   * Moves focus and selection through the tab list.
   *
   * @param event - Tab keyboard event.
   */
  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const list = event.currentTarget.parentElement;
    const tabs = list
      ? Array.from(list.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)'))
      : [];
    const currentIndex = tabs.indexOf(event.currentTarget);
    if (currentIndex < 0 || tabs.length === 0) return;
    const previousKey = orientation === "vertical" ? "ArrowUp" : "ArrowLeft";
    const nextKey = orientation === "vertical" ? "ArrowDown" : "ArrowRight";
    let nextIndex: number | undefined;
    if (event.key === previousKey) nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    if (event.key === nextKey) nextIndex = (currentIndex + 1) % tabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = tabs.length - 1;
    if (nextIndex !== undefined) {
      event.preventDefault();
      tabs[nextIndex]?.focus();
      tabs[nextIndex]?.click();
    }
  }

  return (
    <div
      {...props}
      ref={ref}
      data-orientation={orientation}
      className={classNames(
        "miaixz-tabs",
        orientation === "vertical" && "miaixz-tabs-vertical",
        className,
      )}
    >
      <div
        role="tablist"
        aria-label={label}
        aria-orientation={orientation}
        className="miaixz-tabs-list"
      >
        {items.map((item) => {
          const selected = selectedValue === item.value;
          const idValue = valueId(item.value);
          return (
            <button
              key={item.value}
              id={`${baseId}-tab-${idValue}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${idValue}`}
              tabIndex={selected ? 0 : -1}
              disabled={item.disabled}
              className="miaixz-tab"
              onClick={() => select(item.value)}
              onKeyDown={handleKeyDown}
            >
              <span>{item.label}</span>
              {item.count !== undefined && <span className="miaixz-tab-count">{item.count}</span>}
            </button>
          );
        })}
      </div>
      {items.map((item) => {
        const selected = selectedValue === item.value;
        const idValue = valueId(item.value);
        return (
          <div
            key={item.value}
            id={`${baseId}-panel-${idValue}`}
            role="tabpanel"
            aria-labelledby={`${baseId}-tab-${idValue}`}
            hidden={!selected}
            tabIndex={0}
            className="miaixz-tab-panel"
          >
            {item.content}
          </div>
        );
      })}
    </div>
  );
});

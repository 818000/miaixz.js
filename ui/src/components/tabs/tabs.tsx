import { createContext, forwardRef, useContext, useId, useMemo, useState } from "react";
import type { KeyboardEvent } from "react";

import { createMiaixzUiError } from "../../errors/index.js";
import { classNames } from "../../internal/class-names.js";
import { useMiaixzLocale } from "../../i18n/index.js";
import type {
  TabListProps,
  TabPanelProps,
  TabProps,
  TabsOrientation,
  TabsProps,
} from "./tabs.types.js";

interface TabsContextValue {
  /**
   * Provides the stable identifier prefix for tab relationships.
   */
  baseId: string;
  /**
   * Defines the active keyboard navigation axis.
   */
  orientation: TabsOrientation;
  /**
   * Contains the currently selected tab value.
   */
  value: string | undefined;
  /**
   * Requests selection of a tab value.
   */
  select: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

/**
 * Returns the active tabs context and guards against invalid composition.
 *
 * @returns The nearest tabs controller.
 * @throws A localized error when no parent {@link Tabs} exists.
 */
function useTabsContext(): TabsContextValue {
  const { t } = useMiaixzLocale();
  const context = useContext(TabsContext);
  if (!context) {
    throw createMiaixzUiError(t, {
      code: "UI_TABS_PROVIDER_MISSING",
      messageKey: "ui.error.tabs.providerMissing",
    });
  }
  return context;
}

/**
 * Converts an arbitrary tab value into an HTML identifier segment.
 *
 * @param value - Arbitrary tab value.
 * @returns A non-empty identifier-safe segment.
 */
function valueId(value: string): string {
  return value.trim().replace(/[^a-zA-Z0-9_-]+/g, "-") || "tab";
}

/**
 * Provides controlled or uncontrolled tab selection state to child components.
 *
 * @public
 */
export const Tabs = forwardRef<HTMLDivElement, TabsProps>(function Tabs(
  {
    value: controlledValue,
    defaultValue,
    onValueChange,
    orientation = "horizontal",
    className,
    children,
    ...props
  },
  ref,
) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const baseId = `miaixz-tabs-${useId()}`;
  const value = controlledValue ?? uncontrolledValue;
  const context = useMemo<TabsContextValue>(
    () => ({
      baseId,
      orientation,
      value,
      select: (nextValue) => {
        if (controlledValue === undefined) setUncontrolledValue(nextValue);
        onValueChange?.(nextValue);
      },
    }),
    [baseId, controlledValue, onValueChange, orientation, value],
  );

  return (
    <TabsContext.Provider value={context}>
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
        {children}
      </div>
    </TabsContext.Provider>
  );
});

/**
 * Renders the tablist container and keyboard orientation metadata.
 *
 * @public
 */
export const TabList = forwardRef<HTMLDivElement, TabListProps>(function TabList(
  { label, className, ...props },
  ref,
) {
  const { orientation } = useTabsContext();
  return (
    <div
      {...props}
      ref={ref}
      role="tablist"
      aria-label={label}
      aria-orientation={orientation}
      className={classNames("miaixz-tabs-list", className)}
    />
  );
});

/**
 * Renders a selectable tab with arrow-key, Home, and End navigation.
 *
 * @public
 */
export const Tab = forwardRef<HTMLButtonElement, TabProps>(function Tab(
  { value, count, disabled = false, className, children, onClick, onKeyDown, ...props },
  ref,
) {
  const context = useTabsContext();
  const selected = context.value === value;
  const idValue = valueId(value);

  /**
   * Moves focus and selection according to the WAI-ARIA tabs keyboard pattern.
   *
   * @param event - Keyboard event received by the active tab.
   */
  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;

    const list = event.currentTarget.parentElement;
    const tabs = list
      ? Array.from(list.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)'))
      : [];
    const currentIndex = tabs.indexOf(event.currentTarget);
    if (currentIndex < 0 || tabs.length === 0) return;

    const previousKey = context.orientation === "vertical" ? "ArrowUp" : "ArrowLeft";
    const nextKey = context.orientation === "vertical" ? "ArrowDown" : "ArrowRight";
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
    <button
      {...props}
      ref={ref}
      id={`${context.baseId}-tab-${idValue}`}
      type="button"
      role="tab"
      aria-selected={selected}
      aria-controls={`${context.baseId}-panel-${idValue}`}
      tabIndex={selected ? 0 : -1}
      disabled={disabled}
      className={classNames("miaixz-tab", className)}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) context.select(value);
      }}
      onKeyDown={handleKeyDown}
    >
      <span>{children}</span>
      {count !== undefined && <span className="miaixz-tab-count">{count}</span>}
    </button>
  );
});

/**
 * Renders content associated with one tab and hides it when inactive.
 *
 * @public
 */
export const TabPanel = forwardRef<HTMLDivElement, TabPanelProps>(function TabPanel(
  { value, className, ...props },
  ref,
) {
  const context = useTabsContext();
  const selected = context.value === value;
  const idValue = valueId(value);

  return (
    <div
      {...props}
      ref={ref}
      id={`${context.baseId}-panel-${idValue}`}
      role="tabpanel"
      aria-labelledby={`${context.baseId}-tab-${idValue}`}
      hidden={!selected}
      tabIndex={0}
      className={classNames("miaixz-tab-panel", className)}
    />
  );
});

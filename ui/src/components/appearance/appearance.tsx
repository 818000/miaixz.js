import type { MiaixzColorMode, MiaixzDensity } from "@miaixz/sdk/appearance";
import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";

import { useMiaixzLocale } from "../../i18n/index.js";
import { useTheme } from "../../theme/index.js";
import { Button } from "../button/index.js";
import { Drawer } from "../drawer/index.js";
import { Icon } from "../icon/index.js";
import { LocalePicker } from "../locale-picker/index.js";
import { Radio } from "../radio/index.js";
import type { AppearanceProps } from "./appearance.types.js";

const colorModes: readonly MiaixzColorMode[] = ["light", "dark", "system"];
const densities: readonly MiaixzDensity[] = ["compact", "standard", "comfortable"];
const dragThreshold = 4;

interface DragState {
  /**
   * Pointer that owns the active drag.
   */
  readonly pointerId: number;
  /**
   * Initial pointer block coordinate.
   */
  readonly startPointerY: number;
  /**
   * Initial trigger block-start edge.
   */
  readonly startTop: number;
  /**
   * Whether movement has crossed the drag threshold.
   */
  moved: boolean;
  /**
   * Latest requested block-start edge.
   */
  currentTop: number;
}

/**
 * Renders the shared draggable Appearance trigger and scope-controlled drawer. @public
 *
 * @param props - Scope, header, position, and drag configuration.
 * @returns Shared Appearance trigger and drawer.
 */
export function Appearance(props: AppearanceProps) {
  const {
    scope,
    headerBehavior,
    onHeaderBehaviorChange,
    positionBlockPx,
    onPositionBlockPxChange,
    draggable = true,
  } = props;
  const theme = useTheme();
  const localeRuntime = useMiaixzLocale();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"settings" | "language">("settings");
  const [dragging, setDragging] = useState(false);
  const [uncontrolledPosition, setUncontrolledPosition] = useState<number>();
  const [uncontrolledHeaderBehavior, setUncontrolledHeaderBehavior] = useState<"fixed" | "scroll">(
    "fixed",
  );
  const position = positionBlockPx ?? uncontrolledPosition;
  const currentHeaderBehavior = headerBehavior ?? uncontrolledHeaderBehavior;
  const rootRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | undefined>(undefined);
  const suppressClickRef = useRef(false);
  const suppressClickTimerRef = useRef<number | undefined>(undefined);
  const drawerId = `miaixz-appearance-${useId()}`;
  const namePrefix = `miaixz-appearance-choice-${useId()}`;
  const authenticated = scope === "authenticated";
  const isLoading = theme.status === "loading" || localeRuntime.loadStatus === "loading";
  const activeLocale =
    localeRuntime.locales.find((descriptor) => descriptor.id === localeRuntime.locale) ??
    localeRuntime.locales[0];

  useEffect(() => {
    if (!draggable) return undefined;
    const root = rootRef.current;
    if (root === null) return undefined;
    const handleResize = () => {
      if (positionBlockPx === undefined) {
        setUncontrolledPosition((value) =>
          value === undefined ? undefined : clampPosition(root, value),
        );
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [draggable, positionBlockPx]);

  useEffect(
    () => () => {
      if (suppressClickTimerRef.current !== undefined) {
        window.clearTimeout(suppressClickTimerRef.current);
      }
    },
    [],
  );

  const moveTo = (proposedTop: number, notify = false) => {
    const root = rootRef.current;
    if (root === null) return;
    const next = clampPosition(root, proposedTop);
    setUncontrolledPosition(next);
    if (notify) onPositionBlockPxChange?.(next);
  };

  const releaseDrag = (drag: DragState) => {
    dragRef.current = undefined;
    setDragging(false);
    if (!drag.moved) return;
    suppressClickRef.current = true;
    moveTo(drag.currentTop, true);
    suppressClickTimerRef.current = window.setTimeout(() => {
      suppressClickRef.current = false;
      suppressClickTimerRef.current = undefined;
    }, 0);
  };

  const positionStyle =
    position === undefined
      ? undefined
      : ({
          insetBlockEnd: "auto",
          insetBlockStart: `calc(${position}px + var(--miaixz-appearance-trigger-size) / 2)`,
        } satisfies CSSProperties);

  const preview = (
    kind: "theme" | "mode" | "density" | "header",
    value: string,
    label: ReactNode,
    style?: CSSProperties,
  ) => (
    <span className="miaixz-appearance-option-label">
      <span
        aria-hidden="true"
        className={`miaixz-appearance-preview miaixz-appearance-${kind}-preview`}
        data-preview-value={value}
        style={style}
      >
        <i />
        <i />
        <i />
      </span>
      <span>{label}</span>
    </span>
  );

  const group = (label: string, children: ReactNode, className = "") => (
    <fieldset className="miaixz-appearance-group">
      <legend>{label}</legend>
      <div className={`miaixz-appearance-options ${className}`}>{children}</div>
    </fieldset>
  );

  const themeGroup = group(
    localeRuntime.t("ui.appearance.theme"),
    theme.themes.map((descriptor) => {
      const colors = descriptor.preview[theme.resolvedColorMode];
      const style = {
        "--miaixz-appearance-preview-brand": colors.brand,
        "--miaixz-appearance-preview-surface": colors.surface,
        "--miaixz-appearance-preview-text": colors.textPrimary,
      } as CSSProperties;
      return (
        <Radio
          key={descriptor.name}
          checked={theme.theme === descriptor.name}
          className="miaixz-appearance-option"
          disabled={isLoading}
          label={preview("theme", descriptor.name, descriptor.label, style)}
          name={`${namePrefix}-theme`}
          onChange={() => {
            if (theme.theme !== descriptor.name) void theme.setTheme(descriptor.name);
          }}
          value={descriptor.name}
        />
      );
    }),
    "miaixz-appearance-options-cards",
  );

  const localeGroup = group(
    localeRuntime.t("ui.appearance.language"),
    <button
      aria-label={localeRuntime.t("ui.appearance.language.open")}
      className="miaixz-appearance-locale-summary"
      onClick={() => setView("language")}
      type="button"
    >
      <span aria-hidden="true" className="miaixz-appearance-locale-summary-short">
        {activeLocale?.shortLabel ?? localeRuntime.locale.slice(0, 2).toLocaleUpperCase()}
      </span>
      <span className="miaixz-appearance-locale-summary-copy">
        <span>{activeLocale?.label ?? localeRuntime.locale}</span>
        <span>{localeRuntime.t("ui.appearance.language.current")}</span>
      </span>
      <Icon aria-hidden="true" name="ChevronRight" size="control" />
    </button>,
    "miaixz-appearance-options-rows",
  );

  const modeGroup = group(
    localeRuntime.t("ui.appearance.mode"),
    colorModes.map((mode) => (
      <Radio
        key={mode}
        checked={theme.colorMode === mode}
        className="miaixz-appearance-option"
        disabled={isLoading}
        label={preview("mode", mode, localeRuntime.t(`ui.appearance.${mode}`))}
        name={`${namePrefix}-mode`}
        onChange={() => {
          if (theme.colorMode !== mode) void theme.setColorMode(mode);
        }}
        value={mode}
      />
    )),
    "miaixz-appearance-options-cards",
  );

  const densityGroup = group(
    localeRuntime.t("ui.appearance.density"),
    densities.map((density) => (
      <Radio
        key={density}
        checked={theme.density === density}
        className="miaixz-appearance-option"
        disabled={isLoading}
        label={preview("density", density, localeRuntime.t(`ui.appearance.${density}`))}
        name={`${namePrefix}-density`}
        onChange={() => {
          if (theme.density !== density) void theme.setDensity(density);
        }}
        value={density}
      />
    )),
    "miaixz-appearance-options-cards",
  );

  const headerGroup = group(
    localeRuntime.t("ui.appearance.header"),
    (["fixed", "scroll"] as const).map((value) => (
      <Radio
        key={value}
        checked={currentHeaderBehavior === value}
        className="miaixz-appearance-option"
        label={preview("header", value, localeRuntime.t(`ui.appearance.${value}`))}
        name={`${namePrefix}-header`}
        onChange={() => {
          setUncontrolledHeaderBehavior(value);
          onHeaderBehaviorChange?.(value);
        }}
        value={value}
      />
    )),
    "miaixz-appearance-options-locales",
  );

  return (
    <>
      <div
        ref={rootRef}
        className="miaixz-appearance-floating"
        data-dragging={dragging || undefined}
        style={positionStyle}
      >
        <button
          aria-controls={drawerId}
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-keyshortcuts={draggable ? "ArrowUp ArrowDown" : undefined}
          aria-label={localeRuntime.t("ui.appearance.open")}
          className="miaixz-appearance-trigger"
          onClick={(event) => {
            if (suppressClickRef.current) {
              event.preventDefault();
              suppressClickRef.current = false;
              return;
            }
            setOpen(true);
          }}
          onKeyDown={
            draggable
              ? (event) => {
                  if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
                  event.preventDefault();
                  const root = rootRef.current;
                  if (root === null) return;
                  const step = numericCssValue(root, "--miaixz-density-component-gap", 12);
                  moveTo(
                    (position ?? root.getBoundingClientRect().top) +
                      (event.key === "ArrowUp" ? -step : step),
                    true,
                  );
                }
              : undefined
          }
          onPointerCancel={
            draggable
              ? (event) => {
                  const drag = dragRef.current;
                  if (drag?.pointerId === event.pointerId) releaseDrag(drag);
                }
              : undefined
          }
          onPointerDown={
            draggable
              ? (event) => {
                  if (event.button !== 0) return;
                  dragRef.current = {
                    pointerId: event.pointerId,
                    startPointerY: event.clientY,
                    startTop: position ?? rootRef.current?.getBoundingClientRect().top ?? 0,
                    moved: false,
                    currentTop: position ?? rootRef.current?.getBoundingClientRect().top ?? 0,
                  };
                  event.currentTarget.setPointerCapture?.(event.pointerId);
                }
              : undefined
          }
          onPointerMove={
            draggable
              ? (event) => {
                  const drag = dragRef.current;
                  if (drag?.pointerId !== event.pointerId) return;
                  const offset = event.clientY - drag.startPointerY;
                  if (!drag.moved && Math.abs(offset) < dragThreshold) return;
                  drag.moved = true;
                  drag.currentTop = drag.startTop + offset;
                  setDragging(true);
                  event.preventDefault();
                  moveTo(drag.currentTop);
                }
              : undefined
          }
          onPointerUp={
            draggable
              ? (event) => {
                  const drag = dragRef.current;
                  if (drag?.pointerId !== event.pointerId) return;
                  if (drag.moved) event.preventDefault();
                  releaseDrag(drag);
                }
              : undefined
          }
          title={localeRuntime.t("ui.appearance.open")}
          type="button"
        >
          <Icon aria-hidden="true" name="Palette" size="navigation" />
        </button>
      </div>

      <Drawer
        className="miaixz-appearance-drawer"
        closeLabel={localeRuntime.t("ui.appearance.close")}
        description={
          view === "language"
            ? localeRuntime.t("ui.appearance.language.description")
            : localeRuntime.t("ui.appearance.description")
        }
        id={drawerId}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) setView("settings");
        }}
        open={open}
        placement="right"
        title={
          view === "language"
            ? localeRuntime.t("ui.appearance.language")
            : localeRuntime.t("ui.appearance.title")
        }
      >
        {view === "language" ? (
          <div className="miaixz-appearance-language-view">
            <Button
              startIcon={<Icon aria-hidden="true" name="ChevronLeft" size="control" />}
              onClick={() => setView("settings")}
              size="small"
              variant="ghost"
            >
              {localeRuntime.t("ui.appearance.language.back")}
            </Button>
            <LocalePicker
              disabled={isLoading}
              locale={localeRuntime.locale}
              locales={localeRuntime.locales}
              onLocaleChange={async (nextLocale) => {
                await localeRuntime.setLocale(nextLocale);
                setView("settings");
              }}
            />
            {localeRuntime.loadError ? <p role="alert">{localeRuntime.loadError.message}</p> : null}
          </div>
        ) : (
          <div aria-busy={isLoading} className="miaixz-appearance-body">
            {authenticated && themeGroup}
            {localeGroup}
            {modeGroup}
            {authenticated && densityGroup}
            {authenticated && headerGroup}
            {theme.error ? <p role="alert">{theme.error.message}</p> : null}
          </div>
        )}
      </Drawer>
    </>
  );
}

/**
 * Reads one numeric CSS custom property.
 *
 * @param element - Element that owns the computed token value.
 * @param property - CSS custom property name.
 * @param fallback - Value used when the token cannot be parsed.
 * @returns Parsed numeric value.
 */
function numericCssValue(element: Element, property: string, fallback: number): number {
  const value = Number.parseFloat(getComputedStyle(element).getPropertyValue(property));
  return Number.isFinite(value) ? value : fallback;
}

/**
 * Keeps the trigger within the visible block axis.
 *
 * @param root - Floating trigger wrapper.
 * @param proposedTop - Proposed block-start edge.
 * @returns Clamped block-start edge.
 */
function clampPosition(root: HTMLDivElement, proposedTop: number): number {
  const viewport = root.ownerDocument.defaultView;
  if (viewport === null) return proposedTop;
  const safeStart = numericCssValue(root, "--miaixz-safe-area-block-start", 0);
  const safeEnd = numericCssValue(root, "--miaixz-safe-area-block-end", 0);
  const maximum = Math.max(safeStart, viewport.innerHeight - root.offsetHeight - safeEnd);
  return Math.min(maximum, Math.max(safeStart, proposedTop));
}

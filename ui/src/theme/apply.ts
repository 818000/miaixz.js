import { MiaixzThemeError } from "./errors.js";
import type { MiaixzSerializedThemeApplication } from "./serialize.js";

const themeAttributes = [
  "data-miaixz-theme-instance",
  "data-miaixz-theme",
  "data-miaixz-color-mode",
  "data-miaixz-color-preference",
  "data-miaixz-density",
  "data-miaixz-entry",
  "data-miaixz-shell",
  "data-miaixz-panel",
] as const;

/**
 * Atomically replaces one runtime style snapshot and its eight target attributes.
 *
 * @param target - Document root or local theme wrapper.
 * @param style - React-owned runtime style element.
 * @param application - Complete serialized application payload.
 * @returns Conditional restoration function for rollback or unmount.
 * @throws MiaixzThemeError When a style or attribute mutation fails.
 */
export function applyTheme(
  target: HTMLElement,
  style: HTMLStyleElement,
  application: Readonly<MiaixzSerializedThemeApplication>,
): () => void {
  const previousCss = style.textContent ?? "";
  const previousAttributes = new Map(
    themeAttributes.map((attribute) => [attribute, target.getAttribute(attribute)]),
  );
  const nextAttributes = new Map<string, string>([
    ["data-miaixz-theme-instance", application.instanceId],
    ["data-miaixz-theme", application.theme],
    ["data-miaixz-color-mode", application.colorMode],
    ["data-miaixz-color-preference", application.colorPreference],
    ["data-miaixz-density", application.density],
    ["data-miaixz-entry", application.composition.entry],
    ["data-miaixz-shell", application.composition.shell],
    ["data-miaixz-panel", application.composition.panel],
  ]);
  try {
    style.textContent = application.cssText;
    if (shouldInspectStyleSheet(style) && style.sheet === null) {
      throw new Error("Runtime theme stylesheet was rejected");
    }
    for (const [attribute, value] of nextAttributes) target.setAttribute(attribute, value);
  } catch (cause) {
    restore(
      target,
      style,
      application.cssText,
      previousCss,
      nextAttributes,
      previousAttributes,
      true,
    );
    throw new MiaixzThemeError("UI_THEME_APPLY_FAILED", {
      theme: application.theme,
      cause,
    });
  }
  return () =>
    restore(
      target,
      style,
      application.cssText,
      previousCss,
      nextAttributes,
      previousAttributes,
      false,
    );
}

/**
 * Determines whether the current browser can reliably expose parsed CSSStyleSheet state.
 *
 * @param style - Runtime style element.
 * @returns Whether a connected-sheet capability check is required.
 */
function shouldInspectStyleSheet(style: HTMLStyleElement): boolean {
  return (
    style.isConnected &&
    typeof navigator !== "undefined" &&
    !navigator.userAgent.toLowerCase().includes("jsdom")
  );
}

/**
 * Restores values owned by one application without overwriting later external changes.
 *
 * @param target - Theme target.
 * @param style - Runtime style element.
 * @param appliedCss - CSS text owned by this transaction.
 * @param previousCss - CSS text present before this transaction.
 * @param appliedAttributes - Attribute values owned by this transaction.
 * @param previousAttributes - Attribute values present before this transaction.
 * @param unconditional - Whether rollback must restore partially written values unconditionally.
 */
function restore(
  target: HTMLElement,
  style: HTMLStyleElement,
  appliedCss: string,
  previousCss: string,
  appliedAttributes: ReadonlyMap<string, string>,
  previousAttributes: ReadonlyMap<string, string | null>,
  unconditional: boolean,
): void {
  try {
    if (unconditional || style.textContent === appliedCss) style.textContent = previousCss;
    for (const [attribute, applied] of appliedAttributes) {
      if (!unconditional && target.getAttribute(attribute) !== applied) continue;
      const previous = previousAttributes.get(attribute) ?? null;
      if (previous === null) target.removeAttribute(attribute);
      else target.setAttribute(attribute, previous);
    }
  } catch {
    // The originating error or external ownership remains authoritative.
  }
}

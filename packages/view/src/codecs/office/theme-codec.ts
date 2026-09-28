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

/**
 * Resolves DrawingML theme colors and direct shape paints.
 */

import {
  allElements,
  firstElementByLocalName as first,
  localAttribute as attribute,
  type XmlDocument,
  type XmlElement,
} from "../xml/xml-codec.js";

type Element = XmlElement;
type XMLDocument = XmlDocument;

/**
 * Contains the reusable color and line defaults declared by one Office theme.
 */
export interface OfficeTheme {
  readonly colors: ReadonlyMap<string, string>;
}

const presetColors: Readonly<Record<string, string>> = Object.freeze({
  black: "000000",
  blue: "0000FF",
  cyan: "00FFFF",
  gray: "808080",
  green: "008000",
  magenta: "FF00FF",
  red: "FF0000",
  white: "FFFFFF",
  yellow: "FFFF00",
});

/**
 * Normalizes an Office hexadecimal color to CSS notation.
 *
 * @param value - Office color value without a hash prefix.
 * @param fallback - Color used when the source is invalid.
 * @returns CSS hexadecimal color.
 */
function hexadecimal(value: string | undefined, fallback: string): string {
  if (value !== undefined && /^[\da-f]{6}$/iu.test(value)) return `#${value.toUpperCase()}`;
  return fallback;
}

/**
 * Converts a CSS hexadecimal color to RGB components.
 *
 * @param color - Six-digit CSS hexadecimal color.
 * @returns Red, green, and blue components.
 */
function components(color: string): readonly [number, number, number] {
  return [
    Number.parseInt(color.slice(1, 3), 16),
    Number.parseInt(color.slice(3, 5), 16),
    Number.parseInt(color.slice(5, 7), 16),
  ];
}

/**
 * Applies one linear luminance transform to an RGB component.
 *
 * @param value - Original channel value.
 * @param multiplier - Relative channel multiplier.
 * @param offset - Relative channel offset.
 * @returns Transformed channel value.
 */
function channel(value: number, multiplier: number, offset: number): number {
  return Math.max(0, Math.min(255, Math.round(value * multiplier + 255 * offset)));
}

/**
 * Applies DrawingML tint, shade, and luminance transforms.
 *
 * @param color - Base CSS hexadecimal color.
 * @param source - Color element containing transform children.
 * @returns Transformed CSS hexadecimal color.
 */
function transformColor(color: string, source: Element): string {
  let multiplier = 1;
  let offset = 0;
  for (const transform of source.children) {
    const value = Number(attribute(transform, "val") ?? 100_000) / 100_000;
    if (transform.localName === "tint") {
      multiplier *= value;
      offset += 1 - value;
    } else if (transform.localName === "shade" || transform.localName === "lumMod") {
      multiplier *= value;
    } else if (transform.localName === "lumOff") {
      offset += value;
    }
  }
  const [red, green, blue] = components(color);
  return `#${[
    channel(red, multiplier, offset),
    channel(green, multiplier, offset),
    channel(blue, multiplier, offset),
  ]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")}`.toUpperCase();
}

/**
 * Finds the first DrawingML color child beneath a paint or style element.
 *
 * @param source - Paint or style element being inspected.
 * @returns First supported color element.
 */
function colorElement(source: Element): Element | undefined {
  return allElements(source).find((element) =>
    ["hslClr", "prstClr", "schemeClr", "scrgbClr", "srgbClr", "sysClr"].includes(element.localName),
  );
}

/**
 * Parses the reusable color scheme declared by an Office theme.
 *
 * @param document - Parsed theme XML document.
 * @returns Normalized Office theme.
 */
export function parseOfficeTheme(document: XMLDocument): OfficeTheme {
  const colors = new Map<string, string>();
  const scheme = first(document, "clrScheme");
  if (scheme !== undefined) {
    for (const slot of scheme.children) {
      const source = colorElement(slot);
      if (source === undefined) continue;
      const direct =
        source.localName === "sysClr"
          ? attribute(source, "lastClr")
          : source.localName === "prstClr"
            ? presetColors[attribute(source, "val") ?? ""]
            : attribute(source, "val");
      colors.set(slot.localName, hexadecimal(direct, "#000000"));
    }
  }
  if (!colors.has("dk1")) colors.set("dk1", "#000000");
  if (!colors.has("lt1")) colors.set("lt1", "#FFFFFF");
  if (!colors.has("dk2")) colors.set("dk2", "#44546A");
  if (!colors.has("lt2")) colors.set("lt2", "#E7E6E6");
  colors.set("tx1", colors.get("dk1") ?? "#000000");
  colors.set("tx2", colors.get("dk2") ?? "#44546A");
  colors.set("bg1", colors.get("lt1") ?? "#FFFFFF");
  colors.set("bg2", colors.get("lt2") ?? "#E7E6E6");
  return { colors };
}

/**
 * Creates the deterministic fallback theme used when a package omits theme data.
 *
 * @returns Default Office-compatible theme colors.
 */
export function defaultOfficeTheme(): OfficeTheme {
  return {
    colors: new Map([
      ["dk1", "#000000"],
      ["lt1", "#FFFFFF"],
      ["dk2", "#44546A"],
      ["lt2", "#E7E6E6"],
      ["accent1", "#4472C4"],
      ["accent2", "#ED7D31"],
      ["accent3", "#A5A5A5"],
      ["accent4", "#FFC000"],
      ["accent5", "#5B9BD5"],
      ["accent6", "#70AD47"],
      ["tx1", "#000000"],
      ["tx2", "#44546A"],
      ["bg1", "#FFFFFF"],
      ["bg2", "#E7E6E6"],
    ]),
  };
}

/**
 * Resolves one DrawingML color element through the active theme.
 *
 * @param source - Paint, style reference, or direct color element.
 * @param theme - Active Office theme.
 * @param fallback - Color returned when no supported declaration exists.
 * @returns CSS hexadecimal color.
 */
export function resolveOfficeColor(
  source: Element | undefined,
  theme: OfficeTheme,
  fallback: string,
): string {
  if (source === undefined) return fallback;
  const color = ["hslClr", "prstClr", "schemeClr", "scrgbClr", "srgbClr", "sysClr"].includes(
    source.localName,
  )
    ? source
    : colorElement(source);
  if (color === undefined) return fallback;
  let resolved: string;
  if (color.localName === "schemeClr") {
    resolved = theme.colors.get(attribute(color, "val") ?? "") ?? fallback;
  } else if (color.localName === "sysClr") {
    resolved = hexadecimal(attribute(color, "lastClr"), fallback);
  } else if (color.localName === "prstClr") {
    resolved = hexadecimal(presetColors[attribute(color, "val") ?? ""], fallback);
  } else if (color.localName === "scrgbClr") {
    const red = Math.round((Number(attribute(color, "r") ?? 0) / 100_000) * 255);
    const green = Math.round((Number(attribute(color, "g") ?? 0) / 100_000) * 255);
    const blue = Math.round((Number(attribute(color, "b") ?? 0) / 100_000) * 255);
    resolved = `#${[red, green, blue]
      .map((value) => Math.max(0, Math.min(255, value)).toString(16).padStart(2, "0"))
      .join("")}`.toUpperCase();
  } else {
    resolved = hexadecimal(attribute(color, "val"), fallback);
  }
  return transformColor(resolved, color);
}

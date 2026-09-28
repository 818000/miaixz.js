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
 * Parses SpreadsheetML styles into fully resolved browser presentation values.
 */

import type {
  SpreadsheetBorderSide,
  SpreadsheetBorderStyle,
  SpreadsheetCellStyle,
  SpreadsheetFontStyle,
  SpreadsheetStyleTable,
} from "../../shared/contracts/document.js";
import {
  elementsByLocalName as elements,
  localAttribute as attribute,
  type XmlDocument,
  type XmlElement,
} from "../xml/xml-codec.js";
import type { OfficeTheme } from "./theme-codec.js";

const themeSlots = [
  "lt1",
  "dk1",
  "lt2",
  "dk2",
  "accent1",
  "accent2",
  "accent3",
  "accent4",
  "accent5",
  "accent6",
  "hlink",
  "folHlink",
] as const;

const indexedColors = [
  "#000000",
  "#FFFFFF",
  "#FF0000",
  "#00FF00",
  "#0000FF",
  "#FFFF00",
  "#FF00FF",
  "#00FFFF",
  "#000000",
  "#FFFFFF",
  "#FF0000",
  "#00FF00",
  "#0000FF",
  "#FFFF00",
  "#FF00FF",
  "#00FFFF",
  "#800000",
  "#008000",
  "#000080",
  "#808000",
  "#800080",
  "#008080",
  "#C0C0C0",
  "#808080",
  "#9999FF",
  "#993366",
  "#FFFFCC",
  "#CCFFFF",
  "#660066",
  "#FF8080",
  "#0066CC",
  "#CCCCFF",
  "#000080",
  "#FF00FF",
  "#FFFF00",
  "#00FFFF",
  "#800080",
  "#800000",
  "#008080",
  "#0000FF",
  "#00CCFF",
  "#CCFFFF",
  "#CCFFCC",
  "#FFFF99",
  "#99CCFF",
  "#FF99CC",
  "#CC99FF",
  "#FFCC99",
  "#3366FF",
  "#33CCCC",
  "#99CC00",
  "#FFCC00",
  "#FF9900",
  "#FF6600",
  "#666699",
  "#969696",
  "#003366",
  "#339966",
  "#003300",
  "#333300",
  "#993300",
  "#993366",
  "#333399",
  "#333333",
] as const;

const builtinNumberFormats: Readonly<Record<number, string>> = Object.freeze({
  0: "General",
  1: "0",
  2: "0.00",
  3: "#,##0",
  4: "#,##0.00",
  9: "0%",
  10: "0.00%",
  11: "0.00E+00",
  14: "m/d/yy",
  15: "d-mmm-yy",
  16: "d-mmm",
  17: "mmm-yy",
  18: "h:mm AM/PM",
  19: "h:mm:ss AM/PM",
  20: "h:mm",
  21: "h:mm:ss",
  22: "m/d/yy h:mm",
  49: "@",
});

/**
 * Returns direct element children matching one local name.
 *
 * @param parent - Parent XML element.
 * @param name - Child local name.
 * @returns Direct matching children.
 */
function children(parent: XmlElement | undefined, name: string): readonly XmlElement[] {
  return parent?.children.filter((element) => element.localName === name) ?? [];
}

/**
 * Returns the first direct child matching one local name.
 *
 * @param parent - Parent XML element.
 * @param name - Child local name.
 * @returns Matching child when present.
 */
function child(parent: XmlElement | undefined, name: string): XmlElement | undefined {
  return parent?.children.find((element) => element.localName === name);
}

/**
 * Parses one finite numeric attribute.
 *
 * @param value - Attribute text.
 * @param fallback - Deterministic fallback.
 * @returns Finite number.
 */
function number(value: string | undefined, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Applies Excel tint semantics to a resolved RGB color.
 *
 * @param color - Six-digit CSS hexadecimal color.
 * @param tint - Excel tint value in the range -1 through 1.
 * @returns Tinted CSS hexadecimal color.
 */
function applyTint(color: string, tint: number): string {
  if (tint === 0 || !/^#[\da-f]{6}$/iu.test(color)) return color;
  const channels = [1, 3, 5].map((offset) => Number.parseInt(color.slice(offset, offset + 2), 16));
  return `#${channels
    .map((channel) => {
      const result = tint < 0 ? channel * (1 + tint) : channel * (1 - tint) + 255 * tint;
      return Math.max(0, Math.min(255, Math.round(result)))
        .toString(16)
        .padStart(2, "0");
    })
    .join("")}`.toUpperCase();
}

/**
 * Resolves one SpreadsheetML color declaration.
 *
 * @param element - Color element.
 * @param theme - Active workbook theme.
 * @param fallback - Color used for automatic or invalid declarations.
 * @returns CSS color.
 */
function color(element: XmlElement | undefined, theme: OfficeTheme, fallback: string): string {
  if (element === undefined) return fallback;
  const rgb = attribute(element, "rgb");
  let result =
    rgb !== undefined && /^[\da-f]{8}$/iu.test(rgb)
      ? `#${rgb.slice(2).toUpperCase()}`
      : rgb !== undefined && /^[\da-f]{6}$/iu.test(rgb)
        ? `#${rgb.toUpperCase()}`
        : undefined;
  const themeIndex = number(attribute(element, "theme"), -1);
  if (result === undefined && Number.isInteger(themeIndex) && themeIndex >= 0) {
    result = theme.colors.get(themeSlots[themeIndex] ?? "") ?? undefined;
  }
  const indexed = number(attribute(element, "indexed"), -1);
  if (result === undefined && Number.isInteger(indexed) && indexed >= 0 && indexed < 64) {
    result = indexedColors[indexed];
  }
  return applyTint(result ?? fallback, number(attribute(element, "tint")));
}

/**
 * Maps workbook font names to deterministic browser families.
 *
 * @param name - Workbook font family.
 * @returns Stable local-first CSS family list.
 */
function fontFamily(name: string | undefined): string {
  const normalized = name?.normalize("NFKC").toLowerCase() ?? "";
  if (normalized.includes("meiryo") || normalized.includes("ms p gothic")) {
    return '"Noto Sans JP", "Yu Gothic", sans-serif';
  }
  if (normalized.includes("cambria")) return 'Caladea, "Noto Serif", serif';
  if (normalized.includes("calibri")) return 'Carlito, "Noto Sans", sans-serif';
  return name === undefined
    ? '"Noto Sans", sans-serif'
    : `"${name.replaceAll('"', "")}", sans-serif`;
}

/**
 * Resolves the maximum digit width used by Excel's column-width formula.
 *
 * The OOXML width value is expressed in characters of the Normal style font;
 * it is not an absolute pixel width. This metric must therefore come from the
 * source font even when the browser substitutes a different display font.
 *
 * @param document - Parsed styles.xml document.
 * @returns Maximum digit width in CSS pixels at 96 DPI.
 */
export function spreadsheetNormalMaximumDigitWidth(document: XmlDocument): number {
  const fontsRoot = elements(document, "fonts")[0];
  const styleXfsRoot = elements(document, "cellStyleXfs")[0];
  const cellStylesRoot = elements(document, "cellStyles")[0];
  const normalStyle = children(cellStylesRoot, "cellStyle").find(
    (style) =>
      attribute(style, "builtinId") === "0" ||
      ["normal", "標準"].includes((attribute(style, "name") ?? "").normalize("NFKC").toLowerCase()),
  );
  const normalXf = children(styleXfsRoot, "xf")[
    Math.max(0, Math.floor(number(attribute(normalStyle ?? document.documentElement, "xfId"))))
  ];
  const font =
    children(fontsRoot, "font")[
      Math.max(0, Math.floor(number(attribute(normalXf ?? document.documentElement, "fontId"))))
    ] ?? children(fontsRoot, "font")[0];
  const name = attribute(child(font, "name") ?? document.documentElement, "val")
    ?.normalize("NFKC")
    .toLowerCase();
  const size = number(attribute(child(font, "sz") ?? document.documentElement, "val"), 11);
  const isWideJapanese =
    name?.includes("ms p gothic") === true ||
    name?.includes("pゴシック") === true ||
    name?.includes("meiryo") === true ||
    name?.includes("メイリオ") === true ||
    name?.includes("yu gothic") === true ||
    name?.includes("游ゴシック") === true;
  if (isWideJapanese) return size <= 9 ? 7 : size <= 11 ? 8 : Math.max(8, Math.round(size * 0.73));
  return size <= 11 ? 7 : Math.max(7, Math.round(size * (7 / 11)));
}

/**
 * Parses one workbook font.
 *
 * @param element - Font XML element.
 * @param theme - Active workbook theme.
 * @returns Resolved font style.
 */
function parseFont(element: XmlElement, theme: OfficeTheme): SpreadsheetFontStyle {
  return {
    family: fontFamily(attribute(child(element, "name") ?? element, "val")),
    size: Math.max(1, number(attribute(child(element, "sz") ?? element, "val"), 11) * (4 / 3)),
    color: color(child(element, "color"), theme, "#000000"),
    bold: child(element, "b") !== undefined,
    italic: child(element, "i") !== undefined,
    underline: child(element, "u") !== undefined,
    strike: child(element, "strike") !== undefined,
  };
}

/**
 * Converts one SpreadsheetML border style to CSS width.
 *
 * @param style - OOXML border style identifier.
 * @returns CSS pixel width.
 */
function borderWidth(style: string): number {
  if (["medium", "mediumDashDot", "mediumDashDotDot", "mediumDashed"].includes(style)) return 2;
  if (["thick", "double"].includes(style)) return 3;
  if (style === "hair") return 0.5;
  return 1;
}

/**
 * Parses one border edge.
 *
 * @param element - Border edge element.
 * @param theme - Active workbook theme.
 * @returns Visible border edge when styled.
 */
function parseBorderSide(
  element: XmlElement | undefined,
  theme: OfficeTheme,
): SpreadsheetBorderSide | undefined {
  const style = element === undefined ? undefined : attribute(element, "style");
  if (style === undefined) return undefined;
  return {
    color: color(child(element, "color"), theme, "#000000"),
    style,
    width: borderWidth(style),
  };
}

/**
 * Parses one four-sided border.
 *
 * @param element - Border XML element.
 * @param theme - Active workbook theme.
 * @returns Resolved border style.
 */
function parseBorder(element: XmlElement, theme: OfficeTheme): SpreadsheetBorderStyle {
  const top = parseBorderSide(child(element, "top"), theme);
  const right = parseBorderSide(child(element, "right"), theme);
  const bottom = parseBorderSide(child(element, "bottom"), theme);
  const left = parseBorderSide(child(element, "left"), theme);
  return {
    ...(top === undefined ? {} : { top }),
    ...(right === undefined ? {} : { right }),
    ...(bottom === undefined ? {} : { bottom }),
    ...(left === undefined ? {} : { left }),
  };
}

/**
 * Parses one workbook style table.
 *
 * @param document - Parsed styles.xml document.
 * @param theme - Active workbook theme.
 * @returns Fully resolved style table.
 */
export function parseSpreadsheetStyles(
  document: XmlDocument,
  theme: OfficeTheme,
): SpreadsheetStyleTable {
  const fontsRoot = elements(document, "fonts")[0];
  const fillsRoot = elements(document, "fills")[0];
  const bordersRoot = elements(document, "borders")[0];
  const cellXfsRoot = elements(document, "cellXfs")[0];
  const styleXfsRoot = elements(document, "cellStyleXfs")[0];
  const fonts = children(fontsRoot, "font").map((font) => parseFont(font, theme));
  const fills = children(fillsRoot, "fill").map((fill) => {
    const pattern = child(fill, "patternFill");
    return attribute(pattern ?? fill, "patternType") === "solid"
      ? color(child(pattern, "fgColor"), theme, "#FFFFFF")
      : undefined;
  });
  const borders = children(bordersRoot, "border").map((border) => parseBorder(border, theme));
  const styleXfs = children(styleXfsRoot, "xf");
  const customFormats = new Map(
    elements(document, "numFmt").map((format) => [
      number(attribute(format, "numFmtId")),
      attribute(format, "formatCode") ?? "General",
    ]),
  );
  const fallbackFont: SpreadsheetFontStyle = {
    family: '"Noto Sans", sans-serif',
    size: 11 * (4 / 3),
    color: "#000000",
    bold: false,
    italic: false,
    underline: false,
    strike: false,
  };
  const cellStyles: SpreadsheetCellStyle[] = children(cellXfsRoot, "xf").map((xf) => {
    const base = styleXfs[number(attribute(xf, "xfId"))];
    const inherited = (name: string): string | undefined =>
      attribute(xf, name) ?? (base === undefined ? undefined : attribute(base, name));
    const alignment = child(xf, "alignment") ?? child(base, "alignment");
    const horizontalValue = attribute(alignment ?? xf, "horizontal");
    const verticalValue = attribute(alignment ?? xf, "vertical");
    const numFmtId = number(inherited("numFmtId"));
    const fill = fills[number(inherited("fillId"))];
    return {
      font: fonts[number(inherited("fontId"))] ?? fallbackFont,
      ...(fill === undefined ? {} : { fill }),
      border: borders[number(inherited("borderId"))] ?? {},
      horizontal: ["center", "fill", "justify", "left", "right"].includes(horizontalValue ?? "")
        ? (horizontalValue as SpreadsheetCellStyle["horizontal"])
        : "general",
      vertical: ["center", "top"].includes(verticalValue ?? "")
        ? (verticalValue as SpreadsheetCellStyle["vertical"])
        : "bottom",
      wrapText: attribute(alignment ?? xf, "wrapText") === "1",
      shrinkToFit: attribute(alignment ?? xf, "shrinkToFit") === "1",
      textRotation: number(attribute(alignment ?? xf, "textRotation")),
      numberFormat: customFormats.get(numFmtId) ?? builtinNumberFormats[numFmtId] ?? "General",
    };
  });
  if (cellStyles.length === 0) {
    cellStyles.push({
      font: fallbackFont,
      border: {},
      horizontal: "general",
      vertical: "bottom",
      wrapText: false,
      shrinkToFit: false,
      textRotation: 0,
      numberFormat: "General",
    });
  }
  return {
    cellStyles,
    fontCount: fonts.length,
    fillCount: fills.length,
    borderCount: borders.length,
  };
}

/**
 * Formats a saved cell value without evaluating formulas.
 *
 * @param value - Saved scalar value.
 * @param style - Resolved cell style.
 * @param date1904 - Whether the workbook uses the 1904 date epoch.
 * @returns Browser-visible display text.
 */
export function formatSpreadsheetValue(
  value: string | number | boolean | null,
  style: SpreadsheetCellStyle,
  date1904: boolean,
): string {
  if (value === null) return "";
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (typeof value !== "number") return value;
  const format = style.numberFormat;
  if (/[dmyhs]/iu.test(format) && !/[#0]E[+-]00/iu.test(format)) {
    const epoch = Date.UTC(date1904 ? 1904 : 1899, date1904 ? 0 : 11, date1904 ? 1 : 30);
    const date = new Date(epoch + value * 86_400_000);
    if (!Number.isNaN(date.getTime())) {
      const hasTime = /[hs]/iu.test(format);
      return new Intl.DateTimeFormat("en-CA", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        ...(hasTime ? { hour: "2-digit", minute: "2-digit", hour12: false } : {}),
        timeZone: "UTC",
      }).format(date);
    }
  }
  if (format.includes("%")) {
    const decimals = format.includes(".00") ? 2 : format.includes(".0") ? 1 : 0;
    return `${(value * 100).toFixed(decimals)}%`;
  }
  if (/E[+-]00/iu.test(format)) return value.toExponential(2).replace("e", "E");
  const decimals = /\.([#0]+)/u.exec(format)?.[1]?.length;
  if (format.includes(",")) {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: decimals ?? 0,
      maximumFractionDigits: decimals ?? 3,
    }).format(value);
  }
  return decimals === undefined ? String(value) : value.toFixed(decimals);
}

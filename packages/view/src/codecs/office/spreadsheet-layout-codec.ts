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
 * Parses worksheet dimensions and creates the shared pixel coordinate index.
 */

import type {
  SpreadsheetColumnLayout,
  SpreadsheetPageMargins,
  SpreadsheetPageSetup,
  SpreadsheetPane,
  SpreadsheetRange,
  SpreadsheetRowLayout,
  SpreadsheetSelection,
  SpreadsheetSheetLayout,
} from "../../shared/contracts/document.js";
import {
  elementsByLocalName as elements,
  firstElementByLocalName as first,
  localAttribute as attribute,
  type XmlDocument,
  type XmlElement,
} from "../xml/xml-codec.js";

const maximumRows = 1_048_576;
const maximumColumns = 16_384;

/**
 * Supplies workbook-scoped print names to the worksheet layout parser.
 */
export interface SpreadsheetLayoutOptions {
  readonly printArea?: SpreadsheetRange;
  readonly printTitleRows?: SpreadsheetRange;
  /**
   * Maximum digit width of the workbook's Normal style font at 96 DPI.
   */
  readonly maximumDigitWidth?: number;
}

/**
 * Parses a finite number with a deterministic fallback.
 *
 * @param value - Source numeric text.
 * @param fallback - Value used for invalid input.
 * @returns Finite number.
 */
function number(value: string | undefined, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Converts an A1 column name to a zero-based index.
 *
 * @param source - Upper or lowercase A1 column name.
 * @returns Zero-based column index.
 */
export function spreadsheetColumnIndex(source: string): number {
  let result = 0;
  for (const character of source.toUpperCase()) {
    const digit = character.charCodeAt(0) - 64;
    if (digit < 1 || digit > 26) return -1;
    result = result * 26 + digit;
  }
  return result - 1;
}

/**
 * Parses one A1 cell address.
 *
 * @param address - A1 cell address, optionally absolute.
 * @returns Zero-based row and column when valid.
 */
export function parseSpreadsheetAddress(
  address: string,
): { readonly row: number; readonly column: number } | undefined {
  const match = /^\$?([A-Z]{1,3})\$?(\d+)$/iu.exec(address);
  if (match === null) return undefined;
  const column = spreadsheetColumnIndex(match[1] ?? "");
  const row = Number(match[2]) - 1;
  if (column < 0 || column >= maximumColumns || row < 0 || row >= maximumRows) return undefined;
  return { row, column };
}

/**
 * Parses one A1 range and normalizes its direction.
 *
 * @param reference - Single-cell or two-cell A1 range.
 * @returns Normalized zero-based range.
 */
export function parseSpreadsheetRange(reference: string): SpreadsheetRange | undefined {
  const [startReference, endReference = startReference] = reference.split(":");
  if (startReference === undefined || endReference === undefined) return undefined;
  const start = parseSpreadsheetAddress(startReference);
  const end = parseSpreadsheetAddress(endReference);
  if (start === undefined || end === undefined) return undefined;
  return {
    reference,
    startRow: Math.min(start.row, end.row),
    startColumn: Math.min(start.column, end.column),
    endRow: Math.max(start.row, end.row),
    endColumn: Math.max(start.column, end.column),
  };
}

/**
 * Converts Excel character width to CSS pixels using the workbook Normal
 * style font's maximum digit width. Column widths are stored in character
 * units, so assuming Calibri's 7-pixel metric compresses workbooks authored
 * with wider CJK fonts even when the rendered font itself is substituted.
 *
 * @param width - Excel column width.
 * @param maximumDigitWidth - Maximum 0-9 glyph width at 96 DPI.
 * @returns CSS pixel width.
 */
export function spreadsheetColumnWidth(width: number, maximumDigitWidth = 7): number {
  if (!Number.isFinite(width) || width <= 0) return 0;
  const digitWidth =
    Number.isFinite(maximumDigitWidth) && maximumDigitWidth > 0 ? maximumDigitWidth : 7;
  return Math.max(1, Math.floor(((256 * width + Math.floor(128 / digitWidth)) / 256) * digitWidth));
}

/**
 * Converts point height to CSS pixels at 96 DPI.
 *
 * @param height - Row height in points.
 * @returns CSS pixel height.
 */
export function spreadsheetRowHeight(height: number): number {
  return Math.max(0, height * (96 / 72));
}

/**
 * Parses a worksheet into deterministic row and column offsets.
 *
 * @param document - Parsed worksheet XML.
 * @param options - Workbook-scoped print ranges for the worksheet.
 * @returns Complete saved-state layout for the worksheet used range.
 */
export function parseSpreadsheetLayout(
  document: XmlDocument,
  options: SpreadsheetLayoutOptions = {},
): SpreadsheetSheetLayout {
  const declaredDimension = parseSpreadsheetRange(
    attribute(first(document, "dimension") ?? document.documentElement, "ref") ?? "A1",
  );
  const mergedCells = elements(document, "mergeCell")
    .map((element) => parseSpreadsheetRange(attribute(element, "ref") ?? ""))
    .filter((range): range is SpreadsheetRange => range !== undefined);
  const cellAddresses = elements(document, "c")
    .map((cell) => parseSpreadsheetAddress(attribute(cell, "r") ?? ""))
    .filter(
      (address): address is { readonly row: number; readonly column: number } =>
        address !== undefined,
    );
  const format = first(document, "sheetFormatPr");
  const maximumDigitWidth = options.maximumDigitWidth ?? 7;
  const defaultColumnCharacterWidth = number(
    attribute(format ?? document.documentElement, "defaultColWidth"),
    8.43,
  );
  const defaultRowHeight = spreadsheetRowHeight(
    number(attribute(format ?? document.documentElement, "defaultRowHeight"), 15),
  );
  const defaultColumnWidth = spreadsheetColumnWidth(defaultColumnCharacterWidth, maximumDigitWidth);
  const rows: SpreadsheetRowLayout[] = elements(document, "row").map((row, index) => {
    const rowIndex = Math.max(0, Math.floor(number(attribute(row, "r"), index + 1)) - 1);
    const hidden = attribute(row, "hidden") === "1";
    const styleId = attribute(row, "s");
    return {
      index: rowIndex,
      height: hidden
        ? 0
        : spreadsheetRowHeight(number(attribute(row, "ht"), defaultRowHeight * (72 / 96))),
      hidden,
      outlineLevel: Math.max(0, Math.min(7, Math.floor(number(attribute(row, "outlineLevel"))))),
      collapsed: attribute(row, "collapsed") === "1",
      ...(styleId === undefined ? {} : { styleId: Math.max(0, Math.floor(number(styleId))) }),
    };
  });
  const columns: SpreadsheetColumnLayout[] = elements(document, "col").map((column) => {
    const start = Math.max(0, Math.floor(number(attribute(column, "min"), 1)) - 1);
    const end = Math.max(start, Math.floor(number(attribute(column, "max"), start + 1)) - 1);
    const hidden = attribute(column, "hidden") === "1";
    const styleId = attribute(column, "style");
    return {
      start,
      end,
      width: hidden
        ? 0
        : spreadsheetColumnWidth(
            number(attribute(column, "width"), defaultColumnCharacterWidth),
            maximumDigitWidth,
          ),
      hidden,
      outlineLevel: Math.max(0, Math.min(7, Math.floor(number(attribute(column, "outlineLevel"))))),
      collapsed: attribute(column, "collapsed") === "1",
      ...(styleId === undefined ? {} : { styleId: Math.max(0, Math.floor(number(styleId))) }),
    };
  });
  const maximumCellRow = Math.max(0, ...cellAddresses.map((address) => address.row));
  const maximumCellColumn = Math.max(0, ...cellAddresses.map((address) => address.column));
  const maximumMergeRow = Math.max(0, ...mergedCells.map((range) => range.endRow));
  const maximumMergeColumn = Math.max(0, ...mergedCells.map((range) => range.endColumn));
  const maximumRow = Math.min(
    maximumRows - 1,
    Math.max(
      declaredDimension?.endRow ?? 0,
      options.printArea?.endRow ?? 0,
      maximumCellRow,
      maximumMergeRow,
      ...rows.map((row) => row.index),
    ),
  );
  const maximumColumn = Math.min(
    maximumColumns - 1,
    Math.max(
      declaredDimension?.endColumn ?? 0,
      options.printArea?.endColumn ?? 0,
      maximumCellColumn,
      maximumMergeColumn,
      ...columns.map((column) => column.end),
    ),
  );
  const rowHeights = Array.from({ length: maximumRow + 1 }, () => defaultRowHeight);
  for (const row of rows) if (row.index <= maximumRow) rowHeights[row.index] = row.height;
  const columnWidths = Array.from({ length: maximumColumn + 1 }, () => defaultColumnWidth);
  for (const column of columns) {
    for (let index = column.start; index <= Math.min(maximumColumn, column.end); index += 1) {
      columnWidths[index] = column.width;
    }
  }
  const rowOffsets = [0];
  for (const height of rowHeights) rowOffsets.push((rowOffsets.at(-1) ?? 0) + height);
  const columnOffsets = [0];
  for (const width of columnWidths) columnOffsets.push((columnOffsets.at(-1) ?? 0) + width);
  const sheetView = elements(document, "sheetView")[0];
  const outline = first(document, "outlinePr");
  const paneElement = first(sheetView ?? document.documentElement, "pane");
  let pane: SpreadsheetPane | undefined;
  if (paneElement !== undefined) {
    const state = attribute(paneElement, "state");
    const topLeftCell = attribute(paneElement, "topLeftCell");
    const activePane = attribute(paneElement, "activePane");
    pane = {
      xSplit: number(attribute(paneElement, "xSplit")),
      ySplit: number(attribute(paneElement, "ySplit")),
      ...(state === "frozen" || state === "frozenSplit" || state === "split" ? { state } : {}),
      ...(topLeftCell === undefined ? {} : { topLeftCell }),
      ...(activePane === "bottomLeft" ||
      activePane === "bottomRight" ||
      activePane === "topLeft" ||
      activePane === "topRight"
        ? { activePane }
        : {}),
    };
  }
  const selections: SpreadsheetSelection[] = elements(
    sheetView ?? document.documentElement,
    "selection",
  )
    .map((selection) => {
      const activeCell = attribute(selection, "activeCell");
      const range = attribute(selection, "sqref");
      const selectionPane = attribute(selection, "pane");
      if (activeCell === undefined || range === undefined) return undefined;
      return {
        activeCell,
        range,
        ...(selectionPane === "bottomLeft" ||
        selectionPane === "bottomRight" ||
        selectionPane === "topLeft" ||
        selectionPane === "topRight"
          ? { pane: selectionPane }
          : {}),
      } satisfies SpreadsheetSelection;
    })
    .filter((selection): selection is SpreadsheetSelection => selection !== undefined);
  const activeSelection =
    selections.find((selection) => selection.pane === pane?.activePane) ?? selections.at(-1);
  const marginElement = first(document, "pageMargins");
  const pageMargins: SpreadsheetPageMargins = {
    left: number(attribute(marginElement ?? document.documentElement, "left"), 0.7),
    right: number(attribute(marginElement ?? document.documentElement, "right"), 0.7),
    top: number(attribute(marginElement ?? document.documentElement, "top"), 0.75),
    bottom: number(attribute(marginElement ?? document.documentElement, "bottom"), 0.75),
    header: number(attribute(marginElement ?? document.documentElement, "header"), 0.3),
    footer: number(attribute(marginElement ?? document.documentElement, "footer"), 0.3),
  };
  const setupElement = first(document, "pageSetup");
  const orientation = attribute(setupElement ?? document.documentElement, "orientation");
  const paperSize = attribute(setupElement ?? document.documentElement, "paperSize");
  const fitToWidth = attribute(setupElement ?? document.documentElement, "fitToWidth");
  const fitToHeight = attribute(setupElement ?? document.documentElement, "fitToHeight");
  const pageSetup: SpreadsheetPageSetup = {
    scale: Math.max(
      10,
      Math.min(400, number(attribute(setupElement ?? document.documentElement, "scale"), 100)),
    ),
    orientation:
      orientation === "landscape" || orientation === "portrait" ? orientation : "default",
    ...(paperSize === undefined
      ? {}
      : { paperSize: Math.max(1, Math.floor(number(paperSize, 1))) }),
    ...(fitToWidth === undefined
      ? {}
      : { fitToWidth: Math.max(0, Math.floor(number(fitToWidth))) }),
    ...(fitToHeight === undefined
      ? {}
      : { fitToHeight: Math.max(0, Math.floor(number(fitToHeight))) }),
  };
  const breakIds = (containerName: "colBreaks" | "rowBreaks"): number[] => {
    const container = first(document, containerName);
    if (container === undefined) return [];
    return container.children
      .filter((child) => child.localName === "brk" && attribute(child, "hidden") !== "1")
      .map((child) => Math.max(0, Math.floor(number(attribute(child, "id"), -1))))
      .filter((id) => id >= 0);
  };
  const savedView = attribute(sheetView ?? document.documentElement, "view");
  const zoomScaleNormal = number(
    attribute(sheetView ?? document.documentElement, "zoomScaleNormal"),
    100,
  );
  const zoomScale = number(
    attribute(sheetView ?? document.documentElement, "zoomScale"),
    zoomScaleNormal,
  );
  return {
    dimension: {
      reference: declaredDimension?.reference ?? `A1`,
      startRow: 0,
      startColumn: 0,
      endRow: maximumRow,
      endColumn: maximumColumn,
    },
    defaultRowHeight,
    defaultColumnWidth,
    rows,
    columns,
    mergedCells,
    columnOffsets: Float64Array.from(columnOffsets),
    rowOffsets: Float64Array.from(rowOffsets),
    width: columnOffsets.at(-1) ?? 0,
    height: rowOffsets.at(-1) ?? 0,
    showGridLines: attribute(sheetView ?? document.documentElement, "showGridLines") !== "0",
    showRowColumnHeaders:
      attribute(sheetView ?? document.documentElement, "showRowColHeaders") !== "0",
    rightToLeft: attribute(sheetView ?? document.documentElement, "rightToLeft") === "1",
    outlineSummaryBelow: attribute(outline ?? document.documentElement, "summaryBelow") !== "0",
    outlineSummaryRight: attribute(outline ?? document.documentElement, "summaryRight") !== "0",
    viewMode: savedView === "pageBreakPreview" || savedView === "pageLayout" ? savedView : "normal",
    zoomScale,
    zoomScaleNormal,
    zoomScalePageLayout: number(
      attribute(sheetView ?? document.documentElement, "zoomScaleSheetLayoutView"),
      100,
    ),
    ...(pane === undefined ? {} : { pane }),
    selections,
    ...(activeSelection === undefined ? {} : { activeSelection }),
    pageMargins,
    pageSetup,
    ...(options.printArea === undefined ? {} : { printArea: options.printArea }),
    ...(options.printTitleRows === undefined ? {} : { printTitleRows: options.printTitleRows }),
    rowBreaks: breakIds("rowBreaks"),
    columnBreaks: breakIds("colBreaks"),
  };
}

/**
 * Converts one DrawingML cell marker to the shared worksheet coordinates.
 *
 * @param layout - Worksheet layout index.
 * @param column - Zero-based anchor column.
 * @param row - Zero-based anchor row.
 * @param columnOffsetEmu - Horizontal marker offset in EMU.
 * @param rowOffsetEmu - Vertical marker offset in EMU.
 * @returns CSS pixel point.
 */
export function spreadsheetMarkerPosition(
  layout: SpreadsheetSheetLayout,
  column: number,
  row: number,
  columnOffsetEmu: number,
  rowOffsetEmu: number,
): { readonly x: number; readonly y: number } {
  return {
    x:
      (layout.columnOffsets[Math.max(0, Math.min(column, layout.columnOffsets.length - 1))] ?? 0) +
      columnOffsetEmu / 9525,
    y:
      (layout.rowOffsets[Math.max(0, Math.min(row, layout.rowOffsets.length - 1))] ?? 0) +
      rowOffsetEmu / 9525,
  };
}

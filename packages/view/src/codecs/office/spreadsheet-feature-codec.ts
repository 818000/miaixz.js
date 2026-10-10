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
 * Derives XLSX completeness from discovered, modeled, and renderable feature counts.
 */

import type {
  ParseOutcome,
  SpreadsheetCoverageEntry,
  SpreadsheetCoverageLedger,
  SpreadsheetRenderDocument,
  ViewerWarning,
} from "../../shared/contracts/document.js";

/**
 * Checks that one transferred coordinate index is finite and monotonic.
 *
 * @param offsets - Row or column offsets shared by every rendering layer.
 * @returns Whether the coordinate index can be consumed by binary search and Canvas.
 */
function validOffsets(offsets: Float64Array): boolean {
  let previous = Number.NEGATIVE_INFINITY;
  for (const offset of offsets) {
    if (!Number.isFinite(offset) || offset < previous) return false;
    previous = offset;
  }
  return true;
}

/**
 * Builds one immutable feature coverage ledger from a complete spreadsheet model.
 *
 * @param document - Layout-aware spreadsheet model.
 * @param unsupportedEntries - Visible feature families discovered but not modeled.
 * @returns Coverage ledger used for status derivation.
 */
export function buildSpreadsheetCoverage(
  document: Omit<SpreadsheetRenderDocument, "coverage">,
  unsupportedEntries: readonly SpreadsheetCoverageEntry[] = [],
): SpreadsheetCoverageLedger {
  const cells = document.sheets.flatMap((sheet) => sheet.cells);
  const drawingShapes = document.drawings.flatMap((drawing) => drawing.shapes);
  const imageShapes = drawingShapes.filter((shape) => shape.kind === "image");
  const unsupportedDrawingCount = document.drawings.reduce(
    (count, drawing) => count + (drawing.features?.unsupportedCount ?? 0),
    0,
  );
  const renderableImages = imageShapes.filter(
    (shape) =>
      shape.source !== undefined &&
      shape.source !== "" &&
      shape.mimeType !== "image/emf" &&
      shape.mimeType !== "image/wmf",
  ).length;
  const renderableSheets = document.sheets.filter((sheet) => {
    const { columnOffsets, dimension, height, rowOffsets, width } = sheet.layout;
    return (
      columnOffsets.length > dimension.endColumn + 1 &&
      rowOffsets.length > dimension.endRow + 1 &&
      Number.isFinite(width) &&
      width >= 0 &&
      Number.isFinite(height) &&
      height >= 0 &&
      validOffsets(columnOffsets) &&
      validOffsets(rowOffsets)
    );
  }).length;
  const renderableCells = document.sheets.reduce(
    (count, sheet) =>
      count +
      sheet.cells.filter(
        (cell) =>
          cell.row >= 0 &&
          cell.row + 1 < sheet.layout.rowOffsets.length &&
          cell.column >= 0 &&
          cell.column + 1 < sheet.layout.columnOffsets.length &&
          cell.styleId >= 0 &&
          cell.styleId < document.styles.cellStyles.length,
      ).length,
    0,
  );
  const renderableDrawings = drawingShapes.filter(
    (shape) =>
      [shape.x, shape.y, shape.width, shape.height].every(Number.isFinite) &&
      shape.width >= 0 &&
      shape.height >= 0,
  ).length;
  const entries: SpreadsheetCoverageEntry[] = [
    {
      feature: "workbook",
      part: "xl/workbook.xml",
      discovered: 1,
      modeled: 1,
      renderable: 1,
      skipped: 0,
    },
    {
      feature: "sheet-layout",
      part: "xl/worksheets/*",
      discovered: document.sheets.length,
      modeled: document.sheets.length,
      renderable: renderableSheets,
      skipped: document.sheets.length - renderableSheets,
    },
    {
      feature: "cell",
      part: "xl/worksheets/*",
      discovered: cells.length,
      modeled: cells.length,
      renderable: renderableCells,
      skipped: cells.length - renderableCells,
    },
    {
      feature: "style",
      part: "xl/styles.xml",
      discovered: document.styles.cellStyles.length,
      modeled: document.styles.cellStyles.length,
      renderable: document.styles.cellStyles.length,
      skipped: 0,
    },
    {
      feature: "merge",
      part: "xl/worksheets/*",
      discovered: document.sheets.reduce(
        (count, sheet) => count + sheet.layout.mergedCells.length,
        0,
      ),
      modeled: document.sheets.reduce((count, sheet) => count + sheet.layout.mergedCells.length, 0),
      renderable: document.sheets.reduce(
        (count, sheet) => count + sheet.layout.mergedCells.length,
        0,
      ),
      skipped: 0,
    },
    {
      feature: "drawing",
      part: "xl/drawings/*",
      discovered: drawingShapes.length + unsupportedDrawingCount,
      modeled: drawingShapes.length,
      renderable: renderableDrawings,
      skipped: unsupportedDrawingCount + drawingShapes.length - renderableDrawings,
    },
    {
      feature: "image",
      part: "xl/media/*",
      discovered: imageShapes.length,
      modeled: imageShapes.length,
      renderable: renderableImages,
      skipped: imageShapes.length - renderableImages,
    },
    {
      feature: "view",
      part: "xl/worksheets/*/sheetViews",
      discovered: document.sheets.length,
      modeled: document.sheets.length,
      renderable: document.sheets.length,
      skipped: 0,
    },
  ];
  return { entries: [...entries, ...unsupportedEntries] };
}

/**
 * Converts one spreadsheet model into a truthful public parse result.
 *
 * @param document - Spreadsheet model whose coverage is already attached.
 * @param warnings - Non-fatal parse diagnostics.
 * @returns Complete result only when every visible feature is renderable.
 */
export function spreadsheetParseOutcome(
  document: SpreadsheetRenderDocument,
  warnings: readonly ViewerWarning[],
): ParseOutcome<SpreadsheetRenderDocument> {
  const incomplete = document.coverage.entries.filter(
    (entry) =>
      entry.discovered !== entry.modeled ||
      entry.modeled !== entry.renderable ||
      entry.skipped !== 0,
  );
  if (incomplete.length === 0) return { status: "complete", model: document, warnings };
  return {
    status: "partial",
    model: document,
    warnings: [
      ...warnings,
      { code: "XLSX_UNSUPPORTED_VISIBLE_FEATURE", messageKey: "xlsx.unsupportedVisibleFeature" },
    ],
    skipped: incomplete.map((entry) => ({
      code: `XLSX_${entry.feature.toUpperCase().replaceAll("-", "_")}_SKIPPED`,
      count: Math.max(entry.skipped, entry.discovered - entry.renderable),
    })),
  };
}

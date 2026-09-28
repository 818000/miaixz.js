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
 * Renders selectable text only for cells intersecting the current worksheet viewport.
 */

import type {
  SpreadsheetRange,
  SpreadsheetRenderCell,
  SpreadsheetRenderSheet,
  SpreadsheetStyleTable,
} from "../../shared/contracts/document.js";
import type { SpreadsheetViewportRect } from "./spreadsheet-cell-canvas.js";

/**
 * Returns the merge owned by one top-left cell.
 *
 * @param cell - Candidate worksheet cell.
 * @param ranges - Saved merged-cell ranges.
 * @returns Merge range when the cell owns it.
 */
function ownedMerge(
  cell: SpreadsheetRenderCell,
  ranges: readonly SpreadsheetRange[],
): SpreadsheetRange | undefined {
  return ranges.find((range) => range.startRow === cell.row && range.startColumn === cell.column);
}

/**
 * Reports whether a non-owner cell is covered by a merge.
 *
 * @param cell - Candidate worksheet cell.
 * @param ranges - Saved merged-cell ranges.
 * @returns True when another cell owns the covered region.
 */
function coveredByMerge(cell: SpreadsheetRenderCell, ranges: readonly SpreadsheetRange[]): boolean {
  return ranges.some(
    (range) =>
      cell.row >= range.startRow &&
      cell.row <= range.endRow &&
      cell.column >= range.startColumn &&
      cell.column <= range.endColumn &&
      (cell.row !== range.startRow || cell.column !== range.startColumn),
  );
}

/**
 * Reports whether a coordinate is occupied by visible text or a merged range.
 *
 * @param row - Zero-based row being tested.
 * @param column - Zero-based column being tested.
 * @param occupied - Coordinates containing visible saved text.
 * @param ranges - Saved merged ranges which block overflow.
 * @returns Whether text from a neighboring cell must stop at the coordinate.
 */
function blocksTextOverflow(
  row: number,
  column: number,
  occupied: ReadonlySet<string>,
  ranges: readonly SpreadsheetRange[],
): boolean {
  if (occupied.has(`${row}:${column}`)) return true;
  return ranges.some(
    (range) =>
      row >= range.startRow &&
      row <= range.endRow &&
      column >= range.startColumn &&
      column <= range.endColumn,
  );
}

/**
 * Renders virtualized spreadsheet text cells.
 *
 * @param root0 - Sheet, styles, and visible rectangle.
 * @param root0.sheet - Active worksheet.
 * @param root0.styles - Resolved workbook styles.
 * @param root0.viewport - Buffered visible worksheet rectangle.
 * @param root0.selectedCellAddress - Selected cell highlighted for search or copying.
 * @param root0.onSelectCell - Selection callback for one visible cell.
 * @returns Text overlay.
 */
export function SpreadsheetTextLayer({
  sheet,
  styles,
  viewport,
  selectedCellAddress,
  onSelectCell,
}: {
  readonly sheet: SpreadsheetRenderSheet;
  readonly styles: SpreadsheetStyleTable;
  readonly viewport: SpreadsheetViewportRect;
  readonly selectedCellAddress?: string;
  readonly onSelectCell?: (address: string) => void;
}): React.ReactElement {
  const { columnOffsets, rowOffsets, mergedCells } = sheet.layout;
  const occupied = new Set(
    sheet.cells
      .filter((cell) => cell.displayValue !== "")
      .map((cell) => `${cell.row}:${cell.column}`),
  );
  const cells = sheet.cells.filter((cell) => {
    if (cell.displayValue === "" || coveredByMerge(cell, mergedCells)) return false;
    const left = columnOffsets[cell.column] ?? 0;
    const right = columnOffsets[cell.column + 1] ?? left;
    const top = rowOffsets[cell.row] ?? 0;
    const bottom = rowOffsets[cell.row + 1] ?? top;
    return (
      right >= viewport.x &&
      left <= viewport.x + viewport.width &&
      bottom >= viewport.y &&
      top <= viewport.y + viewport.height
    );
  });
  return (
    <div
      aria-label={`${sheet.name} cell text`}
      className="miaixz-preview-sheet-text-layer"
      role="grid"
    >
      {cells.map((cell) => {
        const merge = ownedMerge(cell, mergedCells);
        let startColumn = cell.column;
        let endColumn = merge?.endColumn ?? cell.column;
        const style = styles.cellStyles[cell.styleId] ?? styles.cellStyles[0];
        const horizontal =
          style?.horizontal === "general"
            ? typeof cell.value === "number"
              ? "right"
              : "left"
            : style?.horizontal;
        if (merge === undefined && style?.wrapText !== true && style?.shrinkToFit !== true) {
          if (horizontal === "right") {
            while (
              startColumn > 0 &&
              !blocksTextOverflow(cell.row, startColumn - 1, occupied, mergedCells)
            ) {
              startColumn -= 1;
            }
          } else if (horizontal === "left") {
            while (
              endColumn < sheet.layout.dimension.endColumn &&
              !blocksTextOverflow(cell.row, endColumn + 1, occupied, mergedCells)
            ) {
              endColumn += 1;
            }
          }
        }
        const left = columnOffsets[startColumn] ?? 0;
        const right = columnOffsets[endColumn + 1] ?? left;
        const top = rowOffsets[cell.row] ?? 0;
        const bottom = rowOffsets[(merge?.endRow ?? cell.row) + 1] ?? top;
        const vertical =
          style?.vertical === "top"
            ? "flex-start"
            : style?.vertical === "center"
              ? "center"
              : "flex-end";
        return (
          <div
            aria-selected={cell.address === selectedCellAddress}
            className={`miaixz-preview-sheet-cell-text${
              cell.address === selectedCellAddress ? " miaixz-preview-sheet-cell-selected" : ""
            }`}
            data-cell-address={cell.address}
            key={cell.address}
            onClick={() => onSelectCell?.(cell.address)}
            onCopy={(event) => {
              event.preventDefault();
              event.clipboardData.setData("text/plain", cell.displayValue);
            }}
            role="gridcell"
            style={{
              left,
              top,
              width: right - left,
              height: bottom - top,
              alignItems: vertical,
              justifyContent:
                horizontal === "center"
                  ? "center"
                  : horizontal === "right"
                    ? "flex-end"
                    : "flex-start",
              color: style?.font.color,
              fontFamily: style?.font.family,
              fontSize: style?.font.size,
              fontStyle: style?.font.italic === true ? "italic" : "normal",
              fontWeight: style?.font.bold === true ? 700 : 400,
              textDecoration: [
                style?.font.underline === true ? "underline" : "",
                style?.font.strike === true ? "line-through" : "",
              ]
                .filter(Boolean)
                .join(" "),
              whiteSpace: style?.wrapText === true ? "pre-wrap" : "pre",
              transform:
                style?.textRotation === undefined || style.textRotation === 0
                  ? undefined
                  : `rotate(${
                      style.textRotation > 90 ? 90 - style.textRotation : -style.textRotation
                    }deg)`,
            }}
            title={cell.formula === undefined ? undefined : `=${cell.formula}`}
            tabIndex={0}
          >
            {cell.displayValue}
          </div>
        );
      })}
    </div>
  );
}

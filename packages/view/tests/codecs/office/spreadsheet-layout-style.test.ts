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
 * Verifies deterministic worksheet coordinates and resolved inherited styles.
 */

import {
  parseSpreadsheetAddress,
  parseSpreadsheetLayout,
  parseSpreadsheetRange,
  spreadsheetColumnIndex,
  spreadsheetColumnWidth,
  spreadsheetMarkerPosition,
  spreadsheetRowHeight,
} from "../../../src/codecs/office/spreadsheet-layout-codec.js";
import {
  formatSpreadsheetValue,
  parseSpreadsheetStyles,
  spreadsheetNormalMaximumDigitWidth,
} from "../../../src/codecs/office/spreadsheet-style-codec.js";
import { defaultOfficeTheme } from "../../../src/codecs/office/theme-codec.js";
import { parseXmlDocument } from "../../../src/codecs/xml/xml-codec.js";

describe("spreadsheet layout and style codecs", () => {
  it("parses and rejects every bounded A1 address and range shape", () => {
    expect(spreadsheetColumnIndex("A")).toBe(0);
    expect(spreadsheetColumnIndex("Z")).toBe(25);
    expect(spreadsheetColumnIndex("AA")).toBe(26);
    expect(spreadsheetColumnIndex("A1")).toBe(-1);
    expect(parseSpreadsheetAddress("$XFD$1048576")).toEqual({
      row: 1_048_575,
      column: 16_383,
    });
    expect(parseSpreadsheetAddress("XFE1")).toBeUndefined();
    expect(parseSpreadsheetAddress("A0")).toBeUndefined();
    expect(parseSpreadsheetAddress("invalid")).toBeUndefined();
    expect(parseSpreadsheetRange("D4:B2")).toEqual({
      reference: "D4:B2",
      startRow: 1,
      startColumn: 1,
      endRow: 3,
      endColumn: 3,
    });
    expect(parseSpreadsheetRange("A1")).toMatchObject({ endRow: 0, endColumn: 0 });
    expect(parseSpreadsheetRange("A1:invalid")).toBeUndefined();
    expect(spreadsheetColumnWidth(0)).toBe(0);
    expect(spreadsheetColumnWidth(Number.NaN)).toBe(0);
    expect(spreadsheetColumnWidth(2.46484375, 8)).toBe(20);
    expect(spreadsheetRowHeight(15)).toBe(20);
  });

  it("preserves CJK Normal-font column geometry independently of font substitution", () => {
    const styles = parseXmlDocument(
      '<styleSheet><fonts><font><name val="ＭＳ Ｐゴシック"/><sz val="11"/></font></fonts><cellStyleXfs><xf fontId="0"/></cellStyleXfs><cellStyles><cellStyle name="標準" xfId="0" builtinId="0"/></cellStyles></styleSheet>',
      100,
    );
    expect(spreadsheetNormalMaximumDigitWidth(styles)).toBe(8);
    const layout = parseSpreadsheetLayout(
      parseXmlDocument(
        '<worksheet><sheetFormatPr defaultColWidth="2.46484375"/><sheetData><row><c r="C1"/></row></sheetData></worksheet>',
        100,
      ),
      { maximumDigitWidth: spreadsheetNormalMaximumDigitWidth(styles) },
    );
    expect(layout.columnOffsets[3]).toBe(60);
  });

  it("creates transferable row and column indices from saved worksheet geometry", () => {
    const layout = parseSpreadsheetLayout(
      parseXmlDocument(
        '<worksheet><dimension ref="B2:D4"/><sheetFormatPr defaultRowHeight="15" defaultColWidth="8.43"/><cols><col min="2" max="3" width="10" customWidth="1"/></cols><sheetViews><sheetView showGridLines="0" rightToLeft="1" zoomScale="125"><pane state="frozen" xSplit="1" ySplit="2" topLeftCell="B3"/></sheetView></sheetViews><sheetData><row r="2" ht="30" customHeight="1"><c r="B2"/></row><row r="4" hidden="1"><c r="D4"/></row></sheetData><mergeCells><mergeCell ref="B2:C3"/></mergeCells></worksheet>',
        100,
      ),
    );
    expect(layout.dimension).toMatchObject({ reference: "B2:D4", endRow: 3, endColumn: 3 });
    expect(layout.rowOffsets).toBeInstanceOf(Float64Array);
    expect(layout.columnOffsets).toBeInstanceOf(Float64Array);
    expect(layout.rowOffsets[2]).toBeCloseTo(60);
    expect(layout.rowOffsets[4]).toBeCloseTo(80);
    expect(layout.columnOffsets[3]).toBeGreaterThan(layout.columnOffsets[1] ?? 0);
    expect(layout.mergedCells).toEqual([
      {
        reference: "B2:C3",
        startRow: 1,
        startColumn: 1,
        endRow: 2,
        endColumn: 2,
      },
    ]);
    expect(layout.pane).toEqual({ state: "frozen", xSplit: 1, ySplit: 2, topLeftCell: "B3" });
    expect(layout.showGridLines).toBe(false);
    expect(layout.rightToLeft).toBe(true);
    expect(layout.zoomScale).toBe(125);
    expect(spreadsheetMarkerPosition(layout, 1, 1, 9525, 19_050)).toEqual({
      x: (layout.columnOffsets[1] ?? 0) + 1,
      y: (layout.rowOffsets[1] ?? 0) + 2,
    });
  });

  it("uses deterministic defaults for sparse, hidden, and split worksheet records", () => {
    const layout = parseSpreadsheetLayout(
      parseXmlDocument(
        '<worksheet><cols><col min="1" max="2" hidden="1" style="3"/></cols><sheetViews><sheetView><pane state="split" xSplit="3.5"/></sheetView></sheetViews><sheetData><row s="2"><c/><c r="bad"/></row></sheetData><mergeCells><mergeCell ref="bad"/></mergeCells></worksheet>',
        100,
      ),
    );
    expect(layout.dimension).toMatchObject({ reference: "A1", endRow: 0, endColumn: 1 });
    expect(layout.rows[0]).toMatchObject({ index: 0, styleId: 2, hidden: false });
    expect(layout.columns[0]).toMatchObject({
      start: 0,
      end: 1,
      width: 0,
      hidden: true,
      styleId: 3,
    });
    expect(layout.mergedCells).toHaveLength(0);
    expect(layout.pane).toEqual({ state: "split", xSplit: 3.5, ySplit: 0 });
    expect(layout.showGridLines).toBe(true);
    expect(layout.zoomScale).toBe(100);
  });

  it("inherits base XFs and resolves theme tint, borders, fill, and number format", () => {
    const styles = parseSpreadsheetStyles(
      parseXmlDocument(
        '<styleSheet><fonts><font><name val="Meiryo"/><sz val="12"/><color theme="4" tint="0.5"/><b/></font></fonts><fills><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF112233"/></patternFill></fill></fills><borders><border><left style="thin"><color rgb="FF445566"/></left></border></borders><cellStyleXfs><xf fontId="0" fillId="1" borderId="0" numFmtId="10"><alignment horizontal="right" vertical="center" wrapText="1"/></xf></cellStyleXfs><cellXfs><xf xfId="0"/></cellXfs></styleSheet>',
        100,
      ),
      defaultOfficeTheme(),
    );
    expect(styles).toMatchObject({ fontCount: 1, fillCount: 2, borderCount: 1 });
    expect(styles.cellStyles[0]).toMatchObject({
      fill: "#112233",
      horizontal: "right",
      vertical: "center",
      wrapText: true,
      numberFormat: "0.00%",
      font: { bold: true, family: expect.stringContaining("Noto Sans JP") },
      border: { left: { color: "#445566", style: "thin", width: 1 } },
    });
    expect(formatSpreadsheetValue(0.25, styles.cellStyles[0]!, false)).toBe("25.00%");
  });

  it("formats saved scalar values without evaluating formulas", () => {
    const style = parseSpreadsheetStyles(
      parseXmlDocument("<styleSheet/>", 10),
      defaultOfficeTheme(),
    ).cellStyles[0]!;
    expect(formatSpreadsheetValue(null, style, false)).toBe("");
    expect(formatSpreadsheetValue(true, style, false)).toBe("TRUE");
    expect(formatSpreadsheetValue(false, style, false)).toBe("FALSE");
    expect(formatSpreadsheetValue("saved", style, false)).toBe("saved");
    expect(formatSpreadsheetValue(12.5, { ...style, numberFormat: "0.00" }, false)).toBe("12.50");
    expect(formatSpreadsheetValue(12_345.5, { ...style, numberFormat: "#,##0.0" }, false)).toBe(
      "12,345.5",
    );
    expect(formatSpreadsheetValue(12.5, { ...style, numberFormat: "0.00E+00" }, false)).toBe(
      "1.25E+1",
    );
    expect(formatSpreadsheetValue(0.5, { ...style, numberFormat: "0%" }, false)).toBe("50%");
    expect(formatSpreadsheetValue(0.5, { ...style, numberFormat: "0.0%" }, false)).toBe("50.0%");
    expect(formatSpreadsheetValue(2, { ...style, numberFormat: "m/d/yy" }, false)).toContain(
      "1900",
    );
    expect(formatSpreadsheetValue(2.5, { ...style, numberFormat: "m/d/yy h:mm" }, true)).toContain(
      "1904",
    );
  });
});

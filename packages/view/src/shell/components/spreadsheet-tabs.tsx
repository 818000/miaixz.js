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
 * Renders accessible worksheet tabs without exposing hidden worksheets.
 */

import type { SpreadsheetRenderSheet } from "../../shared/contracts/document.js";

/**
 * Renders the visible workbook sheet selector.
 *
 * @param root0 - Visible sheets and controlled selection.
 * @param root0.sheets - Visible worksheets in workbook order.
 * @param root0.activeSheetId - Selected worksheet identifier.
 * @param root0.onChange - Selection callback.
 * @returns Accessible tab list.
 */
export function SpreadsheetTabs({
  sheets,
  activeSheetId,
  onChange,
}: {
  readonly sheets: readonly SpreadsheetRenderSheet[];
  readonly activeSheetId: string;
  readonly onChange: (sheetId: string) => void;
}): React.ReactElement {
  return (
    <div aria-label="Workbook sheets" className="miaixz-preview-sheet-tabs" role="tablist">
      {sheets.map((sheet) => (
        <button
          aria-controls={`miaixz-sheet-${sheet.id}`}
          aria-selected={sheet.id === activeSheetId}
          className="miaixz-preview-sheet-tab"
          data-tab-color={sheet.tabColor}
          key={sheet.id}
          onClick={() => onChange(sheet.id)}
          role="tab"
          style={
            sheet.tabColor === undefined
              ? undefined
              : ({ "--miaixz-sheet-tab-color": sheet.tabColor } as React.CSSProperties)
          }
          tabIndex={sheet.id === activeSheetId ? 0 : -1}
          type="button"
        >
          {sheet.name}
        </button>
      ))}
    </div>
  );
}

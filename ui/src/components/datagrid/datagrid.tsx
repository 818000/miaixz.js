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

/* eslint-disable jsdoc/require-jsdoc -- Public Datagrid contract lives in datagrid.types.
 */
import { forwardRef, useId, useMemo, type ReactElement, type RefAttributes } from "react";

import { MiaixzUiError } from "../../errors/ui-error.js";
import { useMiaixzLocale } from "../../i18n/i18n.js";
import { classNames } from "../../shared/class-names.js";
import { Checkbox } from "../checkbox/checkbox.js";
import { Icon } from "../icon/icon.js";
import { Overlay } from "../overlay/overlay.js";
import { Radio } from "../radio/radio.js";
import { Scroll } from "../scroll/scroll.js";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../table/table.js";
import type {
  DatagridColumn,
  DatagridProps,
  DatagridSort,
  DatagridSortDirection,
} from "./datagrid.types.js";
import { withMiaixzThemeComponent } from "../../theme/themed-component.js";

interface DatagridRow<Row> {
  readonly id: string;
  readonly value: Row;
}

function validatePercent(value: number | undefined): void {
  if (value !== undefined && (!Number.isFinite(value) || value <= 0 || value > 100)) {
    throw new MiaixzUiError({
      code: "UI_CONTROLLED_VALUE_INVALID",
    });
  }
}

function validateColumns<Row>(columns: readonly DatagridColumn<Row>[]): void {
  const ids = new Set<string>();
  for (const column of columns) {
    if (ids.has(column.id)) {
      throw new MiaixzUiError({
        code: "UI_TABLE_DUPLICATE_COLUMN_ID",
        details: { id: column.id },
      });
    }
    validatePercent(column.widthPercent);
    ids.add(column.id);
  }
}

function resolveRows<Row>(
  rows: readonly Row[],
  getRowId: (row: Readonly<Row>) => string,
): readonly DatagridRow<Row>[] {
  const ids = new Set<string>();
  return rows.map((value) => {
    const id = getRowId(value);
    if (ids.has(id)) {
      throw new MiaixzUiError({
        code: "UI_TABLE_DUPLICATE_ROW_ID",
        details: { id },
      });
    }
    ids.add(id);
    return { id, value };
  });
}

function getNextSort(columnId: string, current: DatagridSort | undefined) {
  if (current?.columnId !== columnId) return { columnId, direction: "ascending" as const };
  if (current.direction === "ascending") return { columnId, direction: "descending" as const };
  return undefined;
}

function getSortDirection(
  columnId: string,
  sort: DatagridSort | undefined,
): DatagridSortDirection | undefined {
  return sort?.columnId === columnId ? sort.direction : undefined;
}

function DatagridImplementation<Row>(
  properties: DatagridProps<Row>,
  reference: React.ForwardedRef<HTMLDivElement>,
): ReactElement {
  const {
    rows,
    columns,
    getRowId,
    sort,
    onSortChange,
    selectedRowIds,
    onSelectedRowIdsChange,
    selectionMode = "none",
    selectionWidthPercent,
    loading = false,
    error,
    emptyState,
    pagination,
    caption,
    surface = "plain",
    captionVisibility = "visible",
    layout = "auto",
    density = "standard",
    bodyLayout = "content",
    className,
    ...props
  } = properties;
  const { t } = useMiaixzLocale();
  const radioName = useId();
  const resolvedColumns = useMemo(() => {
    validateColumns(columns);
    return columns;
  }, [columns]);
  const resolvedRows = useMemo(() => resolveRows(rows, getRowId), [getRowId, rows]);
  validatePercent(selectionWidthPercent);
  const selectedValues = selectedRowIds ?? [];
  if (selectionMode === "single" && selectedValues.length > 1) {
    throw new MiaixzUiError({
      code: "UI_CONTROLLED_VALUE_INVALID",
    });
  }
  const selectedIds = new Set(selectedValues);
  const currentIds = new Set(resolvedRows.map((row) => row.id));
  const selectedCurrent = resolvedRows.filter((row) => selectedIds.has(row.id));
  const allCurrentSelected =
    resolvedRows.length > 0 && selectedCurrent.length === resolvedRows.length;
  const someCurrentSelected = selectedCurrent.length > 0 && !allCurrentSelected;
  const hasSelection = selectionMode !== "none";
  const columnCount = resolvedColumns.length + (hasSelection ? 1 : 0);
  const state = loading
    ? "loading"
    : error !== undefined
      ? "error"
      : rows.length === 0
        ? "empty"
        : "ready";

  const changeRowSelection = (rowId: string, checked: boolean) => {
    if (selectionMode === "single") {
      (onSelectedRowIdsChange as ((ids: readonly [] | readonly [string]) => void) | undefined)?.(
        checked ? [rowId] : [],
      );
      return;
    }
    if (selectionMode !== "multiple") return;
    const next = new Set(selectedIds);
    if (checked) next.add(rowId);
    else next.delete(rowId);
    (onSelectedRowIdsChange as ((ids: readonly string[]) => void) | undefined)?.([...next]);
  };
  const changePageSelection = () => {
    if (selectionMode !== "multiple") return;
    const next = new Set(selectedIds);
    for (const id of currentIds) {
      if (allCurrentSelected) next.delete(id);
      else next.add(id);
    }
    (onSelectedRowIdsChange as ((ids: readonly string[]) => void) | undefined)?.([...next]);
  };

  return (
    <div
      {...props}
      ref={reference}
      aria-busy={loading || undefined}
      data-state={state}
      data-surface={surface}
      data-density={density}
      data-layout={layout}
      data-body-layout={bodyLayout}
      data-caption-visibility={captionVisibility}
      className={classNames("miaixz-datagrid", className)}
    >
      <Overlay active={loading} label={t("ui.loading")}>
        <Scroll
          focusable="auto"
          aria-label={caption}
          className="miaixz-table-container miaixz-table-container-plain miaixz-datagrid-container"
        >
          <Table density={density} dividerStyle="dashed" stickyHeader={bodyLayout === "fill"}>
            <TableCaption>{caption}</TableCaption>
            <TableHeader>
              <TableRow>
                {hasSelection && (
                  <TableHead
                    className="miaixz-datagrid-selection-cell"
                    style={
                      selectionWidthPercent === undefined
                        ? undefined
                        : { width: `${selectionWidthPercent}%` }
                    }
                  >
                    {selectionMode === "multiple" && (
                      <Checkbox
                        aria-label={t("ui.table.selectPage")}
                        checked={allCurrentSelected}
                        indeterminate={someCurrentSelected}
                        disabled={resolvedRows.length === 0 || onSelectedRowIdsChange === undefined}
                        onChange={changePageSelection}
                      />
                    )}
                  </TableHead>
                )}
                {resolvedColumns.map((column) => {
                  const direction = getSortDirection(column.id, sort);
                  return (
                    <TableHead
                      key={column.id}
                      aria-sort={direction}
                      style={
                        column.widthPercent === undefined
                          ? undefined
                          : { width: `${column.widthPercent}%` }
                      }
                      className={`miaixz-datagrid-align-${column.align ?? "start"}`}
                    >
                      {column.sortable === true ? (
                        <button
                          type="button"
                          disabled={onSortChange === undefined}
                          data-state={direction ?? "none"}
                          className="miaixz-datagrid-sort"
                          onClick={() => onSortChange?.(getNextSort(column.id, sort))}
                        >
                          <span>{column.header}</span>
                          <Icon
                            name="ChevronDown"
                            size="inline"
                            className="miaixz-datagrid-sort-icon"
                          />
                        </button>
                      ) : (
                        column.header
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {error !== undefined ? (
                <TableRow>
                  <TableCell colSpan={columnCount} className="miaixz-datagrid-state-cell">
                    <div className="miaixz-datagrid-error" role="alert">
                      {error}
                    </div>
                  </TableCell>
                </TableRow>
              ) : resolvedRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columnCount} className="miaixz-datagrid-state-cell">
                    <div className="miaixz-datagrid-empty">{emptyState}</div>
                  </TableCell>
                </TableRow>
              ) : (
                resolvedRows.map((row) => {
                  const selected = hasSelection && selectedIds.has(row.id);
                  return (
                    <TableRow key={row.id} selected={selected}>
                      {hasSelection && (
                        <TableCell className="miaixz-datagrid-selection-cell">
                          {selectionMode === "multiple" ? (
                            <Checkbox
                              aria-label={t("ui.table.selectRow")}
                              checked={selected}
                              disabled={onSelectedRowIdsChange === undefined}
                              onChange={(event) =>
                                changeRowSelection(row.id, event.currentTarget.checked)
                              }
                            />
                          ) : (
                            <Radio
                              aria-label={t("ui.table.selectRow")}
                              name={radioName}
                              checked={selected}
                              disabled={onSelectedRowIdsChange === undefined}
                              onChange={(event) =>
                                changeRowSelection(row.id, event.currentTarget.checked)
                              }
                            />
                          )}
                        </TableCell>
                      )}
                      {resolvedColumns.map((column) => (
                        <TableCell
                          key={column.id}
                          className={`miaixz-datagrid-align-${column.align ?? "start"}`}
                        >
                          {column.cell(row.value)}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Scroll>
      </Overlay>
      {pagination !== undefined && <div className="miaixz-datagrid-pagination">{pagination}</div>}
    </div>
  );
}

/*
 * Renders a semantic server-side data table. @public
 */
export const Datagrid = withMiaixzThemeComponent(
  "Datagrid",
  forwardRef(DatagridImplementation) as <Row>(
    props: DatagridProps<Row> & RefAttributes<HTMLDivElement>,
  ) => ReactElement,
);

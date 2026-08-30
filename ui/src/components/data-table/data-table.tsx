import { forwardRef, useId, type ReactElement, type RefAttributes } from "react";

import type { MiaixzTranslator } from "@miaixz/sdk/i18n";

import { createMiaixzUiError } from "../../errors/index.js";
import { useMiaixzLocale } from "../../i18n/index.js";
import { classNames } from "../../internal/class-names.js";
import { Checkbox } from "../checkbox/index.js";
import { Icon } from "../icon/index.js";
import { LoadingOverlay } from "../loading-overlay/index.js";
import { Radio } from "../radio/index.js";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "../table/index.js";
import type {
  DataTableColumn,
  DataTableProps,
  DataTableSort,
  DataTableSortDirection,
} from "./data-table.types.js";

/**
 * Associates one immutable row value with its validated identifier.
 *
 * @typeParam Row - Consumer-owned row shape.
 */
interface MiaixzDataTableRow<Row> {
  /**
   * Contains the validated unique row identifier.
   */
  readonly id: string;

  /**
   * Contains the original consumer-owned row value.
   */
  readonly value: Row;
}

/**
 * Resolves the visual and semantic state exposed by the DataTable root.
 *
 * @param loading - Whether server data is currently loading.
 * @param error - Project-owned error content.
 * @param rowCount - Current page row count.
 * @returns Stable DataTable state attribute.
 */
function getMiaixzDataTableState(
  loading: boolean,
  error: unknown,
  rowCount: number,
): "loading" | "error" | "empty" | "ready" {
  if (loading) return "loading";
  if (error !== undefined) return "error";
  if (rowCount === 0) return "empty";
  return "ready";
}

/**
 * Validates unique column identifiers before rendering semantic headings.
 *
 * @typeParam Row - Consumer-owned row shape.
 * @param translate - Active localized message resolver.
 * @param columns - Consumer-provided column definitions.
 */
function validateMiaixzDataTableColumns<Row>(
  translate: MiaixzTranslator,
  columns: readonly DataTableColumn<Row>[],
): void {
  const identifiers = new Set<string>();
  for (const column of columns) {
    if (identifiers.has(column.id)) {
      throw createMiaixzUiError(translate, {
        code: "UI_TABLE_DUPLICATE_COLUMN_ID",
        messageKey: "ui.error.table.duplicateColumnId",
        details: { duplicateId: column.id },
      });
    }
    identifiers.add(column.id);
  }
}

/**
 * Resolves row identifiers once and rejects duplicate values.
 *
 * @typeParam Row - Consumer-owned row shape.
 * @param translate - Active localized message resolver.
 * @param rows - Current server-provided page.
 * @param getRowId - Consumer identifier resolver.
 * @returns Current rows paired with validated identifiers.
 */
function createMiaixzDataTableRows<Row>(
  translate: MiaixzTranslator,
  rows: readonly Row[],
  getRowId: (row: Readonly<Row>) => string,
): readonly MiaixzDataTableRow<Row>[] {
  const identifiers = new Set<string>();
  return rows.map((row) => {
    const id = getRowId(row);
    if (identifiers.has(id)) {
      throw createMiaixzUiError(translate, {
        code: "UI_TABLE_DUPLICATE_ROW_ID",
        messageKey: "ui.error.table.duplicateRowId",
        details: { duplicateId: id },
      });
    }
    identifiers.add(id);
    return { id, value: row };
  });
}

/**
 * Validates controlled sort and row-selection contracts.
 *
 * @param translate - Active localized message resolver.
 * @param sortControlled - Whether a controlled sort value was supplied.
 * @param hasSortHandler - Whether sort intentions can be observed.
 * @param selectionControlled - Whether controlled selected identifiers were supplied.
 * @param hasSelectionHandler - Whether selection intentions can be observed.
 */
function validateMiaixzDataTableControls(
  translate: MiaixzTranslator,
  sortControlled: boolean,
  hasSortHandler: boolean,
  selectionControlled: boolean,
  hasSelectionHandler: boolean,
): void {
  if ((sortControlled && !hasSortHandler) || (selectionControlled && !hasSelectionHandler)) {
    throw createMiaixzUiError(translate, {
      code: "UI_CONTROLLED_VALUE_INVALID",
      messageKey: "ui.error.controlled.valueInvalid",
    });
  }
}

/**
 * Produces the next sort intent in the frozen three-state cycle.
 *
 * @param columnId - Activated sortable column identifier.
 * @param current - Current controlled server-side sort state.
 * @returns Next sort intent or undefined when the cycle resets.
 */
function getNextMiaixzDataTableSort(
  columnId: string,
  current: DataTableSort | undefined,
): DataTableSort | undefined {
  if (current?.columnId !== columnId) return { columnId, direction: "ascending" };
  if (current.direction === "ascending") return { columnId, direction: "descending" };
  return undefined;
}

/**
 * Resolves the sort direction associated with one heading.
 *
 * @param columnId - Column identifier being rendered.
 * @param sort - Current controlled server-side sort state.
 * @returns Active ARIA sort direction when this is the sorted column.
 */
function getMiaixzDataTableColumnSort(
  columnId: string,
  sort: DataTableSort | undefined,
): DataTableSortDirection | undefined {
  return sort?.columnId === columnId ? sort.direction : undefined;
}

/**
 * Creates a logical alignment class shared by a heading and its body cells.
 *
 * @param align - Optional column alignment.
 * @returns Stable alignment class name.
 */
function getMiaixzDataTableAlignmentClass(align: DataTableColumn<unknown>["align"]): string {
  return `miaixz-data-table-align-${align ?? "start"}`;
}

/**
 * Renders the generic controlled DataTable implementation.
 *
 * @typeParam Row - Consumer-owned row shape.
 * @param properties - DataTable properties and inherited div attributes.
 * @param reference - Forwarded DataTable root reference.
 * @returns Semantic table, async states, and optional pagination slot.
 */
function DataTableImplementation<Row>(
  properties: DataTableProps<Row>,
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
    loading = false,
    error,
    emptyState,
    pagination,
    caption,
    className,
    ...props
  } = properties;
  const { t } = useMiaixzLocale();
  const selectionName = useId();
  validateMiaixzDataTableControls(
    t,
    sort !== undefined,
    onSortChange !== undefined,
    selectedRowIds !== undefined,
    onSelectedRowIdsChange !== undefined,
  );
  validateMiaixzDataTableColumns(t, columns);
  const resolvedRows = createMiaixzDataTableRows(t, rows, getRowId);
  const selectedIds = new Set(selectedRowIds ?? []);
  const currentIds = new Set(resolvedRows.map((row) => row.id));
  const selectedCurrentIds = resolvedRows.filter((row) => selectedIds.has(row.id));
  if (selectionMode === "single" && selectedCurrentIds.length > 1) {
    throw createMiaixzUiError(t, {
      code: "UI_CONTROLLED_VALUE_INVALID",
      messageKey: "ui.error.controlled.valueInvalid",
    });
  }

  const hasSelectionColumn = selectionMode !== "none";
  const columnCount = columns.length + (hasSelectionColumn ? 1 : 0);
  const allCurrentSelected = resolvedRows.length > 0 && selectedCurrentIds.length === rows.length;
  const someCurrentSelected = selectedCurrentIds.length > 0 && !allCurrentSelected;
  const state = getMiaixzDataTableState(loading, error, rows.length);

  /**
   * Reports one current-page row-selection intent without retaining internal state.
   *
   * @param rowId - Activated row identifier.
   * @param selected - Requested native control state.
   */
  function changeRowSelection(rowId: string, selected: boolean): void {
    if (selectionMode === "single") {
      onSelectedRowIdsChange?.(selected ? [rowId] : []);
      return;
    }
    const nextIds = new Set(selectedIds);
    if (selected) nextIds.add(rowId);
    else nextIds.delete(rowId);
    onSelectedRowIdsChange?.([...nextIds]);
  }

  /**
   * Reports a current-page select-all intent while preserving invisible identifiers.
   */
  function changePageSelection(): void {
    const nextIds = new Set(selectedIds);
    if (allCurrentSelected) {
      for (const id of currentIds) nextIds.delete(id);
    } else {
      for (const id of currentIds) nextIds.add(id);
    }
    onSelectedRowIdsChange?.([...nextIds]);
  }

  return (
    <div
      {...props}
      ref={reference}
      aria-busy={loading || undefined}
      data-state={state}
      className={classNames("miaixz-data-table", className)}
    >
      <LoadingOverlay active={loading} label={t("ui.loading")}>
        <TableContainer
          aria-label={caption}
          role="region"
          tabIndex={0}
          className="miaixz-data-table-container"
        >
          <Table>
            <TableCaption>{caption}</TableCaption>
            <TableHeader>
              <TableRow>
                {selectionMode === "multiple" && (
                  <TableHead className="miaixz-data-table-selection-cell" scope="col">
                    <Checkbox
                      aria-label={t("ui.table.selectPage")}
                      checked={allCurrentSelected}
                      indeterminate={someCurrentSelected}
                      disabled={resolvedRows.length === 0 || onSelectedRowIdsChange === undefined}
                      onChange={changePageSelection}
                      className="miaixz-data-table-selection-control"
                    />
                  </TableHead>
                )}
                {selectionMode === "single" && (
                  <TableHead className="miaixz-data-table-selection-cell" scope="col" />
                )}
                {columns.map((column) => {
                  const direction = getMiaixzDataTableColumnSort(column.id, sort);
                  return (
                    <TableHead
                      key={column.id}
                      scope="col"
                      aria-sort={direction}
                      className={classNames(
                        "miaixz-data-table-heading",
                        getMiaixzDataTableAlignmentClass(column.align),
                      )}
                    >
                      {column.sortable ? (
                        <button
                          type="button"
                          disabled={onSortChange === undefined}
                          data-state={direction ?? "none"}
                          className="miaixz-data-table-sort"
                          onClick={() =>
                            onSortChange?.(getNextMiaixzDataTableSort(column.id, sort))
                          }
                        >
                          <span className="miaixz-data-table-heading-content">{column.header}</span>
                          <Icon
                            name="ChevronDown"
                            size="inline"
                            className="miaixz-data-table-sort-icon"
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
                  <TableCell colSpan={columnCount} className="miaixz-data-table-state-cell">
                    <div className="miaixz-data-table-error" role="alert">
                      {error}
                    </div>
                  </TableCell>
                </TableRow>
              ) : resolvedRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columnCount} className="miaixz-data-table-state-cell">
                    <div className="miaixz-data-table-empty">{emptyState}</div>
                  </TableCell>
                </TableRow>
              ) : (
                resolvedRows.map((row) => {
                  const selected = selectedIds.has(row.id) && hasSelectionColumn;
                  return (
                    <TableRow key={row.id} selected={selected}>
                      {hasSelectionColumn && (
                        <TableCell className="miaixz-data-table-selection-cell">
                          {selectionMode === "multiple" ? (
                            <Checkbox
                              aria-label={t("ui.table.selectRow")}
                              checked={selected}
                              disabled={onSelectedRowIdsChange === undefined}
                              onChange={(event) =>
                                changeRowSelection(row.id, event.currentTarget.checked)
                              }
                              className="miaixz-data-table-selection-control"
                            />
                          ) : (
                            <Radio
                              aria-label={t("ui.table.selectRow")}
                              name={selectionName}
                              checked={selected}
                              disabled={onSelectedRowIdsChange === undefined}
                              onChange={(event) =>
                                changeRowSelection(row.id, event.currentTarget.checked)
                              }
                              className="miaixz-data-table-selection-control"
                            />
                          )}
                        </TableCell>
                      )}
                      {columns.map((column) => (
                        <TableCell
                          key={column.id}
                          className={classNames(
                            "miaixz-data-table-cell",
                            getMiaixzDataTableAlignmentClass(column.align),
                          )}
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
        </TableContainer>
      </LoadingOverlay>
      {pagination !== undefined && <div className="miaixz-data-table-pagination">{pagination}</div>}
    </div>
  );
}

/**
 * Renders a generic controlled server-side data table.
 *
 * @public
 */
export const DataTable = forwardRef(DataTableImplementation) as <Row>(
  props: DataTableProps<Row> & RefAttributes<HTMLDivElement>,
) => ReactElement;

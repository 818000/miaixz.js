import type { HTMLAttributes, ReactNode } from "react";

/**
 * Defines the server-owned sort directions exposed by DataTable.
 *
 * @public
 */
export type DataTableSortDirection = "ascending" | "descending";

/**
 * Describes the active server-side sort intent.
 *
 * @public
 */
export interface DataTableSort {
  /**
   * Identifies the column requested by the consumer.
   */
  readonly columnId: string;

  /**
   * Identifies the requested server-side sort direction.
   */
  readonly direction: DataTableSortDirection;
}

/**
 * Defines one generic DataTable column without coupling it to business fields.
 *
 * @typeParam Row - Consumer-owned row shape.
 * @public
 */
export interface DataTableColumn<Row> {
  /**
   * Supplies the unique column identifier.
   */
  readonly id: string;

  /**
   * Renders the semantic column heading.
   */
  readonly header: ReactNode;

  /**
   * Renders a cell for one immutable row value.
   */
  readonly cell: (row: Readonly<Row>) => ReactNode;

  /**
   * Enables server-side sort intent for this column.
   *
   * @defaultValue `false`
   */
  readonly sortable?: boolean;

  /**
   * Aligns the heading and cells using logical text directions.
   *
   * @defaultValue `"start"`
   */
  readonly align?: "start" | "center" | "end";
}

/**
 * Defines the properties owned by the generic Miaixz DataTable contract.
 *
 * @typeParam Row - Consumer-owned row shape.
 * @public
 */
export interface MiaixzDataTableOwnProps<Row> {
  /**
   * Supplies the current server-provided page of rows.
   */
  rows: readonly Row[];

  /**
   * Supplies immutable generic column definitions.
   */
  columns: readonly DataTableColumn<Row>[];

  /**
   * Resolves a stable unique identifier for one row.
   */
  getRowId: (row: Readonly<Row>) => string;

  /**
   * Supplies the controlled server-side sort state.
   */
  sort?: DataTableSort;

  /**
   * Receives the next server-side sort intent.
   */
  onSortChange?: (sort: DataTableSort | undefined) => void;

  /**
   * Supplies the controlled selected-row identifiers.
   */
  selectedRowIds?: readonly string[];

  /**
   * Receives selected identifiers after a current-page selection intent.
   */
  onSelectedRowIdsChange?: (ids: readonly string[]) => void;

  /**
   * Selects the row-selection behavior.
   *
   * @defaultValue `"none"`
   */
  selectionMode?: "none" | "single" | "multiple";

  /**
   * Indicates that the consumer is loading server data.
   *
   * @defaultValue `false`
   */
  loading?: boolean;

  /**
   * Supplies project-owned error-state content.
   */
  error?: ReactNode;

  /**
   * Supplies project-owned empty-state content.
   */
  emptyState?: ReactNode;

  /**
   * Supplies a project-owned server pagination control.
   */
  pagination?: ReactNode;

  /**
   * Supplies the required accessible table caption.
   */
  caption: string;
}

/**
 * Configures a generic controlled server-side data table.
 *
 * @typeParam Row - Consumer-owned row shape.
 * @public
 */
export interface DataTableProps<Row>
  extends
    Omit<HTMLAttributes<HTMLDivElement>, keyof MiaixzDataTableOwnProps<Row>>,
    MiaixzDataTableOwnProps<Row> {}

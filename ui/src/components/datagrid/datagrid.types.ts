import type { HTMLAttributes, ReactNode } from "react";

/**
 * Defines the server-owned sort directions exposed by Datagrid.
 *
 * @public
 */
export type DatagridSortDirection = "ascending" | "descending";

/**
 * Describes the active server-side sort intent.
 *
 * @public
 */
export interface DatagridSort {
  /**
   * Identifies the column requested by the consumer.
   */
  readonly columnId: string;

  /**
   * Identifies the requested server-side sort direction.
   */
  readonly direction: DatagridSortDirection;
}

/**
 * Defines one generic Datagrid column without coupling it to business fields.
 *
 * @typeParam Row - Consumer-owned row shape.
 * @public
 */
export interface DatagridColumn<Row> {
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
 * Defines the properties owned by the generic Miaixz Datagrid contract.
 *
 * @typeParam Row - Consumer-owned row shape.
 * @public
 */
export interface MiaixzDatagridOwnProps<Row> {
  /**
   * Supplies the current server-provided page of rows.
   */
  rows: readonly Row[];

  /**
   * Supplies immutable generic column definitions.
   */
  columns: readonly DatagridColumn<Row>[];

  /**
   * Resolves a stable unique identifier for one row.
   */
  getRowId: (row: Readonly<Row>) => string;

  /**
   * Supplies the controlled server-side sort state.
   */
  sort?: DatagridSort;

  /**
   * Receives the next server-side sort intent.
   */
  onSortChange?: (sort: DatagridSort | undefined) => void;

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
   * Supplies project-owned empty content.
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
export interface DatagridProps<Row>
  extends
    Omit<HTMLAttributes<HTMLDivElement>, keyof MiaixzDatagridOwnProps<Row>>,
    MiaixzDatagridOwnProps<Row> {}

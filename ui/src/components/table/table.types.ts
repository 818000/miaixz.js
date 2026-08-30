import type {
  HTMLAttributes,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from "react";

/**
 * Configures the responsive table framing container.
 *
 * @public
 */
export interface TableContainerProps extends HTMLAttributes<HTMLDivElement> {}

/**
 * Configures a semantic data table.
 *
 * @public
 */
export interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
  /**
   * Keeps header rows visible within the table scroll container.
   *
   * @defaultValue `false`
   */
  stickyHeader?: boolean;
}

/**
 * Configures the table header section.
 *
 * @public
 */
export interface TableHeaderProps extends HTMLAttributes<HTMLTableSectionElement> {}

/**
 * Configures the table body section.
 *
 * @public
 */
export interface TableBodyProps extends HTMLAttributes<HTMLTableSectionElement> {}

/**
 * Configures the table footer section.
 *
 * @public
 */
export interface TableFooterProps extends HTMLAttributes<HTMLTableSectionElement> {}

/**
 * Configures one semantic table row.
 *
 * @public
 */
export interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  /**
   * Applies the selected-row treatment.
   *
   * @defaultValue `false`
   */
  selected?: boolean;
}

/**
 * Configures a semantic table heading cell.
 *
 * @public
 */
export interface TableHeadProps extends ThHTMLAttributes<HTMLTableCellElement> {
  /**
   * Aligns and formats the heading as numeric content.
   *
   * @defaultValue `false`
   */
  numeric?: boolean;
  /**
   * Aligns the heading with an action column.
   *
   * @defaultValue `false`
   */
  actions?: boolean;
}

/**
 * Configures a standard table data cell.
 *
 * @public
 */
export interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  /**
   * Aligns and formats the cell as numeric content.
   *
   * @defaultValue `false`
   */
  numeric?: boolean;
  /**
   * Aligns the cell as an action column.
   *
   * @defaultValue `false`
   */
  actions?: boolean;
}

/**
 * Configures an accessible table caption.
 *
 * @public
 */
export interface TableCaptionProps extends HTMLAttributes<HTMLTableCaptionElement> {}

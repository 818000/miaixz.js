import { forwardRef } from "react";

import { classNames } from "../../internal/class-names.js";
import type {
  TableBodyProps,
  TableCaptionProps,
  TableCellProps,
  TableContainerProps,
  TableFooterProps,
  TableHeaderProps,
  TableHeadProps,
  TableProps,
  TableRowProps,
} from "./table.types.js";

/**
 * Provides responsive overflow and framing for a data table.
 *
 * @public
 */
export const TableContainer = forwardRef<HTMLDivElement, TableContainerProps>(
  function TableContainer({ className, ...props }, ref) {
    return <div {...props} ref={ref} className={classNames("miaixz-table-container", className)} />;
  },
);

/**
 * Renders a semantic table with Miaixz density-aware styling.
 *
 * @public
 */
export const Table = forwardRef<HTMLTableElement, TableProps>(function Table(
  { stickyHeader = false, className, ...props },
  ref,
) {
  return (
    <table
      {...props}
      ref={ref}
      className={classNames("miaixz-table", stickyHeader && "miaixz-table-sticky", className)}
    />
  );
});

/**
 * Renders a table header section.
 *
 * @public
 */
export const TableHeader = forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  function TableHeader({ className, ...props }, ref) {
    return <thead {...props} ref={ref} className={classNames("miaixz-table-head", className)} />;
  },
);

/**
 * Renders a table body section.
 *
 * @public
 */
export const TableBody = forwardRef<HTMLTableSectionElement, TableBodyProps>(function TableBody(
  { className, ...props },
  ref,
) {
  return <tbody {...props} ref={ref} className={classNames("miaixz-table-body", className)} />;
});

/**
 * Renders a table footer section.
 *
 * @public
 */
export const TableFooter = forwardRef<HTMLTableSectionElement, TableFooterProps>(
  function TableFooter({ className, ...props }, ref) {
    return <tfoot {...props} ref={ref} className={classNames("miaixz-table-foot", className)} />;
  },
);

/**
 * Renders a table row with optional selection state.
 *
 * @public
 */
export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(function TableRow(
  { selected = false, className, ...props },
  ref,
) {
  return (
    <tr
      {...props}
      ref={ref}
      data-selected={selected || undefined}
      className={classNames("miaixz-table-row", className)}
    />
  );
});

/**
 * Renders a column or row heading cell.
 *
 * @public
 */
export const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(function TableHead(
  { numeric = false, actions = false, className, ...props },
  ref,
) {
  return (
    <th
      {...props}
      ref={ref}
      className={classNames(
        "miaixz-table-header",
        numeric && "miaixz-table-numeric",
        actions && "miaixz-table-actions",
        className,
      )}
    />
  );
});

/**
 * Renders a standard table data cell.
 *
 * @public
 */
export const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(function TableCell(
  { numeric = false, actions = false, className, ...props },
  ref,
) {
  return (
    <td
      {...props}
      ref={ref}
      className={classNames(
        "miaixz-table-cell",
        numeric && "miaixz-table-numeric",
        actions && "miaixz-table-actions",
        className,
      )}
    />
  );
});

/**
 * Renders an accessible table caption.
 *
 * @public
 */
export const TableCaption = forwardRef<HTMLTableCaptionElement, TableCaptionProps>(
  function TableCaption({ className, ...props }, ref) {
    return (
      <caption {...props} ref={ref} className={classNames("miaixz-table-caption", className)} />
    );
  },
);

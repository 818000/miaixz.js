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

import { forwardRef } from "react";

import { classNames } from "../../shared/class-names.js";
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
  function TableContainer({ className, frame = "default", surface = "default", ...props }, ref) {
    return (
      <div
        {...props}
        ref={ref}
        className={classNames(
          "miaixz-table-container",
          frame === "plain" && "miaixz-table-container-plain",
          surface === "transparent" && "miaixz-table-container-transparent",
          className,
        )}
      />
    );
  },
);

/**
 * Renders a semantic table with Miaixz density-aware styling.
 *
 * @public
 */
export const Table = forwardRef<HTMLTableElement, TableProps>(function Table(
  { stickyHeader = false, variant = "default", className, ...props },
  ref,
) {
  return (
    <table
      {...props}
      ref={ref}
      className={classNames(
        variant === "dashed"
          ? "miaixz-table-dashed"
          : variant === "compact"
            ? "miaixz-table-compact"
            : "miaixz-table",
        stickyHeader && "miaixz-table-sticky",
        className,
      )}
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
  { numeric = false, actions = false, empty = false, className, ...props },
  ref,
) {
  return (
    <td
      {...props}
      ref={ref}
      data-empty={empty || undefined}
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

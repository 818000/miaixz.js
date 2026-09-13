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
import { mergeMiaixzSlotProps } from "../../shared/slots.js";
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
import { withMiaixzThemeComponent } from "../../theme/themed-component.js";

/**
 * Provides responsive overflow and framing for a data table.
 *
 * @public
 */
export const TableContainer = withMiaixzThemeComponent(
  "TableContainer",
  forwardRef<HTMLDivElement, TableContainerProps>(function TableContainer(
    { className, frame = "default", surface = "default", ...props },
    ref,
  ) {
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
  }),
);

/**
 * Renders a semantic table with Miaixz density-aware styling.
 *
 * @public
 */
export const Table = withMiaixzThemeComponent(
  "Table",
  forwardRef<HTMLTableElement, TableProps>(function Table(
    { stickyHeader = false, density = "standard", dividerStyle = "solid", slotProps, ...props },
    ref,
  ) {
    const ownerState = { stickyHeader, density, dividerStyle };
    return (
      <table
        {...mergeMiaixzSlotProps({
          ownerState,
          defaultProps: { className: "miaixz-table" },
          componentProps: props,
          slotProps: slotProps?.root,
          forwardedRef: ref,
          internalProps: {
            "data-density": density,
            "data-divider-style": dividerStyle,
            ...(stickyHeader ? { "data-sticky-header": true } : {}),
          },
          ownedProps: ["data-density", "data-divider-style", "data-sticky-header"],
        })}
      />
    );
  }),
);

/**
 * Renders a table header section.
 *
 * @public
 */
export const TableHeader = withMiaixzThemeComponent(
  "TableHeader",
  forwardRef<HTMLTableSectionElement, TableHeaderProps>(function TableHeader(
    { slotProps, ...props },
    ref,
  ) {
    return (
      <thead
        {...mergeMiaixzSlotProps({
          ownerState: {},
          defaultProps: { className: "miaixz-table-head" },
          componentProps: props,
          slotProps: slotProps?.root,
          forwardedRef: ref,
        })}
      />
    );
  }),
);

/**
 * Renders a table body section.
 *
 * @public
 */
export const TableBody = withMiaixzThemeComponent(
  "TableBody",
  forwardRef<HTMLTableSectionElement, TableBodyProps>(function TableBody(
    { className, ...props },
    ref,
  ) {
    return <tbody {...props} ref={ref} className={classNames("miaixz-table-body", className)} />;
  }),
);

/**
 * Renders a table footer section.
 *
 * @public
 */
export const TableFooter = withMiaixzThemeComponent(
  "TableFooter",
  forwardRef<HTMLTableSectionElement, TableFooterProps>(function TableFooter(
    { className, ...props },
    ref,
  ) {
    return <tfoot {...props} ref={ref} className={classNames("miaixz-table-foot", className)} />;
  }),
);

/**
 * Renders a table row with optional selection state.
 *
 * @public
 */
export const TableRow = withMiaixzThemeComponent(
  "TableRow",
  forwardRef<HTMLTableRowElement, TableRowProps>(function TableRow(
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
  }),
);

/**
 * Renders a column or row heading cell.
 *
 * @public
 */
export const TableHead = withMiaixzThemeComponent(
  "TableHead",
  forwardRef<HTMLTableCellElement, TableHeadProps>(function TableHead(
    { numeric = false, actions = false, scope = "col", slotProps, ...props },
    ref,
  ) {
    const ownerState = { numeric, actions };
    return (
      <th
        {...mergeMiaixzSlotProps({
          ownerState,
          defaultProps: {
            className: classNames(
              "miaixz-table-header",
              numeric && "miaixz-table-numeric",
              actions && "miaixz-table-actions",
            ),
          },
          componentProps: props,
          slotProps: slotProps?.root,
          forwardedRef: ref,
          internalProps: { scope },
          ownedProps: ["scope"],
        })}
      />
    );
  }),
);

/**
 * Renders a standard table data cell.
 *
 * @public
 */
export const TableCell = withMiaixzThemeComponent(
  "TableCell",
  forwardRef<HTMLTableCellElement, TableCellProps>(function TableCell(
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
  }),
);

/**
 * Renders an accessible table caption.
 *
 * @public
 */
export const TableCaption = withMiaixzThemeComponent(
  "TableCaption",
  forwardRef<HTMLTableCaptionElement, TableCaptionProps>(function TableCaption(
    { className, ...props },
    ref,
  ) {
    return (
      <caption {...props} ref={ref} className={classNames("miaixz-table-caption", className)} />
    );
  }),
);

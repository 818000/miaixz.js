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

/* eslint-disable jsdoc/require-jsdoc -- Closed server-table models are self-describing.
 */
import type { HTMLAttributes, ReactNode } from "react";

export type DatagridSortDirection = "ascending" | "descending";
export interface DatagridSort {
  readonly columnId: string;
  readonly direction: DatagridSortDirection;
}
export interface DatagridColumn<Row> {
  readonly id: string;
  readonly header: ReactNode;
  readonly cell: (row: Readonly<Row>) => ReactNode;
  readonly sortable?: boolean;
  readonly align?: "start" | "center" | "end";
  readonly widthPercent?: number;
}

export type DatagridSelectionProps =
  | {
      readonly selectionMode?: "none";
      readonly selectedRowIds?: never;
      readonly onSelectedRowIdsChange?: never;
      readonly selectionWidthPercent?: never;
    }
  | {
      readonly selectionMode: "single";
      readonly selectedRowIds: readonly [] | readonly [string];
      readonly onSelectedRowIdsChange?: (ids: readonly [] | readonly [string]) => void;
      readonly selectionWidthPercent?: number;
    }
  | {
      readonly selectionMode: "multiple";
      readonly selectedRowIds: readonly string[];
      readonly onSelectedRowIdsChange?: (ids: readonly string[]) => void;
      readonly selectionWidthPercent?: number;
    };

export interface MiaixzDatagridBaseProps<Row> {
  readonly rows: readonly Row[];
  readonly columns: readonly DatagridColumn<Row>[];
  readonly getRowId: (row: Readonly<Row>) => string;
  readonly sort?: DatagridSort;
  readonly onSortChange?: (sort: DatagridSort | undefined) => void;
  readonly loading?: boolean;
  readonly error?: ReactNode;
  readonly emptyState?: ReactNode;
  readonly pagination?: ReactNode;
  readonly caption: string;
  readonly surface?: "plain" | "inset";
  readonly density?: "compact" | "standard" | "comfortable";
  readonly layout?: "auto" | "fixed";
  readonly bodyLayout?: "content" | "fill";
  readonly captionVisibility?: "visible" | "hidden";
}

export type MiaixzDatagridOwnProps<Row> = MiaixzDatagridBaseProps<Row> & DatagridSelectionProps;
/*
 * Configures a semantic server-owned data table, not an ARIA grid. @public
 */
export type DatagridProps<Row> = MiaixzDatagridOwnProps<Row> &
  Omit<HTMLAttributes<HTMLDivElement>, keyof MiaixzDatagridOwnProps<Row> | "children">;

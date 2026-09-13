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

/* eslint-disable jsdoc/require-jsdoc -- Closed columns models and slots are self-describing.
 */
import type {
  HTMLAttributes,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from "react";

import type { MiaixzSlotProps } from "../../shared/slots.js";
import type { MiaixzVisualTone } from "../shared.types.js";

export interface ColumnsSeries {
  readonly id: string;
  readonly label: string;
  readonly values: readonly number[];
}
export interface ColumnsOwnerState {
  readonly orientation: "vertical" | "horizontal";
  readonly layout: "grouped" | "stacked";
  readonly density: "compact" | "standard" | "comfortable";
  readonly tone: MiaixzVisualTone;
  readonly state: "empty" | "ready";
}
export interface ColumnsRootAttributes extends HTMLAttributes<HTMLDivElement> {
  readonly "data-orientation"?: ColumnsOwnerState["orientation"];
  readonly "data-layout"?: ColumnsOwnerState["layout"];
  readonly "data-density"?: ColumnsOwnerState["density"];
  readonly "data-tone"?: MiaixzVisualTone;
  readonly "data-state"?: ColumnsOwnerState["state"];
}
export interface ColumnsBarAttributes extends HTMLAttributes<HTMLSpanElement> {
  readonly "data-series"?: number;
}
export interface ColumnsSlotProps {
  readonly root?: MiaixzSlotProps<ColumnsOwnerState, ColumnsRootAttributes>;
  readonly legend?: MiaixzSlotProps<ColumnsOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly legendItem?: MiaixzSlotProps<ColumnsOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly plot?: MiaixzSlotProps<ColumnsOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly category?: MiaixzSlotProps<ColumnsOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly bar?: MiaixzSlotProps<ColumnsOwnerState, ColumnsBarAttributes>;
  readonly categoryLabel?: MiaixzSlotProps<ColumnsOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly table?: MiaixzSlotProps<ColumnsOwnerState, TableHTMLAttributes<HTMLTableElement>>;
  readonly caption?: MiaixzSlotProps<ColumnsOwnerState, HTMLAttributes<HTMLTableCaptionElement>>;
  readonly tableHeader?: MiaixzSlotProps<ColumnsOwnerState, ThHTMLAttributes<HTMLTableCellElement>>;
  readonly tableCell?: MiaixzSlotProps<ColumnsOwnerState, TdHTMLAttributes<HTMLTableCellElement>>;
}
type ColumnsAccessibility =
  | { readonly accessibleTable?: true; readonly "aria-describedby"?: string }
  | { readonly accessibleTable: false; readonly "aria-describedby": string };
interface ColumnsBaseProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "aria-label" | "aria-describedby" | "children" | "color"
> {
  readonly labels: readonly string[];
  readonly series: readonly ColumnsSeries[];
  readonly maximum?: number;
  readonly showLegend?: boolean;
  readonly tone: MiaixzVisualTone;
  readonly "aria-label": string;
  readonly orientation?: "vertical" | "horizontal";
  readonly layout?: "grouped" | "stacked";
  readonly density?: "compact" | "standard" | "comfortable";
  readonly categoryFormatter?: (label: string, index: number) => string;
  readonly seriesFormatter?: (series: ColumnsSeries) => string;
  readonly valueFormatter?: (value: number, series: ColumnsSeries, categoryIndex: number) => string;
  readonly slotProps?: ColumnsSlotProps;
}
export type ColumnsProps = ColumnsBaseProps & ColumnsAccessibility;

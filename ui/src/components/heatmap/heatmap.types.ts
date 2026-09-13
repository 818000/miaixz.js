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

/* eslint-disable jsdoc/require-jsdoc -- Closed heatmap slots are self-describing.
 */
import type {
  HTMLAttributes,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from "react";

import type { MiaixzSlotProps } from "../../shared/slots.js";
import type { MiaixzVisualTone } from "../shared.types.js";

export type HeatmapLevel = 0 | 1 | 2 | 3 | 4 | 5;
export type HeatmapLevelLabels = readonly [string, string, string, string, string, string];
export interface HeatmapCellContext {
  readonly rowLabel: string;
  readonly columnLabel: string;
  readonly level: HeatmapLevel;
  readonly rowIndex: number;
  readonly columnIndex: number;
}
export interface HeatmapOwnerState {
  readonly density: "compact" | "standard" | "comfortable";
  readonly tone: MiaixzVisualTone;
  readonly state: "empty" | "ready";
}
export interface HeatmapRootAttributes extends HTMLAttributes<HTMLDivElement> {
  readonly "data-tone"?: MiaixzVisualTone;
  readonly "data-density"?: HeatmapOwnerState["density"];
  readonly "data-state"?: HeatmapOwnerState["state"];
}
export interface HeatmapCellAttributes extends TdHTMLAttributes<HTMLTableCellElement> {
  readonly "data-level"?: HeatmapLevel;
}
export interface HeatmapSlotProps {
  readonly root?: MiaixzSlotProps<HeatmapOwnerState, HeatmapRootAttributes>;
  readonly viewport?: MiaixzSlotProps<HeatmapOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly table?: MiaixzSlotProps<HeatmapOwnerState, TableHTMLAttributes<HTMLTableElement>>;
  readonly caption?: MiaixzSlotProps<HeatmapOwnerState, HTMLAttributes<HTMLTableCaptionElement>>;
  readonly columnHeader?: MiaixzSlotProps<
    HeatmapOwnerState,
    ThHTMLAttributes<HTMLTableCellElement>
  >;
  readonly rowHeader?: MiaixzSlotProps<HeatmapOwnerState, ThHTMLAttributes<HTMLTableCellElement>>;
  readonly cell?: MiaixzSlotProps<HeatmapOwnerState, HeatmapCellAttributes>;
  readonly cellText?: MiaixzSlotProps<HeatmapOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly legend?: MiaixzSlotProps<HeatmapOwnerState, HTMLAttributes<HTMLSpanElement>>;
}
export interface HeatmapProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "aria-label" | "children" | "color"
> {
  readonly density?: "compact" | "standard" | "comfortable";
  readonly rowLabels: readonly string[];
  readonly columnLabels: readonly string[];
  readonly levels: readonly (readonly HeatmapLevel[])[];
  readonly levelLabels: HeatmapLevelLabels;
  readonly tone: MiaixzVisualTone;
  readonly "aria-label": string;
  readonly getCellLabel?: (context: HeatmapCellContext) => string;
  readonly slotProps?: HeatmapSlotProps;
}
export interface HeatmapLegendOwnerState {
  readonly tone: MiaixzVisualTone;
}
export interface HeatmapLegendRootAttributes extends HTMLAttributes<HTMLSpanElement> {
  readonly "data-tone"?: MiaixzVisualTone;
}
export interface HeatmapLegendSwatchAttributes extends HTMLAttributes<HTMLElement> {
  readonly "data-level"?: number;
}
export interface HeatmapLegendSlotProps {
  readonly root?: MiaixzSlotProps<HeatmapLegendOwnerState, HeatmapLegendRootAttributes>;
  readonly lowLabel?: MiaixzSlotProps<HeatmapLegendOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly scale?: MiaixzSlotProps<HeatmapLegendOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly swatch?: MiaixzSlotProps<HeatmapLegendOwnerState, HeatmapLegendSwatchAttributes>;
  readonly highLabel?: MiaixzSlotProps<HeatmapLegendOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly description?: MiaixzSlotProps<HeatmapLegendOwnerState, HTMLAttributes<HTMLOListElement>>;
}
export interface HeatmapLegendProps extends Omit<
  HTMLAttributes<HTMLSpanElement>,
  "children" | "color"
> {
  readonly tone: MiaixzVisualTone;
  readonly levelLabels: HeatmapLevelLabels;
  readonly slotProps?: HeatmapLegendSlotProps;
}

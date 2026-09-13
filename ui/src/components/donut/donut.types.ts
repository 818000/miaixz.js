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

/* eslint-disable jsdoc/require-jsdoc -- Closed donut slots are self-describing.
 */
import type {
  HTMLAttributes,
  ReactNode,
  SVGAttributes,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from "react";

import type { MiaixzSlotProps } from "../../shared/slots.js";
import type { MiaixzVisualTone } from "../shared.types.js";

export interface DonutSegment {
  readonly id: string;
  readonly label: string;
  readonly value: number;
  readonly tone: MiaixzVisualTone;
}
export interface DonutOwnerState {
  readonly size: "small" | "medium" | "large";
  readonly variant: "ring" | "distribution";
  readonly legend: "hidden" | "inline";
  readonly state: "empty" | "ready";
  readonly animate: boolean;
}
export interface DonutRootAttributes extends HTMLAttributes<HTMLDivElement> {
  readonly "data-size"?: DonutOwnerState["size"];
  readonly "data-variant"?: DonutOwnerState["variant"];
  readonly "data-state"?: DonutOwnerState["state"];
  readonly "data-animate"?: boolean;
}
export interface DonutSlotProps {
  readonly root?: MiaixzSlotProps<DonutOwnerState, DonutRootAttributes>;
  readonly visual?: MiaixzSlotProps<DonutOwnerState, HTMLAttributes<HTMLSpanElement>>;
  readonly segment?: MiaixzSlotProps<DonutOwnerState, SVGAttributes<SVGCircleElement>>;
  readonly legend?: MiaixzSlotProps<DonutOwnerState, HTMLAttributes<HTMLUListElement>>;
  readonly legendItem?: MiaixzSlotProps<DonutOwnerState, HTMLAttributes<HTMLLIElement>>;
  readonly description?: MiaixzSlotProps<DonutOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly table?: MiaixzSlotProps<DonutOwnerState, TableHTMLAttributes<HTMLTableElement>>;
  readonly caption?: MiaixzSlotProps<DonutOwnerState, HTMLAttributes<HTMLTableCaptionElement>>;
  readonly tableHeader?: MiaixzSlotProps<DonutOwnerState, ThHTMLAttributes<HTMLTableCellElement>>;
  readonly tableCell?: MiaixzSlotProps<DonutOwnerState, TdHTMLAttributes<HTMLTableCellElement>>;
}
export interface DonutProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "aria-label" | "children" | "color"
> {
  readonly "aria-label": string;
  readonly segments: readonly DonutSegment[];
  readonly size?: "small" | "medium" | "large";
  readonly variant?: "ring" | "distribution";
  readonly legend?: "hidden" | "inline";
  readonly center?: ReactNode;
  readonly description?: ReactNode;
  readonly animate?: boolean;
  readonly valueFormatter?: (value: number, segment: DonutSegment) => string;
  readonly percentageFormatter?: (ratio: number, segment: DonutSegment) => string;
  readonly slotProps?: DonutSlotProps;
}

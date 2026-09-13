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

/* eslint-disable jsdoc/require-jsdoc -- Graph data and closed slots are self-describing.
 */
import type {
  HTMLAttributes,
  ReactNode,
  RefAttributes,
  SVGAttributes,
  TableHTMLAttributes,
} from "react";
import type { MiaixzSlotProps } from "../../../shared/slots.js";
import type { MiaixzVisualTone } from "../../shared.types.js";

export interface GraphNode {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly x: number;
  readonly y: number;
  readonly tone: MiaixzVisualTone;
}
export interface GraphEdge {
  readonly id: string;
  readonly sourceId: string;
  readonly targetId: string;
  readonly label?: string;
  readonly directed?: boolean;
}
export type GraphSlot = "root" | "toolbar" | "viewport" | "canvas" | "edge" | "node" | "table";
export interface GraphOwnerState {
  readonly disabled: boolean;
  readonly zoom: number;
  readonly selectedNodeId: string | undefined;
  readonly activeNodeId: string | undefined;
}
export type GraphNodeAttributes = SVGAttributes<SVGGElement> & {
  readonly "data-tone"?: MiaixzVisualTone;
};
export interface GraphSlotProps {
  readonly root?: MiaixzSlotProps<
    GraphOwnerState,
    HTMLAttributes<HTMLElement> & RefAttributes<HTMLElement>
  >;
  readonly toolbar?: MiaixzSlotProps<GraphOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly viewport?: MiaixzSlotProps<GraphOwnerState, HTMLAttributes<HTMLDivElement>>;
  readonly canvas?: MiaixzSlotProps<GraphOwnerState, SVGAttributes<SVGSVGElement>>;
  readonly edge?: MiaixzSlotProps<GraphOwnerState, SVGAttributes<SVGGElement>>;
  readonly node?: MiaixzSlotProps<GraphOwnerState, GraphNodeAttributes>;
  readonly table?: MiaixzSlotProps<GraphOwnerState, TableHTMLAttributes<HTMLTableElement>>;
}
export interface GraphProps extends Omit<
  HTMLAttributes<HTMLElement>,
  "aria-disabled" | "aria-label" | "children"
> {
  readonly "aria-label": string;
  readonly nodes: readonly GraphNode[];
  readonly edges: readonly GraphEdge[];
  readonly selectedNodeId?: string;
  readonly onSelectedNodeIdChange?: (id: string) => void;
  readonly disabled?: boolean;
  readonly tableCaption: ReactNode;
  readonly nodeFormatter?: (node: GraphNode) => string;
  readonly edgeFormatter?: (
    edge: GraphEdge,
    sourceNode: GraphNode,
    targetNode: GraphNode,
  ) => string;
  readonly slotProps?: GraphSlotProps;
}
/* eslint-enable jsdoc/require-jsdoc
 */

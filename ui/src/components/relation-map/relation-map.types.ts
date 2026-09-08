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

import type { MiaixzVisualTone } from "../shared.types.js";

/**
 * Defines one positioned node in a RelationMap. @public
 */
export interface MiaixzRelationNode {
  /**
   * Uniquely identifies the node.
   */
  readonly id: string;
  /**
   * Supplies the visible node label.
   */
  readonly label: string;
  /**
   * Supplies accessible supporting detail.
   */
  readonly description?: string;
  /**
   * Positions the node horizontally from 0 to 100.
   */
  readonly x: number;
  /**
   * Positions the node vertically from 0 to 100.
   */
  readonly y: number;
  /**
   * Selects the node's semantic or categorical tone.
   */
  readonly tone: MiaixzVisualTone;
}

/**
 * Defines one connection between RelationMap nodes. @public
 */
export interface MiaixzRelationEdge {
  /**
   * Uniquely identifies the edge.
   */
  readonly id: string;
  /**
   * Identifies the source node.
   */
  readonly sourceId: string;
  /**
   * Identifies the target node.
   */
  readonly targetId: string;
  /**
   * Supplies optional relationship text.
   */
  readonly label?: string;
  /**
   * Displays the relationship as directional.
   */
  readonly directed?: boolean;
}

/**
 * Configures an accessible, selectable relationship map. @public
 */
export interface RelationMapProps {
  /**
   * Provides the map's accessible name.
   */
  readonly "aria-label": string;
  /**
   * Supplies positioned relationship nodes.
   */
  readonly nodes: readonly MiaixzRelationNode[];
  /**
   * Supplies validated relationships between nodes.
   */
  readonly edges: readonly MiaixzRelationEdge[];
  /**
   * Controls the selected node.
   */
  readonly selectedNodeId?: string;
  /**
   * Runs when a node is selected.
   */
  readonly onSelectedNodeIdChange?: (id: string) => void;
  /**
   * Prevents node selection and zoom interaction.
   */
  readonly disabled?: boolean;
  /**
   * Provides the accessible relationship table caption.
   */
  readonly tableCaption: string;
}

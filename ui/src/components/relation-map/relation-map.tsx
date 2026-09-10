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

import { useId, useState, type KeyboardEvent } from "react";

import { Button } from "../button/index.js";
import { Icon } from "../icon/index.js";
import type {
  MiaixzRelationEdge,
  MiaixzRelationNode,
  RelationMapProps,
} from "./relation-map.types.js";

const minimumZoom = 80;
const maximumZoom = 140;
const zoomStep = 10;

/**
 * Validates identifiers, positions, and relationship endpoints.
 *
 * @param nodes - Positioned nodes.
 * @param edges - Node relationships.
 */
function validateRelations(
  nodes: readonly MiaixzRelationNode[],
  edges: readonly MiaixzRelationEdge[],
) {
  const nodeIds = new Set<string>();
  const edgeIds = new Set<string>();
  for (const node of nodes) {
    if (nodeIds.has(node.id)) throw new Error(`RelationMap received duplicate node ID: ${node.id}`);
    if (node.x < 0 || node.x > 100 || node.y < 0 || node.y > 100) {
      throw new Error(`RelationMap node ${node.id} must use x and y values from 0 to 100.`);
    }
    nodeIds.add(node.id);
  }
  for (const edge of edges) {
    if (edgeIds.has(edge.id)) throw new Error(`RelationMap received duplicate edge ID: ${edge.id}`);
    if (!nodeIds.has(edge.sourceId) || !nodeIds.has(edge.targetId)) {
      throw new Error(`RelationMap edge ${edge.id} references a missing endpoint.`);
    }
    edgeIds.add(edge.id);
  }
}

/**
 * Renders a relationship graph with constrained zoom and a semantic table alternative.
 *
 * @param props - Graph data and controlled selection.
 * @returns The accessible relationship map.
 * @public
 */
export function RelationMap(props: RelationMapProps) {
  const {
    "aria-label": ariaLabel,
    nodes,
    edges,
    selectedNodeId,
    onSelectedNodeIdChange,
    disabled = false,
    tableCaption,
  } = props;
  validateRelations(nodes, edges);
  const markerId = `miaixz-relation-map-arrow-${useId().replaceAll(":", "")}`;
  const [zoom, setZoom] = useState(100);
  const nodesById = new Map(nodes.map((node) => [node.id, node]));

  /**
   * Selects a node while the map is interactive.
   *
   * @param node - Node requested by pointer or keyboard input.
   */
  function selectNode(node: MiaixzRelationNode) {
    if (!disabled) onSelectedNodeIdChange?.(node.id);
  }

  /**
   * Handles keyboard activation for an SVG node.
   *
   * @param event - Node keyboard event.
   * @param node - Node associated with the event.
   */
  function handleNodeKeyDown(event: KeyboardEvent<SVGGElement>, node: MiaixzRelationNode) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectNode(node);
    }
  }

  return (
    <section
      aria-label={ariaLabel}
      aria-disabled={disabled || undefined}
      className="miaixz-relation-map"
    >
      <div className="miaixz-relation-map-toolbar" aria-label={`${ariaLabel}缩放`}>
        <Button
          iconOnly
          aria-label="缩小关系图"
          disabled={disabled || zoom <= minimumZoom}
          onClick={() => setZoom((value) => Math.max(minimumZoom, value - zoomStep))}
        >
          <Icon name="ZoomOut" />
        </Button>
        <output aria-live="polite" className="miaixz-relation-map-zoom">
          {zoom}%
        </output>
        <Button
          iconOnly
          aria-label="放大关系图"
          disabled={disabled || zoom >= maximumZoom}
          onClick={() => setZoom((value) => Math.min(maximumZoom, value + zoomStep))}
        >
          <Icon name="ZoomIn" />
        </Button>
      </div>
      <div className="miaixz-relation-map-viewport">
        <svg
          viewBox={`${(100 - 10000 / zoom) / 2} ${(100 - 10000 / zoom) / 2} ${10000 / zoom} ${10000 / zoom}`}
          role="img"
          aria-label={ariaLabel}
          className="miaixz-relation-map-canvas"
        >
          <defs>
            <marker id={markerId} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" className="miaixz-relation-map-arrow" />
            </marker>
          </defs>
          {edges.map((edge) => {
            const source = nodesById.get(edge.sourceId)!;
            const target = nodesById.get(edge.targetId)!;
            return (
              <g key={edge.id} className="miaixz-relation-map-edge">
                <line
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  markerEnd={edge.directed ? `url(#${markerId})` : undefined}
                />
                {edge.label && (
                  <text x={(source.x + target.x) / 2} y={(source.y + target.y) / 2 - 1}>
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}
          {nodes.map((node) => (
            <g
              key={node.id}
              role="button"
              aria-label={node.description ? `${node.label}，${node.description}` : node.label}
              aria-pressed={selectedNodeId === node.id}
              aria-disabled={disabled || undefined}
              tabIndex={disabled ? -1 : 0}
              data-tone={node.tone}
              className="miaixz-relation-map-node"
              transform={`translate(${node.x} ${node.y})`}
              onClick={() => selectNode(node)}
              onKeyDown={(event) => handleNodeKeyDown(event, node)}
            >
              <circle r="7" />
              <text textAnchor="middle" dominantBaseline="central">
                {node.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <table className="miaixz-hidden">
        <caption>{tableCaption}</caption>
        <thead>
          <tr>
            <th scope="col">来源</th>
            <th scope="col">关系</th>
            <th scope="col">目标</th>
          </tr>
        </thead>
        <tbody>
          {edges.map((edge) => (
            <tr key={edge.id}>
              <td>{nodesById.get(edge.sourceId)?.label}</td>
              <td>{edge.label ?? (edge.directed ? "指向" : "关联")}</td>
              <td>{nodesById.get(edge.targetId)?.label}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

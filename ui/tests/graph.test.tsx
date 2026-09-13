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

import { createMiaixzI18n } from "@miaixz/sdk/i18n";
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Graph } from "../src/components/diagram/graph/graph.js";
import { findDirectionalNode } from "../src/components/diagram/graph/graph-keyboard.js";
import { validateGraph } from "../src/components/diagram/graph/graph-model.js";
import { MiaixzLocaleProvider } from "../src/i18n/index.js";

afterEach(cleanup);

describe("Graph", () => {
  it("renders positioned nodes and edges and reports node selection", () => {
    const onSelectedNodeIdChange = vi.fn();
    const i18n = createMiaixzI18n();
    const { container } = render(
      <MiaixzLocaleProvider i18n={i18n}>
        <Graph
          aria-label="Service graph"
          edges={[{ directed: true, id: "api-db", sourceId: "api", targetId: "db" }]}
          nodes={[
            { id: "api", label: "API", tone: "brand", x: 25, y: 50 },
            { id: "db", label: "Database", tone: "data-1", x: 75, y: 50 },
          ]}
          onSelectedNodeIdChange={onSelectedNodeIdChange}
          selectedNodeId="api"
          tableCaption="Service connections"
        />
      </MiaixzLocaleProvider>,
    );

    expect(
      screen
        .getByRole("group", { name: "Service graph" })
        .classList.contains("miaixz-graph-canvas"),
    ).toBe(true);
    expect(container.querySelectorAll(".miaixz-graph-edge")).toHaveLength(1);
    expect(container.querySelectorAll(".miaixz-graph-node")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "API" }).getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(screen.getByRole("button", { name: "Database" }));

    expect(onSelectedNodeIdChange).toHaveBeenCalledWith("db");
  });

  it("supports directional focus, selection, zoom, pan, reset, and custom formatters", () => {
    const onSelectedNodeIdChange = vi.fn();
    const nodes = [
      { id: "center", label: "Center", description: "origin", tone: "brand", x: 50, y: 50 },
      { id: "right", label: "Right", tone: "data-1", x: 95, y: 50 },
      { id: "down", label: "Down", tone: "data-2", x: 50, y: 95 },
      { id: "left", label: "Left", tone: "data-3", x: 5, y: 50 },
      { id: "up", label: "Up", tone: "data-4", x: 50, y: 5 },
    ] as const;
    render(
      <MiaixzLocaleProvider i18n={createMiaixzI18n()}>
        <Graph
          aria-label="Topology"
          edges={[
            { id: "one", sourceId: "center", targetId: "right", directed: true },
            { id: "two", sourceId: "center", targetId: "down", label: "depends" },
          ]}
          nodeFormatter={(node) => `Node ${node.label}`}
          edgeFormatter={(edge, source, target) => `${source.id}-${edge.id}-${target.id}`}
          nodes={nodes}
          onSelectedNodeIdChange={onSelectedNodeIdChange}
          selectedNodeId="center"
          slotProps={{ canvas: { className: "canvas-slot" } }}
          tableCaption="Topology table"
        />
      </MiaixzLocaleProvider>,
    );
    const canvas = screen.getByRole("group", { name: "Topology" });
    const center = screen.getByRole("button", { name: "Node Center" });
    center.focus();
    fireEvent.keyDown(center, { key: "ArrowRight" });
    expect(screen.getByRole("button", { name: "Node Right" })).toHaveFocus();
    fireEvent.keyDown(screen.getByRole("button", { name: "Node Right" }), { key: "Home" });
    expect(center).toHaveFocus();
    fireEvent.keyDown(center, { key: "End" });
    expect(screen.getByRole("button", { name: "Node Up" })).toHaveFocus();
    fireEvent.keyDown(center, { key: "Enter" });
    fireEvent.keyDown(center, { key: " " });
    expect(onSelectedNodeIdChange).toHaveBeenCalledTimes(2);

    const originalViewBox = canvas.getAttribute("viewBox");
    fireEvent.keyDown(center, { key: "+" });
    expect(canvas.getAttribute("viewBox")).not.toBe(originalViewBox);
    fireEvent.keyDown(center, { key: "-" });
    fireEvent.keyDown(center, { key: "ArrowDown", shiftKey: true });
    expect(canvas.getAttribute("viewBox")).not.toBe(originalViewBox);
    fireEvent.keyDown(center, { key: "0" });
    expect(canvas.getAttribute("viewBox")).toBe("0 0 100 100");

    fireEvent.click(screen.getByRole("button", { name: /Zoom in/u }));
    fireEvent.click(screen.getByRole("button", { name: /Zoom out/u }));
    fireEvent.click(screen.getByRole("button", { name: /Reset view/u }));
    expect(screen.getByRole("table", { name: "Topology table" })).toHaveTextContent(
      "center-one-right",
    );
  });

  it("disables every interactive transition and validates all graph invariants", () => {
    const onSelectedNodeIdChange = vi.fn();
    const validNode = { id: "a", label: "A", tone: "neutral" as const, x: 10, y: 10 };
    render(
      <MiaixzLocaleProvider i18n={createMiaixzI18n()}>
        <Graph
          aria-label="Disabled graph"
          disabled
          edges={[]}
          nodes={[validNode]}
          onSelectedNodeIdChange={onSelectedNodeIdChange}
          tableCaption="Disabled data"
        />
      </MiaixzLocaleProvider>,
    );
    const node = screen.getByRole("button", { name: "A" });
    fireEvent.click(node);
    fireEvent.keyDown(node, { key: "Enter" });
    expect(onSelectedNodeIdChange).not.toHaveBeenCalled();
    expect(node).toHaveAttribute("aria-disabled", "true");

    expect(() => validateGraph([validNode, validNode], [])).toThrowError(
      expect.objectContaining({ code: "UI_GRAPH_DUPLICATE_NODE_ID" }),
    );
    for (const invalid of [
      { ...validNode, x: Number.NaN },
      { ...validNode, x: -1 },
      { ...validNode, x: 101 },
      { ...validNode, y: -1 },
      { ...validNode, y: 101 },
    ]) {
      expect(() => validateGraph([invalid], [])).toThrowError(
        expect.objectContaining({ code: "UI_GRAPH_NODE_POSITION_INVALID" }),
      );
    }
    expect(() =>
      validateGraph(
        [validNode],
        [
          { id: "edge", sourceId: "a", targetId: "a" },
          { id: "edge", sourceId: "a", targetId: "a" },
        ],
      ),
    ).toThrowError(expect.objectContaining({ code: "UI_GRAPH_DUPLICATE_EDGE_ID" }));
    expect(() =>
      validateGraph([validNode], [{ id: "edge", sourceId: "a", targetId: "b" }]),
    ).toThrowError(expect.objectContaining({ code: "UI_GRAPH_EDGE_ENDPOINT_MISSING" }));
    expect(findDirectionalNode([validNode], 2, "ArrowRight")).toBeUndefined();
    expect(findDirectionalNode([validNode], 0, "ArrowLeft")).toBeUndefined();
  });
});

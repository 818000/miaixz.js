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

/**
 * Verifies the supplied production workbook against the complete DrawingML path.
 */

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { render } from "@testing-library/react";
import { createElement } from "react";
import { formatDriver } from "../../../src/formats/xlsx/driver.js";
import { defaultResourceBudget } from "../../../src/runtime/resource-budget.js";
import type { DriverContext } from "../../../src/shared/contracts/driver.js";
import { ModelView } from "../../../src/shell/components/model-view.js";

const fixturePath = resolve(process.cwd(), "tests/fixtures/xlsx/system-flow.xlsx");

/**
 * Creates a bounded driver context over the supplied production workbook.
 *
 * @returns Driver context containing an immutable workbook copy.
 */
async function workbookContext(): Promise<DriverContext> {
  const bytes = new Uint8Array(await readFile(fixturePath));
  return {
    resource: {
      id: "xlsx-flowchart-fixture",
      name: "system-flow.xlsx",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      size: bytes.length,
      etag: undefined,
      /**
       * Reads a bounded fixture byte range.
       *
       * @param start - Zero-based source offset.
       * @param length - Maximum bytes returned.
       * @returns Owned fixture bytes.
       */
      async read(start, length) {
        return bytes.slice(start, start + length);
      },
      /**
       * Reads an owned copy of the complete fixture.
       *
       * @returns Complete fixture bytes.
       */
      async readAll() {
        return bytes.slice();
      },
      /**
       * Returns the deterministic fixture object URL.
       *
       * @returns Fixture object URL.
       */
      async createObjectUrl() {
        return "blob:xlsx-flowchart-fixture";
      },
      /**
       * Releases fixture resources after the test.
       */
      dispose() {},
    },
    decision: {
      extension: "xlsx",
      driver: "xlsx",
      confidence: 1,
      evidence: [],
      conflicts: [],
    },
    budget: defaultResourceBudget,
    signal: new AbortController().signal,
    /**
     * Accepts parser progress without mutating test state.
     */
    reportProgress() {},
  };
}

describe("XLSX DrawingML flowcharts", () => {
  it("retains every shape, connector, group, picture, and custom geometry", async () => {
    const outcome = await formatDriver.open(await workbookContext());
    expect(outcome.status).toBe("complete");
    if (outcome.status !== "complete") return;
    expect(outcome.model.kind).toBe("spreadsheet");
    if (outcome.model.kind !== "spreadsheet") return;
    expect(outcome.model.sheets).toHaveLength(2);
    expect(outcome.model.drawings).toHaveLength(2);
    expect(outcome.model.drawings.map((drawing) => drawing.features)).toEqual([
      {
        shapeCount: 85,
        connectorCount: 37,
        groupCount: 24,
        pictureCount: 3,
        customGeometryCount: 5,
        smartArtCount: 0,
        unsupportedCount: 0,
      },
      {
        shapeCount: 150,
        connectorCount: 79,
        groupCount: 32,
        pictureCount: 3,
        customGeometryCount: 9,
        smartArtCount: 0,
        unsupportedCount: 0,
      },
    ]);
    expect(
      outcome.model.drawings.reduce((count, drawing) => count + drawing.shapes.length, 0),
    ).toBe(357);
    expect(outcome.model.drawings.reduce((count, drawing) => count + drawing.edges.length, 0)).toBe(
      116,
    );
    expect(
      outcome.model.drawings.reduce(
        (count, drawing) => count + (drawing.graph?.nodes.length ?? 0),
        0,
      ),
    ).toBe(235);
  });

  it("produces transformed paths, arrowheads, text, and embedded image resources", async () => {
    const outcome = await formatDriver.open(await workbookContext());
    if (outcome.status !== "complete" || outcome.model.kind !== "spreadsheet") {
      throw new Error("Expected a complete spreadsheet model");
    }
    const shapes = outcome.model.drawings.flatMap((drawing) => drawing.shapes);
    expect(
      shapes.filter((shape) => shape.preset === "custom" && shape.path !== undefined),
    ).toHaveLength(14);
    expect(
      shapes.some((shape) => shape.preset === "flowChartDecision" && shape.kind === "path"),
    ).toBe(true);
    expect(shapes.some((shape) => shape.endArrow === "arrow")).toBe(true);
    expect(shapes.some((shape) => shape.text !== undefined && shape.textStyle !== undefined)).toBe(
      true,
    );
    expect(
      shapes.filter(
        (shape) => shape.kind === "image" && shape.source?.startsWith("data:") === true,
      ),
    ).toHaveLength(6);
    expect(shapes.every((shape) => shape.transform !== undefined)).toBe(true);
  });

  it("mounts every workbook drawing in the spreadsheet preview", async () => {
    const outcome = await formatDriver.open(await workbookContext());
    if (outcome.status !== "complete" || outcome.model.kind !== "spreadsheet") {
      throw new Error("Expected a complete spreadsheet model");
    }
    const rendered = render(createElement(ModelView, { document: outcome.model, scale: 1 }));
    expect(rendered.container.querySelectorAll(".miaixz-preview-sheet-drawing")).toHaveLength(2);
    expect(rendered.container.querySelectorAll("[data-drawing-id]")).toHaveLength(357);
    expect(rendered.container.querySelectorAll("path").length).toBeGreaterThan(100);
    expect(rendered.container.textContent).toContain("Cell data");
  });
});

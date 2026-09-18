import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { CSS_GEOMETRY_EXCEPTIONS, geometryException } from "./css-geometry-policy.mjs";

describe("CSS geometry policy", () => {
  it("grants only exact declaration-level graphic geometry exceptions", () => {
    expect(
      geometryException({
        fileName: "src/styles/components/diagram/graph.css",
        selector: ".miaixz-graph-viewport",
        property: "min-block-size",
        value: "22rem",
      }),
    ).toBe("Graph canvas viewport");
    expect(
      geometryException({
        fileName: "graph.css",
        selector: ".miaixz-graph-viewport",
        property: "min-block-size",
        value: "23rem",
      }),
    ).toBeUndefined();
    expect(
      geometryException({
        fileName: "panel.css",
        selector: ".miaixz-panel",
        property: "padding",
        value: "24px",
      }),
    ).toBeUndefined();
  });

  it("never exempts public typography or density bypass declarations", () => {
    for (const candidate of [
      {
        fileName: "datagrid.css",
        selector: ".miaixz-datagrid",
        property: "font-size",
        value: "12px",
      },
      {
        fileName: "panel.css",
        selector: ".miaixz-panel",
        property: "min-height",
        value: "var(--miaixz-geometry-compact-control-height)",
      },
    ]) {
      expect(geometryException(candidate)).toBeUndefined();
    }
    expect(CSS_GEOMETRY_EXCEPTIONS.every((entry) => entry[2] !== "font-size")).toBe(true);
  });

  it("keeps print geometry inside explicit print media rules", () => {
    for (const file of ["page.css", "shell.css", "table.css"]) {
      const css = readFileSync(`src/styles/components/${file}`, "utf8");
      const printStart = css.indexOf("@media print");
      expect(printStart, file).toBeGreaterThan(-1);
      expect(css.slice(printStart)).toMatch(/(?:display|break-|inline-size|width|overflow)/u);
    }
    const responsive = readFileSync("src/styles/foundation/responsive.css", "utf8");
    expect(responsive).toMatch(/@media print\s*\{/u);
    expect(responsive.slice(0, responsive.indexOf("@media print"))).not.toMatch(
      /data-miaixz-print/u,
    );
  });
});

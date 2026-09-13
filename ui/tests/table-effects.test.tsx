import { readFileSync } from "node:fs";
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Table, TableBody, TableCell, TableRow } from "../src/components/table/index.js";

afterEach(cleanup);

describe("table row effects", () => {
  it.each([
    ["compact", "dashed"],
    ["standard", "solid"],
    ["comfortable", "none"],
  ] as const)("keeps density %s independent from the %s divider", (density, dividerStyle) => {
    render(
      <Table aria-label="Records" density={density} dividerStyle={dividerStyle}>
        <TableBody>
          <TableRow selected>
            <TableCell>Record</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );

    const table = screen.getByRole("table");
    expect(table).toHaveAttribute("data-density", density);
    expect(table).toHaveAttribute("data-divider-style", dividerStyle);
    expect(screen.getByRole("row")).toHaveAttribute("data-selected", "true");
  });

  it("uses one row hover rule after the selected-row rule", () => {
    const css = readFileSync("src/styles/components/table.css", "utf8");
    const selectedRule = '.miaixz-table-row[data-selected="true"]';
    const hoverRule = ":is(.miaixz-table) > tbody > tr:hover";

    expect(css).toContain(selectedRule);
    expect(css).toContain(hoverRule);
    expect(css).toContain("background: var(--miaixz-color-surface-hover)");
    expect(css.indexOf(hoverRule)).toBeGreaterThan(css.indexOf(selectedRule));
  });
});

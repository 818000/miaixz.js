import { readFileSync } from "node:fs";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Table } from "../src/components/table/index.js";

afterEach(cleanup);

describe("table row effects", () => {
  it.each(["default", "dashed", "compact"] as const)(
    "keeps the %s variant on the shared hover surface",
    (variant) => {
      render(
        <Table variant={variant} aria-label={`${variant} table`}>
          <tbody>
            <tr>
              <td>Record</td>
            </tr>
          </tbody>
        </Table>,
      );
      expect(
        screen
          .getByRole("table")
          .classList.contains(variant === "default" ? "miaixz-table" : `miaixz-table-${variant}`),
      ).toBe(true);

      const css = readFileSync("src/styles/components/table.css", "utf8");
      expect(css).toContain(
        ":is(.miaixz-table, .miaixz-table-dashed, .miaixz-table-compact) > tbody > tr:hover",
      );
      expect(css).toContain("background: var(--miaixz-color-surface-hover)");
    },
  );

  it("lets the shared hover surface replace a dashed selected cell surface", () => {
    const css = readFileSync("src/styles/components/table.css", "utf8");
    expect(css).toContain('.miaixz-table-dashed > tbody > tr[data-selected="true"]:hover > td');
  });
});

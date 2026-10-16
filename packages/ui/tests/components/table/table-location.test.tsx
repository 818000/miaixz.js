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
 * Verifies global table row location behavior.
 */

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Table, TableRow, TableCell } from "../../../src/components/table/index.js";

afterEach(cleanup);

/**
 * Renders two tables for current-row behavior coverage.
 *
 * @returns Table location fixture.
 */
function LocationFixture() {
  return (
    <>
      <Table aria-label="Primary table">
        <tbody>
          <tr>
            <td>First row</td>
          </tr>
          <tr data-selected="true">
            <td>
              <button type="button">Second row action</button>
            </td>
          </tr>
        </tbody>
      </Table>
      <Table aria-label="Secondary table">
        <tbody>
          <tr>
            <td>
              <button type="button">Other table row</button>
            </td>
          </tr>
          <tr>
            <td data-empty="true">No rows</td>
          </tr>
        </tbody>
      </Table>
    </>
  );
}

describe("Table current-row location", () => {
  it("keeps one current row in each table and preserves selection state", () => {
    render(<LocationFixture />);

    const firstRow = screen.getByText("First row").closest("tr");
    const selectedRow = screen.getByRole("button", { name: "Second row action" }).closest("tr");
    const otherTableRow = screen.getByText("Other table row").closest("tr");

    expect(firstRow).not.toBeNull();
    expect(selectedRow).not.toBeNull();
    expect(otherTableRow).not.toBeNull();

    fireEvent.click(screen.getByText("First row"));
    expect(firstRow).toHaveAttribute("data-current-row", "true");

    fireEvent.click(screen.getByRole("button", { name: "Second row action" }));
    expect(firstRow).not.toHaveAttribute("data-current-row");
    expect(selectedRow).toHaveAttribute("data-current-row", "true");
    expect(selectedRow).toHaveAttribute("data-selected", "true");

    fireEvent.click(screen.getByText("Other table row"));
    expect(selectedRow).toHaveAttribute("data-current-row", "true");
    expect(otherTableRow).toHaveAttribute("data-current-row", "true");
  });

  it("locates a row from keyboard focus and ignores empty-state rows", () => {
    render(<LocationFixture />);

    const focusedRow = screen.getByRole("button", { name: "Other table row" }).closest("tr");
    const emptyRow = screen.getByText("No rows").closest("tr");

    expect(focusedRow).not.toBeNull();
    expect(emptyRow).not.toBeNull();

    fireEvent.focusIn(screen.getByRole("button", { name: "Other table row" }));
    expect(focusedRow).toHaveAttribute("data-current-row", "true");

    fireEvent.click(screen.getByText("No rows"));
    expect(focusedRow).toHaveAttribute("data-current-row", "true");
    expect(emptyRow).not.toHaveAttribute("data-current-row");
  });
});

/**
 * Verifies controlled current rows remain independent from pointer location.
 */
describe("controlled current rows", () => {
  it("preserves explicit current state and business selection independently", () => {
    const { rerender } = render(
      <Table trackCurrentRow={false}>
        <tbody>
          <TableRow current selected>
            <TableCell>Controlled first</TableCell>
          </TableRow>
          <TableRow current={false}>
            <TableCell>Controlled second</TableCell>
          </TableRow>
        </tbody>
      </Table>,
    );
    fireEvent.click(screen.getByText("Controlled second"));
    expect(screen.getByText("Controlled first").closest("tr")).toHaveAttribute(
      "data-current-row",
      "true",
    );
    expect(screen.getByText("Controlled second").closest("tr")).not.toHaveAttribute(
      "data-current-row",
    );
    rerender(
      <Table trackCurrentRow={false}>
        <tbody>
          <TableRow current={false} selected>
            <TableCell>Controlled first</TableCell>
          </TableRow>
          <TableRow current>
            <TableCell>Controlled second</TableCell>
          </TableRow>
        </tbody>
      </Table>,
    );
    expect(screen.getByText("Controlled second").closest("tr")).toHaveAttribute(
      "data-current-row",
      "true",
    );
    expect(screen.getByText("Controlled first").closest("tr")).toHaveAttribute(
      "data-selected",
      "true",
    );
  });
  it("ignores disabled rows and does not locate an outer row for nested tables", () => {
    render(
      <Table>
        <tbody>
          <tr aria-disabled="true">
            <td>Disabled row</td>
          </tr>
          <tr>
            <td>
              Outer row
              <Table>
                <tbody>
                  <tr>
                    <td>Nested row</td>
                  </tr>
                </tbody>
              </Table>
            </td>
          </tr>
        </tbody>
      </Table>,
    );
    fireEvent.click(screen.getByText("Disabled row"));
    expect(screen.getByText("Disabled row").closest("tr")).not.toHaveAttribute("data-current-row");
    fireEvent.click(screen.getByText("Nested row"));
    expect(screen.getByText("Nested row").closest("tr")).toHaveAttribute(
      "data-current-row",
      "true",
    );
    expect(screen.getByText("Outer row").closest("tr")).not.toHaveAttribute("data-current-row");
  });
});

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

import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Spinner } from "../../src/components/spinner/index.js";

afterEach(cleanup);

describe("Spinner", () => {
  it("renders one status owner and one exact hidden label", () => {
    render(
      <Spinner
        label="正在同步"
        size="small"
        slotProps={{ root: { className: "fixture-spinner" }, label: { id: "spinner-label" } }}
      />,
    );

    const status = screen.getByRole("status");
    expect(status).toHaveClass("miaixz-spinner", "fixture-spinner");
    expect(status).toHaveAttribute("data-size", "small");
    expect(within(status).getAllByText("正在同步")).toHaveLength(1);
    expect(within(status).getByText("正在同步")).toHaveAttribute("id", "spinner-label");
    expect(status.querySelectorAll('[role="status"]')).toHaveLength(0);
  });
});

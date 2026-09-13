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
import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Sections } from "../src/components/sections/index.js";
import { renderWithLocale } from "./test-utils.js";

afterEach(cleanup);

describe("Sections", () => {
  it("renders named sections with invariant list semantics", () => {
    renderWithLocale(
      <Sections
        sections={[
          {
            id: "products",
            label: "产品",
            count: 1,
            items: [{ id: "console", title: "控制台", description: "管理产品配置" }],
          },
        ]}
      />,
    );

    const section = screen.getByRole("region", { name: "产品" });
    expect(section.querySelectorAll("ul")).toHaveLength(1);
    expect(section.querySelectorAll("li")).toHaveLength(1);
    expect(screen.getByText("控制台")).toBeVisible();
  });

  it("renders the localized empty state", () => {
    renderWithLocale(<Sections sections={[{ id: "empty", label: "空分区", items: [] }]} />);

    expect(screen.getByText("暂无项目")).toBeVisible();
  });

  it("rejects duplicate section and item ids", () => {
    expect(() =>
      renderWithLocale(
        <Sections
          sections={[
            { id: "duplicate", label: "一", items: [] },
            { id: "duplicate", label: "二", items: [] },
          ]}
        />,
      ),
    ).toThrow("[UI_COLLECTION_DUPLICATE_ID] ui.error.collection.duplicateId");

    expect(() =>
      renderWithLocale(
        <Sections
          sections={[
            {
              id: "section",
              label: "分区",
              items: [
                { id: "duplicate", title: "一" },
                { id: "duplicate", title: "二" },
              ],
            },
          ]}
        />,
      ),
    ).toThrow("[UI_COLLECTION_DUPLICATE_ID] ui.error.collection.duplicateId");
  });
});

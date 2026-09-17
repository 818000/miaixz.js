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

import { Shell } from "../src/components/shell/index.js";
import { renderWithLocale } from "./test-utils.js";

afterEach(cleanup);

describe("Shell", () => {
  it("keeps header, desktop navigation and main as distinct semantic owners", () => {
    renderWithLocale(
      <Shell
        desktopNavigation={{ mode: "rail", expanded: true }}
        header={<span>Header</span>}
        headerBehavior="scroll"
        sidebar={<nav aria-label="桌面导航" />}
        sidebarOverflow="contained"
      >
        Content
      </Shell>,
    );
    const main = screen.getByRole("main");
    expect(main).toHaveTextContent("Content");
    expect(main.parentElement).toHaveAttribute("data-desktop-navigation", "rail");
    expect(main.parentElement).toHaveAttribute("data-navigation-expanded", "true");
    expect(main.parentElement).toHaveAttribute("data-header-behavior", "scroll");
    expect(screen.getByRole("complementary")).toHaveAttribute("data-overflow", "contained");
  });

  it("renders bottom mobile navigation from its explicit branch", () => {
    renderWithLocale(
      <Shell
        header={<span>Header</span>}
        mobileNavigation={{ mode: "bottom", content: <nav aria-label="移动导航" /> }}
        sidebar={<nav aria-label="桌面导航" />}
      >
        Content
      </Shell>,
    );
    expect(screen.getByRole("navigation", { name: "移动导航" })).toBeVisible();
  });
});

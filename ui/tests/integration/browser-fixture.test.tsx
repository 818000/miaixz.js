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

/*
 * Integration test helpers stay local to this file.
 */
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { AccessibilityFixture, BrowserFixture } from "../browser-fixture.js";
import { renderWithLocale } from "../test-utils.js";

afterEach(cleanup);

beforeEach(() => {
  HTMLDialogElement.prototype.showModal ??= function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close ??= function () {
    this.removeAttribute("open");
  };
});

describe("browser fixture integration", () => {
  it.each([
    "alert",
    "avatar",
    "dialog",
    "drawer",
    "select",
    "combobox",
    "dropdown",
    "tabs",
    "tree",
    "datagrid",
    "upload",
    "timeline",
    "sparkline",
    "donut",
    "graph",
  ] as const)("renders the isolated %s accessibility contract", (name) => {
    renderWithLocale(<AccessibilityFixture name={name} />);
    expect(document.querySelector(`[data-testid="a11y-${name}"]`)).not.toBeNull();
  });

  it("renders and operates the complete public component composition", async () => {
    const user = userEvent.setup();
    render(<BrowserFixture />);

    expect(screen.getByRole("main", { name: "Miaixz UI 浏览器契约夹具" })).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "固定成员数据" })).toBeInTheDocument();
    expect(screen.getByRole("tree", { name: "浏览器目录" })).toBeInTheDocument();
    expect(screen.getByRole("tablist", { name: "浏览器标签页" })).toBeInTheDocument();

    await user.click(screen.getByRole("switch", { name: "启用同步" }));
    expect(screen.getByRole("switch", { name: "启用同步" })).not.toBeChecked();

    await user.click(screen.getByRole("button", { name: "切换密度偏好" }));
    expect(document.documentElement).toHaveAttribute("data-miaixz-density", "compact");

    await user.click(screen.getByRole("button", { name: "打开长内容抽屉" }));
    expect(screen.getByRole("dialog", { name: "外层抽屉" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "打开内层抽屉" }));
    expect(screen.getByRole("dialog", { name: "内层抽屉" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "完成" }));

    const firstTab = screen.getByRole("tab", { name: "概览" });
    firstTab.focus();
    fireEvent.keyDown(firstTab, { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: "详情" })).toHaveAttribute("aria-selected", "true");

    await user.click(
      screen.getByRole("button", { name: /打开外观设置|Open appearance settings/u }),
    );
    expect(screen.getByRole("dialog", { name: /主题与风格|Appearance/u })).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: /深色|Dark/u }));
    expect(document.documentElement).toHaveAttribute("data-miaixz-color-mode", "dark");
    await user.click(screen.getByRole("radio", { name: /紧凑|Compact/u }));
    expect(document.documentElement).toHaveAttribute("data-miaixz-density", "compact");
    await user.click(
      screen.getByRole("button", { name: /切换界面语言|Change interface language/u }),
    );
    expect(screen.getByRole("dialog", { name: /界面语言|Language/u })).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: /返回外观设置|Back to appearance settings/u }),
    );
    expect(screen.getByRole("dialog", { name: /主题与风格|Appearance/u })).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: /关闭外观设置|Close appearance settings/u }),
    );
    expect(screen.queryByRole("dialog", { name: /主题与风格|Appearance/u })).toBeNull();
  });
});

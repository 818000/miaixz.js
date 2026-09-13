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
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { DRAWER_WIDTHS, Drawer, type DrawerWidth } from "../src/components/drawer/index.js";
import { MiaixzLocaleProvider } from "../src/i18n/index.js";

beforeEach(() => {
  HTMLDialogElement.prototype.showModal ??= function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close ??= function () {
    this.removeAttribute("open");
  };
});
afterEach(cleanup);

/**
 * Renders one explicit width using the sole width contract.
 * @param width - Optional width override.
 * @returns A localized drawer.
 */
function fixture(width?: DrawerWidth) {
  return (
    <MiaixzLocaleProvider i18n={createMiaixzI18n()}>
      <Drawer open title="Width" width={width} onOpenChange={() => undefined}>
        Content
      </Drawer>
    </MiaixzLocaleProvider>
  );
}

describe("Drawer widths", () => {
  it("exports immutable numeric presets and applies named or custom widths from one property", () => {
    expect(Object.isFrozen(DRAWER_WIDTHS)).toBe(true);
    const { rerender } = render(fixture());
    for (const width of [...DRAWER_WIDTHS, 435.5]) {
      rerender(fixture(width));
      const drawer = screen.getByRole("dialog", { name: "Width" });
      expect(drawer.style.getPropertyValue("--miaixz-drawer-width")).toBe(`${width}px`);
      expect(drawer).not.toHaveClass("miaixz-drawer-positioned");
      expect(drawer.style.inlineSize).toBe("");
      expect(drawer).not.toHaveAttribute("data-positioned");
    }
    rerender(fixture("large"));
    expect(screen.getByRole("dialog")).toHaveAttribute("data-width", "large");
    expect(screen.getByRole("dialog").style.getPropertyValue("--miaixz-drawer-width")).toBe("");
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])("rejects invalid width %s", (width) => {
    expect(() => render(fixture(width))).toThrowError(
      expect.objectContaining({ code: "UI_DRAWER_WIDTH_INVALID" }),
    );
  });
});

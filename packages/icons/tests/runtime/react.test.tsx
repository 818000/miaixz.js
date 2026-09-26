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
 * Verifies the React DOM, accessibility, font axis, and failure contracts.
 */

import { render } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it } from "vitest";

import { Icon } from "../../src/react/index.js";
import { resetMiaixzIconFontLoads } from "../../src/runtime/index.js";

afterEach(() => {
  resetMiaixzIconFontLoads();
});

describe("Icon", () => {
  it("renders a stable accessible span with continuous font axes", () => {
    const reference = createRef<HTMLSpanElement>();
    const result = render(
      <Icon fill={0.375} label=" Search " name="search" ref={reference} size={48} />,
    );
    const root = result.getByRole("img", { name: "Search" });
    expect(root).toBe(reference.current);
    expect(root.tagName).toBe("SPAN");
    expect(root.style.getPropertyValue("--miaixz-icon-fill")).toBe("0.375");
    expect(root.style.getPropertyValue("--miaixz-icon-opsz")).toBe("40");
    expect(root.style.getPropertyValue("--miaixz-icon-size")).toBe("48px");
    const glyph = root.querySelector(".miaixz-icon-glyph");
    expect(glyph).not.toBeNull();
    expect(glyph?.textContent).toBe("");
    expect(glyph?.getAttribute("data-miaixz-icon-glyph")).toBe(String.fromCodePoint(0xf0034));
  });

  it("keeps decorative icons out of the accessibility tree", () => {
    const { container } = render(<Icon name="help" />);
    expect(container.firstElementChild?.getAttribute("aria-hidden")).toBe("true");
    expect(container.firstElementChild?.hasAttribute("role")).toBe(false);
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])("rejects invalid size %s", (size) => {
    expect(() => render(<Icon name="help" size={size} />)).toThrow(TypeError);
  });

  it.each([-0.01, 1.01, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects invalid fill %s",
    (fill) => {
      expect(() => render(<Icon fill={fill} name="help" />)).toThrow(TypeError);
    },
  );

  it("rejects an empty accessible label", () => {
    expect(() => render(<Icon label="   " name="help" />)).toThrow(TypeError);
  });

  it("renders directional state only on the font glyph", () => {
    const { container } = render(<Icon motion="none" name="arrow-left" />);
    expect(container.querySelector("svg")).toBeNull();
    expect(
      container.querySelector(".miaixz-icon-glyph")?.getAttribute("data-miaixz-icon-mirror"),
    ).toBe("true");
  });
});

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

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Avatar } from "../../src/components/avatar/index.js";

afterEach(cleanup);

describe("Avatar", () => {
  it("keeps one accessible image name when the source fails", () => {
    const { container } = render(<Avatar alt="用户 Kimi" name="Kimi Leaves" src="/avatar.png" />);
    const image = screen.getByRole("img", { name: "用户 Kimi" });
    expect(image).toHaveAttribute("src", "/avatar.png");

    fireEvent.error(image);

    expect(screen.getByRole("img", { name: "用户 Kimi" })).toHaveTextContent("KI");
    expect(container.querySelectorAll('[role="img"]')).toHaveLength(1);
  });

  it("keeps an empty-alt fallback decorative and merges fixed slot props", () => {
    const { container } = render(
      <Avatar
        alt=""
        name="Kimi"
        slotProps={{
          root: { className: "fixture-root" },
          fallback: { className: "fixture-fallback" },
        }}
      />,
    );

    const root = container.firstElementChild;
    const fallback = root?.firstElementChild;
    expect(root).toHaveClass("miaixz-avatar", "fixture-root");
    expect(fallback).toHaveClass("miaixz-avatar-fallback", "fixture-fallback");
    expect(fallback).toHaveAttribute("aria-hidden", "true");
    expect(fallback).not.toHaveAttribute("role");
    expect(screen.queryByRole("img")).toBeNull();
  });
});

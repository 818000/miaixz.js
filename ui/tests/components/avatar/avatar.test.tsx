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
import { afterEach, describe, expect, it, vi } from "vitest";

import { Avatar, AvatarGroup, AvatarPicker } from "../../../src/components/avatar/index.js";
import { Icon } from "../../../src/components/icon/index.js";

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

  it("supports responsive images, semantic variants, custom sizes, and content fallbacks", () => {
    const { container, rerender } = render(
      <Avatar
        alt="Remy Sharp"
        name="Remy Sharp"
        sizes="(min-width: 600px) 56px, 24px"
        src="/avatar.png"
        srcSet="/avatar.png 1x, /avatar@2x.png 2x"
        style={{ width: 56, height: 56, backgroundColor: "rgb(1, 2, 3)" }}
        variant="rounded"
      />,
    );
    const image = screen.getByRole("img", { name: "Remy Sharp" });
    expect(image).toHaveAttribute("srcset", "/avatar.png 1x, /avatar@2x.png 2x");
    expect(image).toHaveAttribute("sizes", "(min-width: 600px) 56px, 24px");
    expect(container.firstElementChild).toHaveClass("miaixz-avatar-rounded");
    expect(container.firstElementChild).toHaveStyle({ width: "56px", height: "56px" });
    expect(container.firstElementChild).toHaveStyle({ backgroundColor: "rgb(1, 2, 3)" });

    rerender(
      <Avatar alt="Folder" variant="square">
        <Icon name="Folder" />
      </Avatar>,
    );
    expect(container.firstElementChild).toHaveClass("miaixz-avatar-square");
    expect(screen.getByRole("img", { name: "Folder" })).toContainElement(
      container.querySelector("svg"),
    );
  });

  it("renders status and count indicators without changing avatar semantics", () => {
    const { rerender } = render(
      <Avatar alt="Kimi, online" indicator="" indicatorLabel="Online" name="Kimi" />,
    );
    expect(screen.getByRole("img", { name: "Kimi, online" })).toHaveTextContent("KI");
    expect(screen.getByRole("img", { name: "Online" })).toHaveClass("miaixz-avatar-indicator");

    rerender(<Avatar alt="Kimi, two unread" indicator={2} name="Kimi" />);
    expect(screen.getByText("2")).toHaveAttribute("aria-hidden", "true");
  });

  it("falls back through children, alt text, and the generic user icon", () => {
    const { container, rerender } = render(
      <Avatar alt="Broken image" src="/broken.png">
        B
      </Avatar>,
    );
    fireEvent.error(screen.getByRole("img", { name: "Broken image" }));
    expect(screen.getByRole("img", { name: "Broken image" })).toHaveTextContent("B");

    rerender(<Avatar alt="Remy Sharp" src="/broken-again.png" />);
    fireEvent.error(screen.getByRole("img", { name: "Remy Sharp" }));
    expect(screen.getByRole("img", { name: "Remy Sharp" })).toHaveTextContent("R");

    rerender(<Avatar src="/broken-final.png" />);
    fireEvent.error(container.querySelector("img")!);
    expect(container.querySelector(".miaixz-avatar-fallback svg")).toBeInTheDocument();
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("groups avatars with max, total, custom surplus, spacing, and inherited variants", () => {
    const { container } = render(
      <AvatarGroup
        max={4}
        renderSurplus={(surplus) => `hidden ${surplus}`}
        spacing={12}
        total={6}
        variant="rounded"
      >
        <Avatar alt="One" name="One" />
        <Avatar alt="Two" name="Two" />
        <Avatar alt="Three" name="Three" />
        <Avatar alt="Four" name="Four" />
        <Avatar alt="Five" name="Five" />
      </AvatarGroup>,
    );

    const group = container.firstElementChild;
    expect(group).toHaveClass("miaixz-avatar-group");
    expect(group).toHaveAttribute("data-spacing", "custom");
    expect(group).toHaveStyle({ "--miaixz-avatar-group-spacing": "-12px" });
    expect(group?.querySelectorAll(":scope > .miaixz-avatar")).toHaveLength(4);
    expect(group?.querySelectorAll(":scope > .miaixz-avatar-rounded")).toHaveLength(4);
    expect(screen.getByRole("img", { name: "+3" })).toHaveTextContent("hidden 3");
    expect(screen.queryByRole("img", { name: "Four" })).toBeNull();
  });

  it("rejects invalid avatar group limits instead of silently normalizing them", () => {
    expect(() => render(<AvatarGroup max={0} />)).toThrowError(
      expect.objectContaining({ code: "UI_AVATAR_GROUP_MAX_INVALID" }),
    );
    expect(() =>
      render(
        <AvatarGroup total={0}>
          <Avatar alt="One" />
        </AvatarGroup>,
      ),
    ).toThrowError(expect.objectContaining({ code: "UI_AVATAR_GROUP_TOTAL_INVALID" }));
    expect(() => render(<AvatarGroup spacing={Number.NaN} />)).toThrowError(
      expect.objectContaining({ code: "UI_AVATAR_GROUP_SPACING_INVALID" }),
    );
  });

  it("provides a profile-sized image picker through the existing Miaixz Dropzone", () => {
    const onFile = vi.fn();
    const { container } = render(
      <AvatarPicker label="Choose avatar" onFile={onFile}>
        <Avatar alt="Current avatar" name="Kimi" size="large" />
      </AvatarPicker>,
    );
    const file = new File(["avatar"], "avatar.png", { type: "image/png" });
    fireEvent.change(container.querySelector('input[type="file"]')!, {
      target: { files: [file] },
    });
    expect(container.firstElementChild).toHaveClass("miaixz-avatar-picker");
    expect(container.querySelector(".miaixz-avatar")).toHaveAttribute("data-size", "large");
    expect(onFile).toHaveBeenCalledWith(file);
  });
});

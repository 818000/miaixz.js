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

import { createRef, type HTMLAttributes, type RefAttributes } from "react";
import { describe, expect, it, vi } from "vitest";

import { mergeMiaixzSlotProps } from "../../src/shared/slots.js";

type TestSlotProps = HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>;
type TestOwnerState = Readonly<Record<"disabled", boolean>>;

describe("slot property merging", () => {
  it("uses the frozen class and style order", () => {
    const props = mergeMiaixzSlotProps<{}, TestSlotProps, HTMLDivElement>({
      ownerState: {},
      defaultProps: { className: "base", style: { color: "base", display: "block" } },
      themeDefaultProps: { className: "theme-default", style: { color: "theme" } },
      componentProps: { className: "component", style: { color: "component" } },
      themeClassNames: ["theme-slot", "theme-variant"],
      slotProps: { className: "slot", style: { color: "slot" } },
    });
    expect(props.className).toBe("base theme-default component theme-slot theme-variant slot");
    expect(props.style).toEqual({ color: "slot", display: "block" });
  });

  it("runs public handlers before cancellable internal behavior", () => {
    const calls: string[] = [];
    const props = mergeMiaixzSlotProps<{}, TestSlotProps, HTMLDivElement>({
      ownerState: {},
      componentProps: { onClick: () => calls.push("component") },
      slotProps: {
        onClick: (event) => {
          calls.push("slot");
          event.preventDefault();
        },
      },
      internalProps: { onClick: () => calls.push("internal") },
    });
    props.onClick?.(new MouseEvent("click", { cancelable: true }) as never);
    expect(calls).toEqual(["component", "slot"]);
  });

  it("writes refs in internal, forwarded, and slot order", () => {
    const calls: string[] = [];
    const forwardedRef = createRef<HTMLDivElement>();
    const props = mergeMiaixzSlotProps<{}, TestSlotProps, HTMLDivElement>({
      ownerState: {},
      internalRef: () => calls.push("internal"),
      forwardedRef,
      slotProps: { ref: () => calls.push("slot") },
    });
    const instance = document.createElement("div");
    props.ref?.(instance);
    expect(calls).toEqual(["internal", "slot"]);
    expect(forwardedRef.current).toBe(instance);
  });

  it("rejects slot overrides of component-owned semantics", () => {
    expect(() =>
      mergeMiaixzSlotProps<{}, TestSlotProps, HTMLDivElement>({
        ownerState: {},
        slotProps: { role: "presentation" },
        internalProps: { role: "dialog" },
        ownedProps: ["role"],
      }),
    ).toThrowError(expect.objectContaining({ code: "UI_SLOT_OWNED_PROP_CONFLICT" }));
  });

  it("resolves functional slot properties from immutable owner state", () => {
    const slot = vi.fn((state: TestOwnerState) => ({
      id: state.disabled ? "disabled" : "enabled",
    }));
    const props = mergeMiaixzSlotProps<TestOwnerState, TestSlotProps, HTMLDivElement>({
      ownerState: Object.freeze({ disabled: true }),
      slotProps: slot,
    });
    expect(props.id).toBe("disabled");
    expect(slot).toHaveBeenCalledWith({ disabled: true });
  });
});

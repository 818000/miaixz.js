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

/* eslint-disable jsdoc/require-jsdoc --
 * Test-only Theme probes remain local to this file.
 */

import { createMiaixzAppearanceManager } from "@miaixz/sdk/appearance";
import "@testing-library/jest-dom/vitest";
import { act, cleanup, renderHook, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Button } from "../src/components/button/button.js";
import { watchMiaixzSystemColorMode } from "../src/theme/appearance.js";
import { applyTheme } from "../src/theme/apply.js";
import { ThemeCache } from "../src/theme/cache.js";
import {
  getMiaixzThemeSlotClassNames,
  mergeMiaixzThemeComponents,
  type ThemeComponents,
} from "../src/theme/components.js";
import { useTheme } from "../src/theme/context.js";
import { defineTheme } from "../src/theme/define.js";
import { Theme, resolveMiaixzColorMode } from "../src/theme/theme.js";
import type { MiaixzSerializedThemeApplication } from "../src/theme/serialize.js";
import { withMiaixzThemeComponent } from "../src/theme/themed-component.js";
import { renderWithLocale } from "./test-utils.js";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const remoteTheme = defineTheme({
  schemaVersion: 1,
  name: "remote",
  label: "Remote",
  version: "1.0.0",
  extends: "miaixz",
  modes: {
    light: { colors: { brand: "#123456" } },
    dark: { colors: { brand: "#abcdef" } },
  },
});

function createAppearance(theme = "miaixz") {
  const values = new Map<string, string>();
  return createMiaixzAppearanceManager({
    appId: `theme-test-${theme}`,
    initialAppearance: { theme, colorMode: "light", density: "standard" },
    storage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
      removeItem: (key) => values.delete(key),
    },
  });
}

function ThemeProbe() {
  const theme = useTheme();
  return (
    <section>
      <output aria-label="theme-state">{`${theme.theme}:${theme.colorMode}:${theme.density}:${theme.status}:${theme.revision}`}</output>
      <button type="button" onClick={() => void theme.setColorMode("dark")}>
        dark
      </button>
      <button type="button" onClick={() => void theme.setDensity("compact")}>
        compact
      </button>
      <button type="button" onClick={() => void theme.setOverrides({ dark: { brand: "#010203" } })}>
        override
      </button>
      <button type="button" onClick={() => void theme.setTheme("remote")}>
        remote
      </button>
      <button type="button" onClick={() => void theme.retry()}>
        retry
      </button>
      <button type="button" onClick={() => void theme.reset()}>
        reset
      </button>
    </section>
  );
}

interface RootThemeProbeProps extends HTMLAttributes<HTMLDivElement> {
  readonly active?: boolean;
}

const RootThemeProbe = withMiaixzThemeComponent(
  "Bar",
  forwardRef<HTMLDivElement, RootThemeProbeProps>(function RootThemeProbe(
    { active: _active, ...props },
    ref,
  ) {
    return <div {...props} ref={ref} />;
  }),
);

type ProbeSlot =
  | Readonly<Record<string, unknown>>
  | ((ownerState: Readonly<Record<string, unknown>>) => Readonly<Record<string, unknown>>);

interface SlotThemeProbeProps extends HTMLAttributes<HTMLDivElement> {
  readonly mode?: "content" | "navigation" | "tabs";
  readonly slotProps?: Readonly<Record<string, ProbeSlot | undefined>>;
  readonly children?: ReactNode;
}

function resolveProbeSlot(
  slot: ProbeSlot | undefined,
  ownerState: Readonly<Record<string, unknown>>,
): Readonly<Record<string, unknown>> {
  return typeof slot === "function" ? slot(ownerState) : (slot ?? {});
}

const SlotThemeProbe = withMiaixzThemeComponent(
  "View",
  forwardRef<HTMLDivElement, SlotThemeProbeProps>(function SlotThemeProbe(
    { mode = "content", slotProps, children, ...props },
    ref,
  ) {
    const ownerState = { mode, surface: "plain", density: "standard" };
    return (
      <div {...props} {...resolveProbeSlot(slotProps?.root, ownerState)} ref={ref}>
        <span {...resolveProbeSlot(slotProps?.content, ownerState)}>{children}</span>
      </div>
    );
  }),
);

describe("Theme runtime", () => {
  it("applies local attributes and transactional appearance operations", async () => {
    const user = userEvent.setup();
    const appearance = createAppearance();
    const { container } = renderWithLocale(
      <Theme
        appearance={appearance}
        className="local-theme"
        components={{
          Button: {
            defaultProps: { variant: "solid" },
            slotClassNames: { root: "theme-button", label: "theme-label" },
            variants: [{ props: { tone: "danger" }, slotClassNames: { root: "danger-button" } }],
          },
        }}
        scope="local"
        themes={[remoteTheme]}
      >
        <ThemeProbe />
        <Button tone="danger">Themed action</Button>
      </Theme>,
    );
    const target = container.querySelector<HTMLElement>("[data-miaixz-theme-scope]")!;
    expect(target).toHaveClass("local-theme");
    expect(target).toHaveAttribute("data-miaixz-theme", "miaixz");
    expect(screen.getByRole("button", { name: "Themed action" })).toHaveClass(
      "theme-button",
      "danger-button",
    );

    await user.click(screen.getByRole("button", { name: "dark" }));
    expect(target).toHaveAttribute("data-miaixz-color-mode", "dark");
    await user.click(screen.getByRole("button", { name: "compact" }));
    expect(target).toHaveAttribute("data-miaixz-density", "compact");
    await user.click(screen.getByRole("button", { name: "override" }));
    expect(container.querySelector("style")?.textContent).toContain("#010203");
    await user.click(screen.getByRole("button", { name: "remote" }));
    expect(target).toHaveAttribute("data-miaixz-theme", "remote");
    await user.click(screen.getByRole("button", { name: "reset" }));
    expect(target).toHaveAttribute("data-miaixz-theme", "miaixz");
    expect(target).toHaveAttribute("data-miaixz-density", "standard");
    appearance.destroy();
  });

  it("loads an unknown initial theme, reports failure, and retries the same target", async () => {
    const user = userEvent.setup();
    const appearance = createAppearance("remote");
    let rejectFirst: ((reason: unknown) => void) | undefined;
    const loader = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise((_resolve, reject) => {
            rejectFirst = reject;
          }),
      )
      .mockResolvedValueOnce(remoteTheme);
    renderWithLocale(
      <Theme appearance={appearance} loader={loader} scope="local">
        <ThemeProbe />
      </Theme>,
    );
    expect(await screen.findByLabelText("theme-state")).toHaveTextContent(
      "miaixz:light:standard:loading",
    );
    await act(async () => rejectFirst?.(new Error("offline")));
    await waitFor(() => expect(screen.getByLabelText("theme-state")).toHaveTextContent(":error:"));
    await user.click(screen.getByRole("button", { name: "retry" }));
    await waitFor(() =>
      expect(screen.getByLabelText("theme-state")).toHaveTextContent("remote:light:standard:ready"),
    );
    expect(loader).toHaveBeenCalledTimes(2);
    appearance.destroy();
  });

  it("falls back when an unknown persisted theme has no loader", async () => {
    const appearance = createAppearance("missing");
    const { container } = renderWithLocale(
      <Theme appearance={appearance} scope="local">
        <ThemeProbe />
      </Theme>,
    );
    await waitFor(() => expect(appearance.getSnapshot().theme).toBe("miaixz"));
    expect(container.querySelector("[data-miaixz-theme-scope]"))?.toHaveAttribute(
      "data-miaixz-theme",
      "miaixz",
    );
    appearance.destroy();
  });

  it("requires a provider and resolves explicit and system color modes", () => {
    expect(() => renderHook(() => useTheme())).toThrowError(
      expect.objectContaining({ code: "UI_THEME_INVALID" }),
    );
    expect(resolveMiaixzColorMode("light", true)).toBe("light");
    expect(resolveMiaixzColorMode("dark", false)).toBe("dark");
    expect(resolveMiaixzColorMode("system", true)).toBe("dark");
    expect(resolveMiaixzColorMode("system", false)).toBe("light");
  });

  it("applies root-only and slotted Theme configuration without parallel component APIs", () => {
    const appearance = createAppearance();
    const rootRef = vi.fn();
    renderWithLocale(
      <Theme
        appearance={appearance}
        components={{
          Bar: {
            defaultProps: { active: true, label: "Default" },
            slotClassNames: { root: "bar-theme-root" },
            variants: [
              { props: { active: true }, slotClassNames: { root: "bar-theme-active" } },
              { props: { active: false }, slotClassNames: { root: "bar-theme-inactive" } },
            ],
          },
          View: {
            defaultProps: { mode: "content", "aria-label": "Default", title: "Default" },
            slotClassNames: { root: "view-theme-root", content: "view-theme-content" },
            variants: [
              {
                props: { mode: "navigation" },
                slotClassNames: { content: "view-navigation-content" },
              },
            ],
          },
        }}
        scope="local"
      >
        <RootThemeProbe active className="consumer-root" ref={rootRef}>
          Root probe
        </RootThemeProbe>
        <SlotThemeProbe
          mode="navigation"
          slotProps={{
            root: { className: "consumer-slot-root" },
            content: () => ({ className: "consumer-slot-content" }),
            actions: { className: "consumer-unconfigured-slot" },
          }}
        >
          Slot probe
        </SlotThemeProbe>
      </Theme>,
    );
    expect(screen.getByText("Root probe")).toHaveClass(
      "bar-theme-root",
      "bar-theme-active",
      "consumer-root",
    );
    expect(screen.getByText("Slot probe").parentElement).toHaveClass(
      "view-theme-root",
      "consumer-slot-root",
    );
    expect(screen.getByText("Slot probe")).toHaveClass(
      "view-theme-content",
      "view-navigation-content",
      "consumer-slot-content",
    );
    expect(rootRef).toHaveBeenCalled();
    appearance.destroy();
  });
});

describe("Theme infrastructure", () => {
  it("merges component defaults, slots, and variants in parent-first order", () => {
    const parent: ThemeComponents = {
      Button: {
        defaultProps: { size: "small", tone: "neutral" },
        slotClassNames: { root: "parent-root" },
        variants: [{ props: { tone: "danger" }, slotClassNames: { root: "parent-danger" } }],
      },
    };
    const child: ThemeComponents = {
      Button: {
        defaultProps: { tone: "danger" },
        slotClassNames: { root: "child-root", label: "child-label" },
        variants: [{ props: { size: "small" }, slotClassNames: { root: "child-small" } }],
      },
    };
    const merged = mergeMiaixzThemeComponents(parent, child);
    expect(merged.Button?.defaultProps).toEqual({ size: "small", tone: "danger" });
    expect(merged.Button?.slotClassNames).toEqual({
      root: "parent-root child-root",
      label: "child-label",
    });
    expect(
      getMiaixzThemeSlotClassNames(
        merged.Button!,
        { size: "small", tone: "danger", variant: "solid", loading: false, disabled: false },
        "root",
      ),
    ).toEqual(["parent-root child-root", "parent-danger", "child-small"]);
    expect(mergeMiaixzThemeComponents(parent, undefined)).toBe(parent);
    expect(mergeMiaixzThemeComponents({}, { Button: child.Button })).toEqual({
      Button: child.Button,
    });
    expect(mergeMiaixzThemeComponents({ Button: parent.Button }, {})).toEqual({
      Button: parent.Button,
    });
    expect(getMiaixzThemeSlotClassNames({ defaultProps: {} }, { tone: "neutral" }, "root")).toEqual(
      [undefined],
    );
  });

  it("caches one loader result and rejects cancellation and name mismatch", async () => {
    const cache = new ThemeCache();
    const signal = new AbortController().signal;
    const loader = vi.fn().mockResolvedValue(remoteTheme);
    const first = cache.load("remote", loader, signal);
    const second = cache.load("remote", loader, signal);
    expect(second).toBe(first);
    await expect(first).resolves.toEqual(remoteTheme);
    await expect(cache.load("remote", loader, signal)).resolves.toEqual(remoteTheme);
    expect(cache.key("remote")).toBe("remote:1:1.0.0");
    expect(loader).toHaveBeenCalledTimes(1);

    await expect(
      cache.load("other", async () => remoteTheme, new AbortController().signal),
    ).rejects.toMatchObject({ code: "UI_THEME_INVALID" });
    const controller = new AbortController();
    controller.abort();
    await expect(
      cache.load("aborted", async () => remoteTheme, controller.signal),
    ).rejects.toMatchObject({
      code: "UI_THEME_LOAD_ABORTED",
    });
    cache.clear();
    expect(cache.key("remote")).toBeUndefined();
  });

  it("applies and conditionally restores the exact style and target attributes", () => {
    const target = document.createElement("div");
    const style = document.createElement("style");
    style.textContent = "before";
    target.setAttribute("data-miaixz-theme", "before");
    const application: MiaixzSerializedThemeApplication = {
      instanceId: "local",
      theme: "remote",
      colorMode: "dark",
      colorPreference: "system",
      density: "compact",
      composition: { entry: "split", shell: "rail", panel: "outlined" },
      cssText: "after",
    };
    const restore = applyTheme(target, style, application);
    expect(style.textContent).toBe("after");
    expect(target).toHaveAttribute("data-miaixz-theme", "remote");
    target.setAttribute("data-miaixz-density", "external");
    restore();
    expect(style.textContent).toBe("before");
    expect(target).toHaveAttribute("data-miaixz-theme", "before");
    expect(target).toHaveAttribute("data-miaixz-density", "external");
  });

  it("subscribes to system color-mode changes with idempotent cleanup", () => {
    let listener: ((event: { matches: boolean }) => void) | undefined;
    const remove = vi.fn();
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        matches: false,
        addEventListener: (_type: string, next: typeof listener) => {
          listener = next;
        },
        removeEventListener: remove,
      })),
    );
    const onChange = vi.fn();
    const stop = watchMiaixzSystemColorMode(onChange);
    listener?.({ matches: true });
    listener?.({ matches: false });
    expect(onChange).toHaveBeenNthCalledWith(1, "dark");
    expect(onChange).toHaveBeenNthCalledWith(2, "light");
    stop();
    stop();
    expect(remove).toHaveBeenCalledTimes(1);
  });
});

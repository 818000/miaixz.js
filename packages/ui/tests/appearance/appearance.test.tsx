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
 * Verifies the Appearance surface that consumes the independent icon package.
 */

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ChangeEventHandler, ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fixture = vi.hoisted(() => ({
  setColorMode: vi.fn(async () => undefined),
  setDensity: vi.fn(async () => undefined),
  setLocale: vi.fn(async () => undefined),
  setTheme: vi.fn(async () => undefined),
  theme: {
    colorMode: "light",
    density: "standard",
    error: null as Error | null,
    resolvedColorMode: "light",
    status: "ready",
    theme: "default",
    themes: [
      {
        name: "default",
        label: "Default",
        preview: {
          light: { brand: "#000", surface: "#fff", textPrimary: "#111" },
          dark: { brand: "#fff", surface: "#000", textPrimary: "#eee" },
        },
      },
      {
        name: "forest",
        label: "Forest",
        preview: {
          light: { brand: "#060", surface: "#efe", textPrimary: "#020" },
          dark: { brand: "#afa", surface: "#020", textPrimary: "#efe" },
        },
      },
    ],
  },
  locale: {
    loadError: null as Error | null,
    loadStatus: "ready",
    locale: "en-US",
    locales: [
      { id: "en-US", label: "English", shortLabel: "EN" },
      { id: "zh-CN", label: "简体中文", shortLabel: "中" },
    ],
  },
}));

vi.mock("../../src/theme/context.js", () => ({ useTheme: () => fixture.theme }));
vi.mock("../../src/i18n/i18n.js", () => ({
  useMiaixzLocale: () => ({
    ...fixture.locale,
    setLocale: fixture.setLocale,
    t: (key: string) => key,
  }),
}));
vi.mock("../../src/theme/binding.js", () => ({
  withMiaixzThemeComponent: (_name: string, component: unknown) => component,
}));
vi.mock("../../src/appearance/use-appearance-position.js", async () => {
  const React = await import("react");
  return {
    useAppearancePosition: ({ onActivate }: { readonly onActivate: () => void }) => ({
      canMove: true,
      dragging: false,
      positionStyle: { insetBlockStart: "12px" },
      rootRef: React.createRef<HTMLDivElement>(),
      triggerHandlers: { onClick: onActivate },
    }),
  };
});
vi.mock("../../src/components/drawer/drawer.js", () => ({
  Drawer: ({
    children,
    description,
    onOpenChange,
    open,
    title,
  }: {
    readonly children: ReactNode;
    readonly description?: ReactNode;
    readonly onOpenChange: (open: boolean) => void;
    readonly open: boolean;
    readonly title: ReactNode;
  }) =>
    open ? (
      <div aria-label={String(title)} role="dialog">
        <p>{description}</p>
        {children}
        <button onClick={() => onOpenChange(false)} type="button">
          mock-close
        </button>
      </div>
    ) : null,
}));
vi.mock("../../src/components/radio/radio.js", () => ({
  Radio: ({
    checked,
    disabled,
    label,
    onChange,
    value,
  }: {
    readonly checked: boolean;
    readonly disabled?: boolean;
    readonly label: ReactNode;
    readonly onChange: ChangeEventHandler<HTMLInputElement>;
    readonly value: string;
  }) => (
    <label>
      <input checked={checked} disabled={disabled} onChange={onChange} type="radio" value={value} />
      {label}
    </label>
  ),
}));
vi.mock("../../src/components/locale/locale.js", () => ({
  Locale: ({
    disabled,
    onLocaleChange,
  }: {
    readonly disabled?: boolean;
    readonly onLocaleChange: (locale: string) => void;
  }) => (
    <button disabled={disabled} onClick={() => onLocaleChange("zh-CN")} type="button">
      choose-locale
    </button>
  ),
}));
vi.mock("../../src/components/action/action-text.js", () => ({
  ActionText: ({
    action,
  }: {
    readonly action: { readonly label: ReactNode; onAction: () => void };
  }) => (
    <button onClick={action.onAction} type="button">
      {action.label}
    </button>
  ),
}));
vi.mock("@miaixz/icons", () => ({
  Icon: ({ name }: { readonly name: string }) => <i data-icon={name} />,
}));

import { Appearance } from "../../src/appearance/appearance.js";

afterEach(cleanup);

beforeEach(() => {
  vi.clearAllMocks();
  Object.assign(fixture.theme, {
    colorMode: "light",
    density: "standard",
    error: null,
    resolvedColorMode: "light",
    status: "ready",
    theme: "default",
    setColorMode: fixture.setColorMode,
    setDensity: fixture.setDensity,
    setTheme: fixture.setTheme,
  });
  Object.assign(fixture.locale, {
    loadError: null,
    loadStatus: "ready",
    locale: "en-US",
  });
});

describe("Appearance", () => {
  it("rejects a non-finite controlled position", () => {
    expect(() => render(<Appearance positionBlockPx={Number.NaN} scope="public" />)).toThrow(
      expect.objectContaining({ code: "UI_APPEARANCE_POSITION_INVALID" }),
    );
  });

  it("renders the public settings and resets its nested view when closed", async () => {
    render(<Appearance scope="public" />);
    fireEvent.click(screen.getByRole("button", { name: "ui.appearance.open" }));
    expect(screen.getByRole("dialog", { name: "ui.appearance.title" })).toBeInTheDocument();
    expect(screen.queryByText("ui.appearance.theme")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "ui.appearance.language.open" }));
    expect(screen.getByRole("dialog", { name: "ui.appearance.language" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "choose-locale" }));
    await waitFor(() => expect(fixture.setLocale).toHaveBeenCalledWith("zh-CN"));
    expect(screen.getByRole("dialog", { name: "ui.appearance.title" })).toBeInTheDocument();
    fireEvent.click(screen.getByText("mock-close"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("updates authenticated theme, mode, density, and header choices", () => {
    const onHeaderBehaviorChange = vi.fn();
    render(
      <Appearance
        headerBehavior="fixed"
        onHeaderBehaviorChange={onHeaderBehaviorChange}
        scope="authenticated"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "ui.appearance.open" }));
    const choice = (value: string) =>
      screen.getAllByRole("radio").find((input) => input.getAttribute("value") === value)!;
    fireEvent.click(choice("forest"));
    fireEvent.click(choice("dark"));
    fireEvent.click(choice("comfortable"));
    fireEvent.click(choice("scroll"));
    expect(fixture.setTheme).toHaveBeenCalledWith("forest");
    expect(fixture.setColorMode).toHaveBeenCalledWith("dark");
    expect(fixture.setDensity).toHaveBeenCalledWith("comfortable");
    expect(onHeaderBehaviorChange).toHaveBeenCalledWith("scroll");
  });

  it("exposes loading, read-only, fallback locale, and error states", () => {
    Object.assign(fixture.theme, { status: "loading", error: new Error("theme failure") });
    Object.assign(fixture.locale, {
      loadStatus: "loading",
      loadError: new Error("locale failure"),
      locale: "xx-YY",
      locales: [],
    });
    render(<Appearance scope="authenticated" />);
    fireEvent.click(screen.getByRole("button", { name: "ui.appearance.open" }));
    expect(screen.getByText("XX")).toBeInTheDocument();
    expect(screen.getByText("ui.appearance.readOnly")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("theme failure");
    expect(screen.getAllByRole("radio").every((input) => input.hasAttribute("disabled"))).toBe(
      true,
    );
    fireEvent.click(screen.getByRole("button", { name: "ui.appearance.language.open" }));
    expect(screen.getByRole("alert")).toHaveTextContent("locale failure");
    expect(screen.getByRole("button", { name: "choose-locale" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "ui.appearance.language.back" }));
    expect(screen.getByRole("dialog", { name: "ui.appearance.title" })).toBeInTheDocument();
  });
});

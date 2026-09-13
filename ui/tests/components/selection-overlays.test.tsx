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
 * Test-only callback contracts remain local to this file.
 */

import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Combobox } from "../../src/components/combobox/combobox.js";
import { validateMiaixzOptions } from "../../src/components/combobox/combobox-controller.js";
import { ComboboxPopup } from "../../src/components/combobox/combobox-popup.js";
import { Dropdown } from "../../src/components/dropdown/dropdown.js";
import { Picker } from "../../src/components/picker/picker.js";
import { validatePickerValue } from "../../src/components/picker/picker-model.js";
import { renderWithLocale } from "../test-utils.js";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const options = [
  {
    value: "alpha",
    label: "Alpha",
    textValue: "Alpha",
    description: "First",
    group: { id: "latin", label: "Latin" },
  },
  {
    value: "beta",
    label: "Beta",
    textValue: "Beta",
    group: { id: "latin", label: "Latin" },
  },
  { value: "gamma", label: "Gamma", textValue: "Gamma", disabled: true },
] as const;

describe("Combobox and Picker", () => {
  it("selects, submits, clears, filters, and closes one Combobox value", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = renderWithLocale(
      <Combobox
        defaultValue={options[0]}
        label="Owner"
        name="owner"
        options={options}
        renderOption={(option, state) => `${option.textValue}:${String(state.selected)}`}
        onValueChange={onValueChange}
      />,
    );
    const input = screen.getByRole("combobox", { name: "Owner" });
    expect(input).toHaveValue("Alpha");
    expect(container.querySelector<HTMLInputElement>('input[type="hidden"]')).toHaveValue("alpha");

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "" } });
    const listbox = await screen.findByRole("listbox", { name: "Owner" });
    expect(screen.getByRole("group", { name: "Latin" })).toBeInTheDocument();
    fireEvent.pointerMove(screen.getByRole("option", { name: "Beta:false" }));
    await user.click(screen.getByRole("option", { name: "Beta:false" }));
    expect(input).toHaveValue("Beta");
    expect(onValueChange).toHaveBeenCalledWith(options[1]);
    expect(listbox).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "移除" }));
    expect(input).toHaveValue("");
    await user.type(input, "missing");
    expect(await screen.findByText("没有可用选项")).toBeInTheDocument();
    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByRole("listbox", { name: "Owner" })).toBeNull();
  });

  it("loads asynchronous Combobox pages and exposes loading and error states", async () => {
    vi.useFakeTimers();
    const loadOptions = vi
      .fn()
      .mockResolvedValueOnce({ options: [options[0]], nextCursor: "next" })
      .mockResolvedValueOnce({ options: [options[1]], nextCursor: null });
    renderWithLocale(<Combobox label="Remote" loadOptions={loadOptions} />);
    const input = screen.getByRole("combobox", { name: "Remote" });
    fireEvent.focus(input);
    await act(async () => undefined);
    expect(screen.getByRole("status")).toHaveTextContent("加载中");
    await act(async () => {
      vi.advanceTimersByTime(200);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(screen.getByRole("option", { name: /Alpha/u })).toBeInTheDocument();

    const listbox = screen.getByRole("listbox", { name: "Remote" });
    Object.defineProperties(listbox, {
      scrollHeight: { configurable: true, value: 100 },
      clientHeight: { configurable: true, value: 50 },
      scrollTop: { configurable: true, value: 50 },
    });
    fireEvent.scroll(listbox);
    await act(async () => {
      vi.advanceTimersByTime(0);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(screen.getByRole("option", { name: /Beta/u })).toBeInTheDocument();
    expect(loadOptions).toHaveBeenLastCalledWith(
      expect.objectContaining({ cursor: "next", query: "" }),
    );
  });

  it("selects multiple Picker values, enforces the limit, and removes chips", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { container } = renderWithLocale(
      <Picker
        defaultValue={[options[0]]}
        label="Tags"
        name="tags"
        options={options}
        selectionLimit={2}
        onValueChange={onValueChange}
      />,
    );
    const input = screen.getByRole("combobox", { name: "Tags" });
    fireEvent.focus(input);
    await user.click(await screen.findByRole("option", { name: "Beta" }));
    expect(onValueChange).toHaveBeenCalledWith([options[0], options[1]]);
    expect(container.querySelectorAll('input[type="hidden"][name="tags"]')).toHaveLength(2);
    expect(screen.getByRole("option", { name: "Gamma" })).toHaveAttribute("aria-disabled", "true");
    await user.click(screen.getByRole("button", { name: "移除 Alpha" }));
    expect(screen.queryByRole("button", { name: "移除 Alpha" })).toBeNull();
    expect(container.querySelector('input[type="hidden"][value="alpha"]')).toBeNull();
  });

  it("rejects duplicate and incoherent option definitions", () => {
    expect(() =>
      validateMiaixzOptions(
        Array.from({ length: 501 }, (_, index) => ({
          value: `v-${index}`,
          label: index,
          textValue: `Value ${index}`,
        })),
        true,
      ),
    ).toThrowError(expect.objectContaining({ code: "UI_COLLECTION_VISIBLE_LIMIT" }));
    expect(() =>
      validateMiaixzOptions(
        [
          { value: "a", label: "A", textValue: "A", group: { id: "same", label: "One" } },
          { value: "b", label: "B", textValue: "B", group: { id: "same", label: "Two" } },
        ],
        false,
      ),
    ).toThrowError(expect.objectContaining({ code: "UI_COLLECTION_DUPLICATE_ID" }));
    expect(() => validatePickerValue(options.slice(0, 2), 1)).toThrowError(
      expect.objectContaining({ code: "UI_CONTROLLED_VALUE_INVALID" }),
    );
  });

  it("uses the complete Picker property and keyboard contract", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const onInputValueChange = vi.fn();
    const renderValue = vi.fn(
      (
        value: readonly (typeof options)[number][],
        state: {
          remove: (option: (typeof options)[number]) => void;
          disabled: boolean;
          readOnly: boolean;
        },
      ) => (
        <button type="button" onClick={() => value[0] !== undefined && state.remove(value[0])}>
          custom:{String(state.disabled)}:{String(state.readOnly)}:{value.length}
        </button>
      ),
    );
    const { container } = renderWithLocale(
      <>
        <span id="picker-label">External picker</span>
        <Picker
          aria-describedby="picker-help"
          aria-invalid="true"
          aria-labelledby="picker-label"
          className="picker-custom"
          defaultInputValue="initial"
          defaultValue={[options[0]]}
          disabled={false}
          emptyMessage="Nothing here"
          errorMessage="Remote failed"
          form="picker-form"
          id="picker-control"
          invalid
          label="Ignored by aria-labelledby"
          loadingMessage="Working"
          name="tags"
          onInputValueChange={onInputValueChange}
          onValueChange={onValueChange}
          options={options}
          placeholder="Find tag"
          refineMessage="Refine it"
          removeMessage="Delete"
          renderOption={(option, state) => `${option.label}:${String(state.selected)}`}
          renderValue={renderValue}
          required
          searchMessage="Search tags"
          selectionLimit={2}
          slotProps={{
            root: { className: "picker-root-slot" },
            label: { className: "picker-label-slot" },
            count: { className: "picker-count-slot" },
            values: { className: "picker-values-slot" },
            value: { className: "picker-value-slot" },
            valueLabel: { className: "picker-value-label-slot" },
            remove: { className: "picker-remove-slot" },
            hiddenInput: { className: "picker-hidden-slot" },
            surface: { className: "picker-surface-slot" },
            message: { className: "picker-message-slot" },
          }}
          style={{ color: "blue" }}
        />
      </>,
    );
    const input = screen.getByRole("combobox", { name: "External picker" });
    expect(input).toHaveAttribute("id", "picker-control");
    expect(input).toHaveAttribute("aria-required", "true");
    expect(input).toHaveAttribute("aria-describedby", "picker-help");
    expect(input.closest(".miaixz-picker")).toHaveClass("picker-custom", "picker-root-slot");
    expect(screen.getByRole("button", { name: /custom:false:false:1/u })).toBeInTheDocument();
    expect(container.querySelector<HTMLInputElement>("input.picker-hidden-slot")).toMatchObject({
      name: "tags",
      value: "alpha",
    });
    await user.click(screen.getByRole("button", { name: /custom:false:false:1/u }));
    expect(onValueChange).toHaveBeenCalledWith([]);

    fireEvent.change(input, { target: { value: "be" } });
    expect(onInputValueChange).toHaveBeenCalledWith("be");
    expect(screen.getByRole("button", { name: "移除" })).toBeInTheDocument();
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "End" });
    fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.keyDown(input, { key: "Escape" });
    fireEvent.keyDown(input, { key: "ArrowUp" });
    fireEvent.keyDown(input, { key: "Tab" });
    fireEvent.keyDown(input, { key: "Unidentified" });
  });

  it("keeps readonly and disabled Picker states immutable", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const readonly = renderWithLocale(
      <Picker
        label="Readonly tags"
        onValueChange={onValueChange}
        options={options}
        readOnly
        value={[options[0]]}
      />,
    );
    const input = screen.getByRole("combobox", { name: "Readonly tags" });
    expect(input).toHaveAttribute("readonly");
    expect(screen.getByRole("button", { name: "移除 Alpha" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "移除 Alpha" }));
    expect(onValueChange).not.toHaveBeenCalled();
    readonly.unmount();

    renderWithLocale(<Picker disabled label="Disabled tags" options={options} />);
    const disabledInput = screen.getByRole("combobox", { name: "Disabled tags" });
    expect(disabledInput).toBeDisabled();
    fireEvent.focus(disabledInput);
    fireEvent.keyDown(disabledInput, { key: "ArrowDown" });
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("rejects ambiguous sources and every invalid selection limit", () => {
    expect(() => renderWithLocale((<Picker label="Missing" />) as never)).toThrowError(
      expect.objectContaining({ code: "UI_OPTIONS_SOURCE_INVALID" }),
    );
    expect(() =>
      renderWithLocale((<Picker label="Both" options={options} loadOptions={vi.fn()} />) as never),
    ).toThrowError(expect.objectContaining({ code: "UI_OPTIONS_SOURCE_INVALID" }));
    expect(() =>
      renderWithLocale(<Picker label="Zero" options={options} selectionLimit={0} />),
    ).toThrowError(expect.objectContaining({ code: "UI_SELECTION_LIMIT_INVALID" }));
    expect(() =>
      renderWithLocale(<Picker label="Fraction" options={options} selectionLimit={1.5} />),
    ).toThrowError(expect.objectContaining({ code: "UI_SELECTION_LIMIT_INVALID" }));
  });

  it("renders every finite popup state and loads the next page only at the boundary", () => {
    const onLoadNextPage = vi.fn();
    const ownerState = {
      disabled: false,
      readOnly: false,
      invalid: false,
      open: true,
      filled: false,
      loading: false,
    } as const;
    const popup = (state: "idle" | "loading" | "error" | "limit", empty = false) => (
      <ComboboxPopup
        component="combobox"
        empty={empty}
        emptyMessage="Empty"
        errorMessage="Error"
        hasNextPage
        labelId="label"
        listboxId={`list-${state}-${String(empty)}`}
        loadingMessage="Loading"
        onLoadNextPage={onLoadNextPage}
        ownerState={ownerState}
        refineMessage="Refine"
        slotProps={{ surface: { className: "surface" }, message: { className: "message" } }}
        state={state}
        surfaceRef={createRef()}
      >
        Ready
      </ComboboxPopup>
    );
    const { container } = renderWithLocale(
      <>
        {popup("idle")}
        {popup("loading")}
        {popup("error")}
        {popup("limit")}
        {popup("idle", true)}
      </>,
    );
    expect(screen.getByText("Ready")).toBeInTheDocument();
    expect(screen.getByText("Loading")).toHaveAttribute("role", "status");
    expect(screen.getByText("Error")).toHaveAttribute("role", "alert");
    expect(screen.getByText("Refine")).toHaveClass("message");
    expect(screen.getByText("Empty")).toHaveAttribute("role", "status");
    const surface = container.querySelector<HTMLElement>('[data-state="idle"]')!;
    Object.defineProperties(surface, {
      scrollHeight: { configurable: true, value: 100 },
      clientHeight: { configurable: true, value: 40 },
      scrollTop: { configurable: true, value: 10, writable: true },
    });
    fireEvent.scroll(surface);
    expect(onLoadNextPage).not.toHaveBeenCalled();
    surface.scrollTop = 60;
    fireEvent.scroll(surface);
    expect(onLoadNextPage).toHaveBeenCalledOnce();
  });
});

describe("Dropdown", () => {
  it("runs the complete action, checkbox, radio, link, submenu, and keyboard contract", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const onCheckedChange = vi.fn();
    const onValueChange = vi.fn();
    renderWithLocale(
      <>
        <button type="button">Before</button>
        <Dropdown
          label="Actions"
          trigger={<button type="button">Open actions</button>}
          items={[
            { id: "heading", kind: "label", label: "Commands" },
            { id: "divider", kind: "divider" },
            { id: "run", kind: "action", label: "Run", textValue: "Run", onAction },
            {
              id: "check",
              kind: "checkbox",
              label: "Pinned",
              textValue: "Pinned",
              checked: true,
              onCheckedChange,
            },
            {
              id: "radio",
              kind: "radioGroup",
              label: "Mode",
              value: "one",
              onValueChange,
              options: [
                { id: "one", value: "one", label: "One", textValue: "One" },
                { id: "two", value: "two", label: "Two", textValue: "Two" },
              ],
            },
            { id: "docs", kind: "link", href: "#docs", label: "Docs", textValue: "Docs" },
            {
              id: "more",
              kind: "submenu",
              label: "More",
              textValue: "More",
              items: [
                {
                  id: "nested",
                  kind: "action",
                  label: "Nested",
                  textValue: "Nested",
                  onAction,
                },
              ],
            },
          ]}
        />
        <button type="button">After</button>
      </>,
    );
    const trigger = screen.getByRole("button", { name: "Open actions" });
    await user.click(trigger);
    const menu = await screen.findByRole("menu", { name: "Actions" });
    await waitFor(() => expect(screen.getByRole("menuitem", { name: "Run" })).toHaveFocus());
    fireEvent.keyDown(menu, { key: "End" });
    expect(screen.getByRole("menuitem", { name: "More" })).toHaveFocus();
    fireEvent.keyDown(screen.getByRole("menuitem", { name: "More" }), { key: "ArrowRight" });
    const nestedMenu = await screen.findByRole("menu", { name: "" });
    expect(screen.getByRole("menuitem", { name: "Nested" })).toBeInTheDocument();
    fireEvent.keyDown(nestedMenu, { key: "Escape" });
    await waitFor(() => expect(screen.getByRole("menuitem", { name: "More" })).toHaveFocus());

    await user.click(screen.getByRole("menuitem", { name: "Run" }));
    expect(onAction).toHaveBeenCalled();
    await user.click(trigger);
    await user.click(screen.getByRole("menuitemcheckbox", { name: "Pinned" }));
    expect(onCheckedChange).toHaveBeenCalledWith(false, expect.anything());
    await user.click(trigger);
    await user.click(screen.getByRole("menuitemradio", { name: "Two" }));
    expect(onValueChange).toHaveBeenCalledWith("two", expect.anything());
    await user.click(trigger);
    fireEvent.keyDown(screen.getByRole("menuitem", { name: "Run" }), { key: "d" });
    expect(screen.getByRole("menuitem", { name: "Docs" })).toHaveFocus();
    fireEvent.keyDown(screen.getByRole("menu", { name: "Actions" }), { key: "Tab" });
    await waitFor(() => expect(screen.queryByRole("menu", { name: "Actions" })).toBeNull());
  });

  it("rejects invalid offsets, labels, IDs, and controlled radio values", () => {
    expect(() =>
      renderWithLocale(
        <Dropdown offset={-1} trigger={<button type="button">Invalid</button>} items={[]} />,
      ),
    ).toThrowError(expect.objectContaining({ code: "UI_POPOVER_OFFSET_INVALID" }));
    expect(() =>
      renderWithLocale(
        <Dropdown
          trigger={<button type="button">Invalid</button>}
          items={[
            { id: "x", kind: "action", label: "X", textValue: " ", onAction: () => undefined },
          ]}
        />,
      ),
    ).toThrowError(expect.objectContaining({ code: "UI_COLLECTION_TEXT_VALUE_INVALID" }));
    expect(() =>
      renderWithLocale(
        <Dropdown
          trigger={<button type="button">Invalid</button>}
          items={[
            {
              id: "group",
              kind: "radioGroup",
              label: "Mode",
              value: "missing",
              onValueChange: () => undefined,
              options: [{ id: "one", value: "one", label: "One", textValue: "One" }],
            },
          ]}
        />,
      ),
    ).toThrowError(expect.objectContaining({ code: "UI_CONTROLLED_VALUE_INVALID" }));
  });
});
